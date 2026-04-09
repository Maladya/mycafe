import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Loader2,
  Banknote,
  CheckCircle2,
  XCircle,
  Building2,
  Filter,
} from "lucide-react";
import { useSuperAdmin } from "../SuperAdminLayout";

const API_URL = (import.meta.env.VITE_API_URL ?? "https://api.mycafe-order.net").replace(/\/$/, "");

function fmt(n) {
  return `Rp${Number(n || 0).toLocaleString("id-ID")}`;
}

function fmtDate(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function statusBadge(st) {
  const s = String(st || "").toLowerCase();
  if (s === "completed")
    return { label: "Selesai", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  if (s === "rejected")
    return { label: "Ditolak", cls: "bg-red-100 text-red-800 border-red-200" };
  if (s === "pending")
    return { label: "Menunggu", cls: "bg-slate-100 text-slate-700 border-slate-200" };
  return { label: "Diproses (1×24 jam)", cls: "bg-amber-100 text-amber-800 border-amber-200" };
}

export default function PencairanWithdrawals() {
  const { showToast } = useSuperAdmin() || {};
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cafeIdFilter, setCafeIdFilter] = useState("");
  const [actingId, setActingId] = useState(null);
  const [modal, setModal] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("superadmin_token") || ""}`,
  });

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      qs.set("limit", "100");
      if (statusFilter) qs.set("status", statusFilter);
      if (cafeIdFilter.trim()) qs.set("cafe_id", cafeIdFilter.trim());

      const res = await fetch(`${API_URL}/api/superadmin/withdrawals?${qs.toString()}`, {
        headers: authHeaders(),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || body?.error || `HTTP ${res.status}`);

      const data = body?.data ?? body;
      const list = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
      setRows(list);
    } catch (e) {
      setError(e?.message || "Gagal memuat data");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, cafeIdFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (modal) setNoteDraft("");
  }, [modal]);

  const patchAction = async (id, action, note) => {
    setActingId(id);
    try {
      const path =
        action === "complete"
          ? `${API_URL}/api/superadmin/withdrawals/${id}/complete`
          : `${API_URL}/api/superadmin/withdrawals/${id}/reject`;
      const res = await fetch(path, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(note ? { superadmin_note: note } : {}),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || body?.error || `HTTP ${res.status}`);
      showToast?.(action === "complete" ? "Ditandai selesai" : "Pengajuan ditolak", "success");
      setModal(null);
      await fetchList();
    } catch (e) {
      showToast?.(e?.message || "Gagal", "error");
    } finally {
      setActingId(null);
    }
  };

  const canAct = (st) => {
    const s = String(st || "").toLowerCase();
    return s === "processing" || s === "pending";
  };

  const stats = useMemo(() => {
    const processing = rows.filter((r) =>
      ["processing", "pending"].includes(String(r?.status || "").toLowerCase())
    ).length;
    return { processing };
  }, [rows]);

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Pencairan Saldo Cafe</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola pengajuan pencairan dari cafe. Transfer manual lalu tandai selesai atau tolak.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchList()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Muat ulang
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-amber-600">
            <Banknote size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-amber-800/80 uppercase">Perlu tindakan</p>
            <p className="text-2xl font-black text-gray-900">{stats.processing}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm font-semibold text-gray-800 bg-transparent outline-none"
          >
            <option value="">Semua status</option>
            <option value="processing">Diproses</option>
            <option value="pending">Menunggu</option>
            <option value="completed">Selesai</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Filter cafe_id (opsional)"
          value={cafeIdFilter}
          onChange={(e) => setCafeIdFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium max-w-xs"
        />
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-purple-600" size={40} />
        </div>
      ) : null}

      {!loading && rows.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-gray-200 bg-white">
          <p className="text-gray-500 font-semibold">Belum ada pengajuan pencairan</p>
        </div>
      ) : null}

      <div className="space-y-4">
        {rows.map((w) => {
          const sb = statusBadge(w.status);
          const id = w.id;
          return (
            <div
              key={id}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-50 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-gray-900">{w.nama_cafe || `Cafe #${w.cafe_id}`}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Ref: {w.client_ref || "-"} · ID #{id} · {fmtDate(w.created_at)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold border ${sb.cls}`}
                >
                  {sb.label}
                </span>
              </div>
              <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <Building2 size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-extrabold text-gray-900 text-lg">{fmt(w.amount)}</p>
                    <p className="text-xs text-gray-500">
                      {w.method === "ewallet" ? "E-Wallet" : "Transfer bank"}
                      {w.bank_name ? ` · ${w.bank_name}` : ""}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {w.account_holder ? `${w.account_holder} · ` : ""}
                      Rek. {w.account_number || "-"}
                    </p>
                  </div>
                </div>
                {(w.superadmin_note || w.note) && (
                  <div className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3">
                    {w.note ? <p><span className="font-semibold">Catatan cafe:</span> {w.note}</p> : null}
                    {w.superadmin_note ? (
                      <p className={w.note ? "mt-1" : ""}>
                        <span className="font-semibold">Catatan admin:</span> {w.superadmin_note}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
              {canAct(w.status) && (
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={actingId === id}
                    onClick={() => setModal({ id, action: "complete" })}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <CheckCircle2 size={14} /> Tandai transfer selesai
                  </button>
                  <button
                    type="button"
                    disabled={actingId === id}
                    onClick={() => setModal({ id, action: "reject" })}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    <XCircle size={14} /> Tolak
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !actingId && setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-black text-gray-900">
              {modal.action === "complete" ? "Konfirmasi selesai" : "Tolak pengajuan"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {modal.action === "complete"
                ? "Setelah transfer manual ke rekening cafe selesai, konfirmasi di sini."
                : "Berikan alasan penolakan (opsional)."}
            </p>
            <textarea
              className="mt-4 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[88px]"
              placeholder="Catatan untuk cafe (opsional)"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600"
                onClick={() => setModal(null)}
                disabled={!!actingId}
              >
                Batal
              </button>
              <button
                type="button"
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white ${
                  modal.action === "complete" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={!!actingId}
                onClick={() => patchAction(modal.id, modal.action, noteDraft.trim())}
              >
                {actingId ? "…" : modal.action === "complete" ? "Selesai" : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
