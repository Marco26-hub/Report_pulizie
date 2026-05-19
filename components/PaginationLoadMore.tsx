import Link from "next/link";

export interface CursorParams {
  cursor_date?: string;
  cursor_id?: string;
}

export function buildCursorHref(base: string, existing: Record<string, string>, cursorDate: string, cursorId: string): string {
  const p = new URLSearchParams(existing);
  p.set("cursor_date", cursorDate);
  p.set("cursor_id", cursorId);
  return `${base}?${p.toString()}`;
}

export function PaginationLoadMore({
  href,
  hasMore
}: {
  href: string;
  hasMore: boolean;
}) {
  if (!hasMore) return null;
  return (
    <div className="text-center pt-2 pb-6">
      <Link href={href} className="btn-secondary text-sm inline-block px-6">
        Carica altri
      </Link>
    </div>
  );
}
