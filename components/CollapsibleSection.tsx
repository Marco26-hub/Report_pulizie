"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

export default function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children
}: {
  title: string;
  count?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="font-semibold">{title}</span>
        <span className="flex items-center gap-2 text-sm text-gray-500">
          {count && <span>{count}</span>}
          <ChevronDown className={clsx("transition", open && "rotate-180")} size={18} />
        </span>
      </button>
      {open && <div className="border-t border-gray-100 p-3 space-y-1">{children}</div>}
    </div>
  );
}
