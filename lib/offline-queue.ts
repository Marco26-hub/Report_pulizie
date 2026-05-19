export interface QueueItem {
  id?: number;
  url: string;
  method: string;
  body?: any;
  label?: string;
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function enqueueMutation(item: QueueItem): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) {
      reject(new Error("no_service_worker"));
      return;
    }
    const channel = new MessageChannel();
    channel.port1.onmessage = (e) => {
      if (e.data?.type === "dcr-queued") resolve();
      else reject(new Error("queue_failed"));
    };
    navigator.serviceWorker.controller.postMessage(
      { type: "dcr-queue-add", payload: item },
      [channel.port2]
    );
  });
}

export function requestSync(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) {
      reject(new Error("no_service_worker"));
      return;
    }
    const channel = new MessageChannel();
    channel.port1.onmessage = (e) => {
      if (e.data?.type === "dcr-sync-done") resolve();
    };
    navigator.serviceWorker.controller.postMessage(
      { type: "dcr-sync-now" },
      [channel.port2]
    );
  });
}

export function getQueueCount(): Promise<number> {
  return new Promise((resolve) => {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) {
      resolve(0);
      return;
    }
    const channel = new MessageChannel();
    channel.port1.onmessage = (e) => {
      if (e.data?.type === "dcr-queue-count") resolve(e.data.count);
    };
    navigator.serviceWorker.controller.postMessage(
      { type: "dcr-queue-count" },
      [channel.port2]
    );
    setTimeout(() => resolve(0), 1000);
  });
}
