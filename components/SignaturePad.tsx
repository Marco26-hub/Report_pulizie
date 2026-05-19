"use client";
import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function SignaturePad({
  label,
  onChange,
  initial
}: {
  label: string;
  onChange: (dataUrl: string | null) => void;
  initial?: string | null;
}) {
  const ref = useRef<SignatureCanvas | null>(null);

  function save() {
    if (!ref.current || ref.current.isEmpty()) return onChange(null);
    onChange(ref.current.getCanvas().toDataURL("image/png"));
  }

  function clear() {
    ref.current?.clear();
    onChange(null);
  }

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{label}</span>
        <button type="button" onClick={clear} className="text-sm text-red-600">Pulisci</button>
      </div>
      <div className="border-2 border-dashed border-gray-300 rounded-xl bg-white">
        <SignatureCanvas
          ref={(r) => { ref.current = r; }}
          canvasProps={{ className: "w-full h-40 rounded-xl" }}
          onEnd={save}
        />
      </div>
      {initial && !ref.current && (
        <img src={initial} alt="firma esistente" className="mt-2 max-h-24" />
      )}
    </div>
  );
}
