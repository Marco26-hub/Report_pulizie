"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, ChevronDown, Copy, Check } from "lucide-react";
import clsx from "clsx";

type Employee = {
  id: string; full_name: string; role: string;
  whatsapp_number: string | null; telegram_username: string | null;
  can_send_whatsapp: boolean; can_send_telegram: boolean; can_send_email: boolean;
  created_at: string;
};

const ROLE_LABEL: Record<string, string> = { employee: "Operatore", admin: "Admin" };
const ROLE_COLOR: Record<string, string> = { employee: "bg-gray-100 text-gray-700", admin: "bg-brand-100 text-brand-700" };

export default function EmployeesList({ employees, currentUserId }: { employees: Employee[]; currentUserId: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", role: "employee", temp_password: "" });
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createdCreds, setCreatedCreds] = useState<{ name: string; email: string; password: string } | null>(null);

  async function createEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!form.temp_password || form.temp_password.length < 8) return toast.error("Password minimo 8 caratteri");
    setBusy(true);
    const res = await fetch("/api/employees/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form)
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json();
      return toast.error(d.error ?? "Errore creazione");
    }
    setCreatedCreds({ name: form.full_name, email: form.email, password: form.temp_password });
    setForm({ full_name: "", email: "", role: "employee", temp_password: "" });
    setShowForm(false);
    router.refresh();
  }

  async function toggleChannel(id: string, field: string, val: boolean) {
    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [field]: val })
    });
    if (!res.ok) toast.error("Errore aggiornamento");
    else router.refresh();
  }

  async function changeRole(id: string, role: string) {
    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role })
    });
    if (!res.ok) toast.error("Errore cambio ruolo");
    else { toast.success("Ruolo aggiornato"); router.refresh(); }
  }

  async function deleteEmployee(id: string, name: string) {
    if (!confirm(`Eliminare ${name}? L'accesso sarà revocato.`)) return;
    const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); toast.error(d.error ?? "Errore"); }
    else { toast.success("Dipendente eliminato"); router.refresh(); }
  }

  function genPassword() {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
    setForm((f) => ({ ...f, temp_password: Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") }));
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setShowForm(!showForm)} className="btn-primary w-full">
        <UserPlus size={18} className="mr-2" />Aggiungi dipendente
      </button>

      {createdCreds && (
        <div className="card p-4 border-2 border-green-400 space-y-3">
          <div className="font-semibold text-green-700">Account creato — nessuna email inviata</div>
          <p className="text-xs text-gray-600">Comunica queste credenziali a <strong>{createdCreds.name}</strong> manualmente.</p>
          <CredRow label="Email" value={createdCreds.email} />
          <CredRow label="Password" value={createdCreds.password} />
          <button onClick={() => setCreatedCreds(null)} className="btn-secondary w-full text-sm">Chiudi</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={createEmployee} className="card p-4 space-y-3">
          <div><label className="label">Nome completo *</label>
            <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
          <div><label className="label">Email *</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div><label className="label">Ruolo</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="employee">Operatore</option>
              <option value="admin">Admin</option>
            </select></div>
          <div>
            <label className="label">Password temporanea *</label>
            <div className="flex gap-2">
              <input className="input flex-1" value={form.temp_password}
                onChange={(e) => setForm({ ...form, temp_password: e.target.value })}
                placeholder="min. 8 caratteri" required />
              <button type="button" onClick={genPassword} className="btn-secondary text-sm px-3">Genera</button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Comunica questa password al dipendente — la cambierà dal profilo.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annulla</button>
            <button type="submit" disabled={busy} className="btn-primary">{busy ? "Creazione…" : "Crea"}</button>
          </div>
        </form>
      )}

      {employees.length === 0 && <div className="card p-6 text-center text-gray-500">Nessun dipendente.</div>}

      <ul className="space-y-2">
        {employees.map((emp) => {
          const isExpanded = expandedId === emp.id;
          const isSelf = emp.id === currentUserId;
          return (
            <li key={emp.id} className="card overflow-hidden">
              <div className="p-3 flex items-center justify-between gap-2"
                onClick={() => setExpandedId(isExpanded ? null : emp.id)}>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{emp.full_name}{isSelf && <span className="ml-1 text-xs text-gray-400">(tu)</span>}</div>
                </div>
                <span className={`chip ${ROLE_COLOR[emp.role] ?? "bg-gray-100"}`}>{ROLE_LABEL[emp.role] ?? emp.role}</span>
                <ChevronDown size={16} className={clsx("text-gray-400 transition", isExpanded && "rotate-180")} />
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Ruolo</div>
                      <select className="input text-sm" value={emp.role}
                        onChange={(e) => changeRole(emp.id, e.target.value)}
                        disabled={isSelf}>
                        <option value="employee">Operatore</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Canali abilitati</div>
                    <div className="space-y-2">
                      {([
                        { field: "can_send_whatsapp", label: "WhatsApp", val: emp.can_send_whatsapp },
                        { field: "can_send_telegram", label: "Telegram", val: emp.can_send_telegram },
                        { field: "can_send_email", label: "Email", val: emp.can_send_email }
                      ] as const).map(({ field, label, val }) => (
                        <label key={field} className="flex items-center gap-3">
                          <input type="checkbox" className="w-4 h-4 accent-brand-600"
                            checked={val} onChange={(e) => toggleChannel(emp.id, field, e.target.checked)} />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {!isSelf && (
                    <button onClick={() => deleteEmployee(emp.id, emp.full_name)}
                      className="btn-danger w-full text-sm">
                      <Trash2 size={14} className="mr-2" />Elimina dipendente
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CredRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="flex items-center justify-between gap-2 bg-gray-50 rounded px-3 py-2">
      <div>
        <span className="text-xs text-gray-500">{label}: </span>
        <span className="font-mono text-sm font-semibold">{value}</span>
      </div>
      <button onClick={copy} className="text-gray-400 hover:text-gray-700 transition">
        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
      </button>
    </div>
  );
}
