import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Shield, ChevronRight, CreditCard, Calendar, AlertCircle, Loader2, ExternalLink, RefreshCw } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.5:3000";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) => `Rp${Number(n || 0).toLocaleString("id-ID")}`;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
  };
}

function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(t));
}

function loadSnapScript(clientKey) {
  return new Promise((resolve, reject) => {
    if (window.snap) { resolve(); return; }
    const existing = document.getElementById("midtrans-snap");
    if (existing) { existing.addEventListener("load", resolve); return; }
    const script = document.createElement("script");
    script.id = "midtrans-snap";
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.onload = resolve;
    script.onerror = () => reject(new Error("Gagal memuat Midtrans Snap"));
    document.body.appendChild(script);
  });
}

// ─── KOMPONEN ─────────────────────────────────────────────────────────────────
export default function Billing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState(null);
  const [snapClientKey, setSnapClientKey] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Mode pembayaran:
  // - Popup Snap = aktif
  // - Redirect = tersedia, tapi dinonaktifkan sesuai permintaan
  const USE_REDIRECT = true;

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isSubReallyActive = (me) => {
    const st = String(me?.status ?? "").toLowerCase();
    const flagOk = st === "active" || Boolean(me?.is_active ?? me?.isActive);
    if (!flagOk) return false;
    const until = me?.active_until ?? me?.activeUntil ?? me?.expired_at ?? me?.expiredAt;
    if (!until) return true;
    try {
      const d = new Date(until);
      if (Number.isNaN(d.getTime())) return true;
      return d.getTime() > Date.now();
    } catch {
      return true;
    }
  };

  const pollUntilActive = async ({ intervalMs = 3000, timeoutMs = 60000 } = {}) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const me = await fetchMe();
      setSub(me);
      if (isSubReallyActive(me)) return me;
      await new Promise(r => setTimeout(r, intervalMs));
    }
    throw new Error("Pembayaran sedang diproses. Silakan refresh beberapa saat lagi.");
  };

  const checkSubscriptionNow = async () => {
    setChecking(true);
    try {
      showToast("Mengecek status langganan...", "info");
      const me = await pollUntilActive();
      setSub(me);
      try { sessionStorage.removeItem("astakira_pending_sub_checkout"); } catch {}
      showToast("Langganan sudah aktif!", "success");
      await refreshAll();
      navigate("/admin/dashboard", { replace: true });
    } catch (e) {
      showToast(e?.message || "Belum terkonfirmasi. Coba lagi sebentar.", "info");
    } finally {
      setChecking(false);
    }
  };

  const fetchPlans = async () => {
    const url = `${API_URL}/api/subscriptions/plans`;
    const res = await fetchWithTimeout(url, { headers: authHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("fetchPlans failed", { url, status: res.status, body: data });
      throw new Error(data?.message || `Gagal memuat paket (HTTP ${res.status})`);
    }
    const list = Array.isArray(data) ? data
      : Array.isArray(data?.data) ? data.data
      : Array.isArray(data?.plans) ? data.plans
      : [];
    return list;
  };

  const fetchMe = async () => {
    const url = `${API_URL}/api/subscriptions/me`;
    const res = await fetchWithTimeout(url, { headers: authHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("fetchMe failed", { url, status: res.status, body: data });
      throw new Error(data?.message || `Gagal memuat langganan (HTTP ${res.status})`);
    }
    return data?.data ?? data;
  };

  const fetchCafeClientKey = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      let cafeId = user?.cafe_id ?? user?.cafeId ?? user?.cafe?.id ?? "";

      if (!cafeId) {
        try {
          const latest = JSON.parse(localStorage.getItem("latest_cafe") || "{}");
          cafeId = latest?.id ?? latest?.cafe_id ?? latest?.cafeId ?? "";
        } catch {}
      }

      if (!cafeId) return "";
      const res = await fetchWithTimeout(`${API_URL}/api/pengaturan/user/${cafeId}`, { headers: authHeaders() });
      if (!res.ok) return "";
      const data = await res.json().catch(() => ({}));
      const raw = data?.data ?? data;
      return raw?.midtrans_client_key ?? raw?.snap_client_key ?? "";
    } catch {
      return "";
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [listPlans, me, key] = await Promise.all([
        fetchPlans(),
        fetchMe(),
        fetchCafeClientKey(),
      ]);
      setPlans(listPlans);
      setSub(me);
      const envKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY ?? "";
      const resolvedKey = key || envKey;
      if (resolvedKey) setSnapClientKey(resolvedKey);
    } catch (e) {
      console.error("refreshAll billing failed", e);
      showToast(e?.message || "Gagal memuat langganan", "error");
      setPlans([]);
      setSub(null);
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTotalSeconds = (me) => {
    const remaining = me?.remaining_time ?? me?.remainingTime ?? null;
    const totalSeconds = remaining?.total_seconds ?? remaining?.totalSeconds;
    if (Number.isFinite(Number(totalSeconds))) {
      return Math.max(0, Math.floor(Number(totalSeconds)));
    }
    const until = me?.active_until ?? me?.activeUntil ?? me?.expired_at ?? me?.expiredAt;
    if (!until) return 0;
    try {
      const d = new Date(until);
      if (Number.isNaN(d.getTime())) return 0;
      return Math.max(0, Math.floor((d.getTime() - Date.now()) / 1000));
    } catch {
      return 0;
    }
  };

  const breakdownSeconds = (total) => {
    const t = Math.max(0, Math.floor(Number(total) || 0));
    const days = Math.floor(t / 86400);
    const hours = Math.floor((t % 86400) / 3600);
    const minutes = Math.floor((t % 3600) / 60);
    const seconds = t % 60;
    return { days, hours, minutes, seconds };
  };

  useEffect(() => {
    refreshAll();

    // Kalau user balik dari redirect Midtrans, lakukan polling otomatis
    try {
      const ts = Number(sessionStorage.getItem("astakira_pending_sub_checkout") || 0);
      if (ts && Date.now() - ts < 10 * 60 * 1000) {
        checkSubscriptionNow();
      }
    } catch {}
  }, []);

  useEffect(() => {
    const ok = isSubReallyActive(sub);
    if (!ok) {
      setRemainingSeconds(0);
      return;
    }
    setRemainingSeconds(getRemainingTotalSeconds(sub));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub?.active_until, sub?.activeUntil, sub?.expired_at, sub?.expiredAt, sub?.status, sub?.is_active, sub?.isActive, sub?.remaining_time, sub?.remainingTime]);

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const t = setInterval(() => {
      setRemainingSeconds((s) => Math.max(0, Number(s || 0) - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [remainingSeconds]);

  const activePlanId = sub?.plan_id ?? sub?.planId ?? sub?.subscription_plan_id ?? null;
  const activeUntilRaw = sub?.active_until ?? sub?.activeUntil ?? sub?.expired_at ?? sub?.expiredAt ?? null;
  const isActive = String(sub?.status ?? "").toLowerCase() === "active" || Boolean(sub?.is_active ?? sub?.isActive);
  const remaining = useMemo(() => breakdownSeconds(remainingSeconds), [remainingSeconds]);

  const activePlan = useMemo(() => {
    const arr = Array.isArray(plans) ? plans : [];
    return arr.find(p => String(p.id) === String(activePlanId)) ?? null;
  }, [plans, activePlanId]);

  const sortedPlans = useMemo(() => {
    const arr = Array.isArray(plans) ? plans : [];
    return [...arr]
      .filter(p => Boolean(p.is_active ?? p.isActive ?? true))
      .sort((a, b) => {
        const sa = Number(a.sort_order ?? 9999);
        const sb = Number(b.sort_order ?? 9999);
        if (sa !== sb) return sa - sb;
        return Number(a.id ?? 0) - Number(b.id ?? 0);
      });
  }, [plans]);

  const getFeatures = (p) => {
    const f = p?.features_json ?? p?.featuresJson ?? p?.features ?? {};
    if (!f || typeof f !== "object") return [];
    return Object.entries(f)
      .filter(([, v]) => v === true)
      .map(([k]) => k);
  };

  const startCheckout = async (plan) => {
    if (!plan?.id) return;
    setPaying(true);
    try {
      const res = await fetchWithTimeout(`${API_URL}/api/subscriptions/checkout`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ plan_id: plan.id, price: Number(plan.price ?? 0) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const expected = data?.expected_price ?? data?.expected_amount;
        const msg = expected
          ? `${data?.message || "Harga tidak sesuai"} (seharusnya ${fmt(expected)})`
          : (data?.message || `HTTP ${res.status}`);
        throw new Error(msg);
      }
      const payload = data?.data ?? data;
      const snapToken = payload?.snap_token ?? payload?.snapToken;
      const redirectUrl = payload?.redirect_url ?? payload?.redirectUrl;

      // Default: Redirect flow (frontend tidak perlu Client Key)
      if (redirectUrl) {
        try { sessionStorage.setItem("astakira_pending_sub_checkout", String(Date.now())); } catch {}
        window.location.href = redirectUrl;
        return;
      }

      // Fallback: Popup Snap (butuh Client Key + snap_token)
      if (!snapClientKey) throw new Error("Redirect URL tidak tersedia dari backend. Untuk popup Snap, isi Client Key di pengaturan cafe (midtrans_client_key) atau set VITE_MIDTRANS_CLIENT_KEY=Mid-client-... di frontend.");
      if (String(snapClientKey).startsWith("Mid-server-")) throw new Error("Client Key tidak valid (terdeteksi Mid-server-...).");
      if (!snapToken) throw new Error("Snap token tidak ditemukan");

      await loadSnapScript(snapClientKey);
      if (!window.snap?.pay) throw new Error("Midtrans Snap tidak tersedia");

      window.snap.pay(snapToken, {
        onSuccess: async () => {
          showToast("Pembayaran berhasil! Mengecek status langganan...", "success");
          try {
            await pollUntilActive({ intervalMs: 2000, timeoutMs: 60000 });
            showToast("Langganan sudah aktif!", "success");
          } catch {}
          try { sessionStorage.removeItem("astakira_pending_sub_checkout"); } catch {}
          await refreshAll();
        },
        onPending: () => showToast("Pembayaran pending. Silakan selesaikan pembayaran.", "info"),
        onError: () => showToast("Pembayaran gagal.", "error"),
        onClose: () => showToast("Popup pembayaran ditutup.", "info"),
      });
    } catch (e) {
      showToast(e?.message || "Gagal memulai pembayaran", "error");
    } finally {
      setPaying(false);
    }
  };

  const formatActiveUntil = () => {
    if (!activeUntilRaw) return "-";
    try {
      const d = new Date(activeUntilRaw);
      if (isNaN(d.getTime())) return String(activeUntilRaw);
      return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    } catch {
      return String(activeUntilRaw);
    }
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gray-50 font-sans">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Langganan</h1>
        <p className="text-gray-400 text-sm mt-1">Kelola paket dan pembayaran ASTAKIRA kamu.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 size={34} className="animate-spin text-amber-500 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">Memuat data langganan...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>

          {/* ── Status Langganan Aktif ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 border rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
                <Shield size={20} className={isActive ? "text-amber-500" : "text-gray-400"} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 text-sm">{activePlan?.name ?? "Belum Berlangganan"}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                    {isActive ? "AKTIF" : "TIDAK AKTIF"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                  <Calendar size={11} />
                  Aktif sampai: <span className="font-semibold text-gray-600">{formatActiveUntil()}</span>
                  {activePlan?.price != null && (
                    <>
                      &nbsp;·&nbsp;
                      <CreditCard size={11} />
                      {fmt(activePlan.price)}
                    </>
                  )}
                </p>
                {isActive && (
                  <p className="text-xs text-gray-400 mt-1">
                    Sisa waktu: <span className="font-black text-gray-700">{remaining.days} hari</span> <span className="font-black text-gray-700">{remaining.hours} jam</span> <span className="font-black text-gray-700">{remaining.minutes} menit</span> <span className="font-black text-gray-700">{remaining.seconds} detik</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isActive && (
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  disabled={paying}
                  className="flex items-center gap-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl px-4 py-2.5 hover:opacity-95 transition-all flex-shrink-0 disabled:opacity-60"
                >
                  Masuk Dashboard
                </button>
              )}
              <button
                onClick={refreshAll}
                disabled={paying}
                className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-all flex-shrink-0 disabled:opacity-60"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-900">Pilih Paket</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {sortedPlans.map((plan) => {
              const isCurrent = String(activePlanId) && String(plan.id) === String(activePlanId);
              const features = getFeatures(plan);

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl border-2 p-6 transition-all flex flex-col ${
                    isCurrent
                      ? "border-amber-400 shadow-lg shadow-amber-100"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isCurrent ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-600"}`}>
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">{plan.name ?? "-"}</p>
                      <p className="text-[10px] text-gray-400 leading-snug">Durasi {plan.duration_days ?? "-"} hari</p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black text-gray-900">{fmt(plan.price ?? 0)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Sekali bayar untuk durasi paket</p>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {features.length === 0 && (
                      <li className="text-xs text-gray-400">Tidak ada fitur aktif</li>
                    )}
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <Check size={13} className="flex-shrink-0 mt-0.5 text-amber-500" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent && isActive ? (
                    <div className="w-full py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs font-bold text-gray-400">
                      Paket Saat Ini
                    </div>
                  ) : (
                    <button
                      onClick={() => startCheckout(plan)}
                      disabled={paying}
                      className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
                    >
                      {paying ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                      Bayar {plan.name} <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

      {/* ── Catatan ── */}
      
        </>
      )}

      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white font-semibold text-sm animate-slideInRight ${
          toast.type === "error" ? "bg-red-500" : toast.type === "success" ? "bg-green-500" : "bg-amber-500"
        }`}>{toast.msg}</div>
      )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.16,1,0.3,1); }
      `}</style>
    </div>
  );
}
