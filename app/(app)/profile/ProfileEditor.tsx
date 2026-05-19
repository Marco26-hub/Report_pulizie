"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ProfileEditor({ user, profile }: { user: any; profile: any }) {
  const router = useRouter();
  const sb = supabaseBrowser();
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    whatsapp_number: profile.whatsapp_number ?? "",
    telegram_username: profile.telegram_username ?? ""
  });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const { error } = await sb.from("profiles").update({
      full_name: form.full_name,
      phone: form.phone || null,
      whatsapp_number: form.whatsapp_number || null,
      telegram_username: form.telegram_username || null
    }).eq("id", profile.id);
    setSavingProfile(false);
    if (error) return toast.error(error.message);
    toast.success("Profilo salvato");
    router.refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) return toast.error("Le password non coincidono");
    if (pwd.next.length < 8) return toast.error("Password minimo 8 caratteri");
    setSavingPwd(true);
    const { error } = await sb.auth.updateUser({ password: pwd.next });
    setSavingPwd(false);
    if (error) return toast.error(error.message);
    toast.success("Password aggiornata");
    setPwd({ current: "", next: "", confirm: "" });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Profilo</h1>

      <form onSubmit={saveProfile} className="card p-4 space-y-3">
        <h2 className="font-semibold">Dati personali</h2>
        <div>
          <label className="label">Email</label>
          <input className="input bg-gray-50" value={user.email} disabled />
        </div>
        <div>
          <label className="label">Nome completo *</label>
          <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Telefono</label>
          <input type="tel" className="input" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+39 333 000 0000" />
        </div>
        <div>
          <label className="label">Numero WhatsApp</label>
          <input type="tel" className="input" value={form.whatsapp_number}
            onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="+39 333 000 0000" />
        </div>
        <div>
          <label className="label">Username Telegram</label>
          <input className="input" value={form.telegram_username}
            onChange={(e) => setForm({ ...form, telegram_username: e.target.value })} placeholder="@username" />
        </div>
        <div className="text-xs text-gray-500">
          <span className="font-medium">Ruolo:</span> {profile.role === "admin" ? "Admin" : "Operatore"}
        </div>
        <button type="submit" disabled={savingProfile} className="btn-primary w-full">
          {savingProfile ? "Salvataggio…" : "Salva profilo"}
        </button>
      </form>

      <form onSubmit={changePassword} className="card p-4 space-y-3">
        <h2 className="font-semibold">Cambia password</h2>
        <div>
          <label className="label">Nuova password</label>
          <input type="password" className="input" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
        </div>
        <div>
          <label className="label">Conferma password</label>
          <input type="password" className="input" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
        </div>
        <button type="submit" disabled={savingPwd} className="btn-secondary w-full">
          {savingPwd ? "Aggiornamento…" : "Aggiorna password"}
        </button>
      </form>

      <form action="/auth/signout" method="post">
        <button className="btn-danger w-full">Esci</button>
      </form>
    </div>
  );
}
