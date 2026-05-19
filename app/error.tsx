"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Global error:", error); }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="card w-full max-w-md p-6 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl font-bold">!</div>
        <h1 className="text-xl font-semibold">Errore imprevisto</h1>
        <p className="text-sm text-gray-500">Qualcosa è andato storto. Abbiamo registrato il problema.</p>
        <button onClick={reset} className="btn-primary w-full">Riprova</button>
      </div>
    </div>
  );
}
