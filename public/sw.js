const CACHE = "dcr-v2";
const STATIC_ASSETS = ["/", "/login", "/manifest.webmanifest"];

// ----- Install: precache app shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

// ----- Activate: clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ----- Background Sync for offline mutations
self.addEventListener("sync", (e) => {
  if (e.tag === "dcr-sync") {
    e.waitUntil(flushQueue());
  }
});

async function flushQueue() {
  let queue = await readQueue();
  while (queue.length > 0) {
    const item = queue[0];
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: item.body ? JSON.stringify(item.body) : undefined
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      queue = queue.slice(1);
    } catch {
      // stop on first failure; retry next sync
      break;
    }
  }
  await writeQueue(queue);
}

// ----- IndexedDB helpers for offline queue
function openDB(): Promise<IDBRequest["result"]> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("dcr-offline", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function readQueue(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("queue", "readonly");
    const req = tx.objectStore("queue").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function writeQueue(items: any[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("queue", "readwrite");
    const store = tx.objectStore("queue");
    store.clear();
    items.forEach((item) => store.add(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Expose for page communication
self.addEventListener("message", (e) => {
  if (e.data?.type === "dcr-queue-add") {
    enqueueItem(e.data.payload).then(() => {
      if (e.source && "postMessage" in e.source) {
        (e.source as Window).postMessage({ type: "dcr-queued", id: e.data.payload.id });
      }
    });
  }
  if (e.data?.type === "dcr-sync-now") {
    flushQueue().then(() => {
      if (e.source && "postMessage" in e.source) {
        (e.source as Window).postMessage({ type: "dcr-sync-done" });
      }
    });
  }
  if (e.data?.type === "dcr-queue-count") {
    readQueue().then((q) => {
      if (e.source && "postMessage" in e.source) {
        (e.source as Window).postMessage({ type: "dcr-queue-count", count: q.length });
      }
    });
  }
});

async function enqueueItem(payload: { url: string; method: string; body?: any }): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("queue", "readwrite");
    tx.objectStore("queue").add(payload);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ----- Fetch: network-first for navigations, stale-while-revalidate for assets
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // Skip non-GET
  if (e.request.method !== "GET") return;

  // API GET: network-first with cache fallback
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(apiGetStrategy(e.request));
    return;
  }

  // Auth pages: network-only
  if (url.pathname.startsWith("/auth/")) {
    return;
  }

  // Navigation: network-first (stale page when offline)
  if (e.request.mode === "navigate") {
    e.respondWith(navStrategy(e.request));
    return;
  }

  // Static assets: stale-while-revalidate
  e.respondWith(assetStrategy(e.request));
});

async function apiGetStrategy(req: Request): Promise<Response> {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    return cached ?? new Response(JSON.stringify({ error: "offline" }), {
      status: 503, headers: { "Content-Type": "application/json" }
    });
  }
}

async function navStrategy(req: Request): Promise<Response> {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    return cached ?? (await cache.match("/")) ?? new Response("Offline", { status: 503 });
  }
}

async function assetStrategy(req: Request): Promise<Response> {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) {
    fetch(req).then((res) => { if (res.ok) cache.put(req, res); }).catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return new Response("", { status: 503 });
  }
}
