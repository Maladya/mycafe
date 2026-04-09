import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banknote, CheckCircle2, Landmark, Loader2, RefreshCw, Wallet } from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://192.168.1.5:3000").replace(/\/$/, "");

const fmt = (n) => `Rp${Number(n || 0).toLocaleString("id-ID")}`;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
  };
}

function formatTxDate(iso) {
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

function labelPaymentMethod(pm) {
  const m = String(pm || "").toLowerCase().trim();
  if (m === "online") return "Pembayaran Online";
  if (m === "tunai") return "Tunai";
  if (m === "qris" || m === "qr") return "QRIS";
  if (!m) return "-";
  return pm;
}

function parseAmountId(str) {
  const n = Number(String(str || "").replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function withdrawalStatusLabel(st) {
  const s = String(st || "").toLowerCase();
  if (s === "completed") return "Selesai";
  if (s === "rejected") return "Ditolak";
  if (s === "pending") return "Menunggu";
  if (s === "processing") return "Diproses (1×24 jam)";
  return st || "-";
}

function withdrawalStatusClass(st) {
  const s = String(st || "").toLowerCase();
  if (s === "completed") return "bg-emerald-100 text-emerald-800";
  if (s === "rejected") return "bg-red-100 text-red-800";
  if (s === "pending") return "bg-slate-100 text-slate-700";
  return "bg-amber-100 text-amber-700";
}

function MetodePencairanModal({ open, onClose, onConfirm, maxAmount, submitting }) {
  const [selectedMethod, setSelectedMethod] = useState("transfer-bank");
  const [amountStr, setAmountStr] = useState("");
  const [nomorTujuan, setNomorTujuan] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedMethod("transfer-bank");
    setAmountStr("");
    setNomorTujuan("");
    setBankName("");
    setAccountHolder("");
    setError("");
  }, [open]);

  const handleSubmit = () => {
    const amount = parseAmountId(amountStr);
    if (amount <= 0) {
      setError("Nominal wajib diisi (lebih dari 0).");
      return;
    }
    if (maxAmount > 0 && amount > maxAmount) {
      setError(`Nominal tidak boleh melebihi saldo tersedia (${fmt(maxAmount)}).`);
      return;
    }
    const v = nomorTujuan.trim().replace(/\s/g, "");
    if (selectedMethod === "transfer-bank") {
      const digits = v.replace(/\D/g, "");
      if (digits.length < 8) {
        setError("No. rekening minimal 8 digit.");
        return;
      }
      onConfirm({
        method: selectedMethod,
        nomorTujuan: digits,
        amount,
        bankName: bankName.trim() || undefined,
        accountHolder: accountHolder.trim() || undefined,
      });
      return;
    }
    if (v.length < 8) {
      setError("Nomor akun e-wallet minimal 8 karakter.");
      return;
    }
    onConfirm({
      method: selectedMethod,
      nomorTujuan: v,
      amount,
      bankName: undefined,
      accountHolder: accountHolder.trim() || undefined,
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-gray-100 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-black text-gray-900">Ajukan Pencairan</h2>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Isi nominal dan tujuan. Data dikirim ke server sesuai kebijakan pencairan.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Nominal pencairan</label>
          <input
            type="text"
            inputMode="numeric"
            value={amountStr}
            onChange={(e) => {
              setAmountStr(e.target.value);
              setError("");
            }}
            placeholder="Contoh: 500000"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
          {maxAmount > 0 ? (
            <p className="text-[11px] text-gray-400 mt-1">Maksimal {fmt(maxAmount)} (saldo tersedia).</p>
          ) : null}
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setSelectedMethod("transfer-bank");
              setError("");
            }}
            className={`w-full text-left rounded-xl border p-3 transition-all ${
              selectedMethod === "transfer-bank"
                ? "border-amber-400 bg-amber-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="font-bold text-gray-900 text-sm">Transfer Bank</p>
            <p className="text-xs text-gray-500 mt-0.5">Pencairan ke rekening.</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMethod("ewallet");
              setError("");
            }}
            className={`w-full text-left rounded-xl border p-3 transition-all ${
              selectedMethod === "ewallet"
                ? "border-amber-400 bg-amber-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="font-bold text-gray-900 text-sm">E-Wallet</p>
            <p className="text-xs text-gray-500 mt-0.5">Pencairan ke akun e-wallet.</p>
          </button>
        </div>

        {selectedMethod === "transfer-bank" ? (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama bank (opsional)</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Contoh: BCA"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Atas nama (opsional)</label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Nama pemilik rekening"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-amber-400"
              />
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Atas nama / catatan (opsional)</label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="Nama terdaftar di e-wallet"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-amber-400"
            />
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            {selectedMethod === "transfer-bank" ? "No. Rekening" : "Nomor akun e-wallet"}
          </label>
          <input
            type="text"
            inputMode={selectedMethod === "transfer-bank" ? "numeric" : "text"}
            autoComplete="off"
            value={nomorTujuan}
            onChange={(e) => {
              setNomorTujuan(e.target.value);
              setError("");
            }}
            placeholder={selectedMethod === "transfer-bank" ? "Contoh: 1234567890" : "Contoh: 081234567890"}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
        </div>

        {error ? <p className="text-xs font-semibold text-red-500 mt-2">{error}</p> : null}

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {submitting ? "Mengirim…" : "Kirim pengajuan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white border border-gray-100 shadow-2xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
          <CheckCircle2 size={28} />
        </div>
        <h2 className="text-lg font-black text-gray-900">Pengajuan Dikirim</h2>
        <p className="text-sm text-gray-500 mt-2">
          Permintaan pencairan tersimpan di server. Proses biasanya maksimal 1×24 jam setelah verifikasi.
        </p>
        <button
          onClick={onClose}
          className="w-full mt-6 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

export default function PencairanSaldo() {
  const navigate = useNavigate();
  const [saldoLoading, setSaldoLoading] = useState(true);
  const [saldoError, setSaldoError] = useState("");
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [totalTransaksi, setTotalTransaksi] = useState(0);
  const [transaksi, setTransaksi] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);
  const [withdrawalsError, setWithdrawalsError] = useState("");
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchSaldo = useCallback(async () => {
    setSaldoLoading(true);
    setSaldoError("");
    try {
      const res = await fetch(`${API_URL}/api/withdrawals/balance?limit=50`, {
        headers: authHeaders(),
      });
      const body = await res.json().catch(() => ({}));

      if (res.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (res.status === 403) {
        setSaldoError(body?.message || "Hanya admin cafe");
        setTotalSaldo(0);
        setTotalTransaksi(0);
        setTransaksi([]);
        return;
      }

      if (!res.ok) {
        const msg = body?.message || `Gagal memuat saldo (HTTP ${res.status})`;
        throw new Error(msg);
      }

      const data = body?.data ?? body;
      setTotalSaldo(Number(data?.total_saldo ?? 0));
      setTotalTransaksi(Number(data?.total_transaksi ?? 0));
      const list = Array.isArray(data?.transaksi) ? data.transaksi : [];
      setTransaksi(list);
    } catch (e) {
      setSaldoError(e?.message || "Gagal memuat saldo");
      setTotalSaldo(0);
      setTotalTransaksi(0);
      setTransaksi([]);
    } finally {
      setSaldoLoading(false);
    }
  }, [navigate]);

  const fetchWithdrawals = useCallback(async () => {
    setWithdrawalsLoading(true);
    setWithdrawalsError("");
    try {
      const res = await fetch(`${API_URL}/api/withdrawals?limit=100`, {
        headers: authHeaders(),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (!res.ok) {
        throw new Error(body?.message || body?.error || `Gagal memuat riwayat (HTTP ${res.status})`);
      }
      const data = body?.data ?? body;
      const list = Array.isArray(data) ? data : [];
      setWithdrawals(list);
    } catch (e) {
      setWithdrawalsError(e?.message || "Gagal memuat pengajuan");
      setWithdrawals([]);
    } finally {
      setWithdrawalsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSaldo();
  }, [fetchSaldo]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleMethodConfirm = async ({
    method,
    nomorTujuan,
    amount,
    bankName,
    accountHolder,
  }) => {
    const clientRef = `WD-${Date.now()}`;
    const apiMethod = method === "ewallet" ? "ewallet" : "transfer_bank";
    const body = {
      amount,
      client_ref: clientRef,
      method: apiMethod,
      account_number: nomorTujuan,
      bank_name: bankName,
      account_holder: accountHolder,
    };
    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${API_URL}/api/withdrawals`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const raw = await res.json().catch(() => ({}));

      if (res.status === 409) {
        await fetchWithdrawals();
        setShowMethodModal(false);
        setShowSuccessModal(true);
        await fetchSaldo();
        return;
      }

      if (!res.ok) {
        throw new Error(raw?.message || raw?.error || `HTTP ${res.status}`);
      }

      await fetchWithdrawals();
      await fetchSaldo();
      setShowMethodModal(false);
      setShowSuccessModal(true);
    } catch (e) {
      setSubmitError(e?.message || "Gagal mengirim pengajuan");
    } finally {
      setSubmitting(false);
    }
  };

  const refreshAll = () => {
    fetchSaldo();
    fetchWithdrawals();
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gray-50 font-sans">
      <div className="mb-7 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Pencairan Saldo</h1>
          <p className="text-gray-500 text-sm mt-1">
            Saldo dari transaksi berhasil dibayar. Ajukan pencairan — data tersimpan di server.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refreshAll()}
          disabled={saldoLoading || withdrawalsLoading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
        >
          {saldoLoading || withdrawalsLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Muat ulang
        </button>
      </div>

      {submitError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {submitError}
        </div>
      ) : null}

      {saldoError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {saldoError}
        </div>
      ) : null}

      <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 border border-amber-100 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
            <Banknote size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-amber-800/80 uppercase tracking-wide">Saldo Tersedia</p>
            {saldoLoading ? (
              <div className="flex items-center gap-2 mt-1">
                <Loader2 size={22} className="animate-spin text-amber-600" />
                <span className="text-sm font-semibold text-gray-500">Memuat saldo...</span>
              </div>
            ) : (
              <>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{fmt(totalSaldo)}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {totalTransaksi} transaksi tercatat · Ajukan pencairan sesuai kebutuhan.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pengajuan baru</p>
              <p className="text-lg font-black text-gray-900">Pencairan saldo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSubmitError("");
              setShowMethodModal(true);
            }}
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
          >
            Ajukan pencairan
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Riwayat Transaksi Saldo</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Akumulasi dari pembayaran yang sudah berhasil (sesuai server).
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {saldoLoading && transaksi.length === 0 ? (
            <div className="px-5 py-12 flex flex-col items-center justify-center text-gray-500">
              <Loader2 size={28} className="animate-spin text-amber-500 mb-2" />
              <p className="text-sm font-semibold">Memuat riwayat...</p>
            </div>
          ) : null}
          {!saldoLoading && transaksi.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-500">Belum ada transaksi saldo.</div>
          ) : null}
          {transaksi.map((t) => (
            <div
              key={`tx-${t.id}`}
              className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <p className="text-sm font-bold text-gray-900">{labelPaymentMethod(t.payment_method)}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t.order_id ?? `#${t.id}`} · {formatTxDate(t.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-black text-gray-900 min-w-[120px] text-left md:text-right">
                  +{fmt(t.amount)}
                </p>
                <span className="rounded-full px-3 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  Masuk
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Riwayat Pengajuan Pencairan</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {withdrawalsError || "Data dari server (GET /api/withdrawals)."}
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {withdrawalsLoading && withdrawals.length === 0 ? (
            <div className="px-5 py-12 flex justify-center">
              <Loader2 className="animate-spin text-amber-500" size={28} />
            </div>
          ) : null}
          {!withdrawalsLoading && withdrawals.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-500">
              Belum ada pengajuan. Klik &quot;Ajukan pencairan&quot;.
            </div>
          ) : null}
          {withdrawals.map((w) => (
            <div
              key={w.id ?? w.client_ref}
              className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {w.method === "ewallet" ? "E-Wallet" : "Transfer bank"}
                  {w.bank_name ? ` · ${w.bank_name}` : ""}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {w.client_ref || `#${w.id}`} · {formatTxDate(w.created_at)}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Rek. {w.account_number || "-"}
                  {w.account_holder ? ` · ${w.account_holder}` : ""}
                </p>
                {w.superadmin_note ? (
                  <p className="text-[11px] text-amber-700 mt-1 font-medium">Catatan: {w.superadmin_note}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm font-black text-gray-900">{fmt(w.amount)}</p>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${withdrawalStatusClass(w.status)}`}
                >
                  {withdrawalStatusLabel(w.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <Landmark size={14} />
        Pengajuan diproses oleh tim setelah verifikasi (biasanya dalam 1×24 jam).
      </div>

      <MetodePencairanModal
        open={showMethodModal}
        onClose={() => !submitting && setShowMethodModal(false)}
        onConfirm={handleMethodConfirm}
        maxAmount={totalSaldo}
        submitting={submitting}
      />

      <SuccessModal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setSubmitError("");
        }}
      />
    </div>
  );
}
