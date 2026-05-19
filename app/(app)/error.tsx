"use client";
import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("App error:", error); }, [error]);

  return (
    <div className="flex items-center justify-center px-4 py-20">
      <div className="card w-full max-w-sm p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-xl font-bold">!</div>
        <h1 className="text-lg font-semibold">Errore</h1>
        <p className="text-sm text-gray-500">{error.message || "Si è verificato un errore."}</p>
        <button onClick={reset} className="btn-primary w-full">Riprova</button>
      </div>
    </div>
  );
}
