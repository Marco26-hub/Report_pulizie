import BottomNav from "@/components/BottomNav";
import OfflineBanner from "@/components/OfflineBanner";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser();
  return (
    <div className="min-h-screen pb-24">
      <OfflineBanner />
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Ciao,</div>
          <div className="font-semibold">{profile.full_name}</div>
        </div>
        <span className="chip bg-brand-50 text-brand-700">{profile.role === "admin" ? "Admin" : "Operatore"}</span>
      </header>
      <main className="px-4 py-4">{children}</main>
      <BottomNav isAdmin={profile.role === "admin"} />
    </div>
  );
}
