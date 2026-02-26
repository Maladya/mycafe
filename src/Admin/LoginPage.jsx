import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, AlertCircle, Eye, EyeOff, User, Lock } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.13:3000";

export default function LoginPage() {
  const navigate = useNavigate();

  const [user,     setUser]     = useState("");
  const [pass,     setPass]     = useState("");
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  // ── Kalau sudah login langsung redirect ───────────────────────────────────
  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handle = async (e) => {
    e.preventDefault();
    setErr("");

    if (!user || !pass) {
      setErr("email dan password wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: user, password: pass }),
      });

      const data = await res.json();

      // ── Gagal login ────────────────────────────────────────────────────────
      if (!res.ok || data.success === false) {
        setErr(data.message ?? data.error ?? "email atau password salah");
        return;
      }

      // ── Ambil token dari data.access_token ────────────────────────────────
      // Struktur response: { success, message, data: { access_token, refresh_token, user, cafe } }
      const access_token  = data.data.token;
      const refresh_token = data.data?.refresh_token;
      const userData      = data.data?.user;
      const cafeData      = data.data?.cafe;

      if (!access_token) {
        setErr("Login berhasil tapi token tidak diterima. Hubungi admin.");
        return;
      }

      // ── Simpan ke localStorage ─────────────────────────────────────────────
      localStorage.setItem("token",         access_token);
      localStorage.setItem("refresh_token", refresh_token ?? "");
      localStorage.setItem("user",          JSON.stringify(userData ?? {}));
      localStorage.setItem("cafe",          JSON.stringify(cafeData ?? {}));

      // ── Redirect ke dashboard ──────────────────────────────────────────────
      navigate("/admin/dashboard", { replace: true });

    } catch (error) {
      console.error("Login error:", error);
      setErr("Gagal terhubung ke server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left Side - Branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

        <div className="relative z-10 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30 mx-auto mb-8">
            <Coffee size={44} className="text-white" />
          </div>
          <h1 className="text-6xl font-black text-white tracking-tight mb-4">ASTAKIRA</h1>
          <p className="text-lg text-gray-400 max-w-sm mx-auto leading-relaxed mb-12">
            Kelola kafe Anda dengan mudah dan efisien bersama kami
          </p>
          <div className="space-y-4 text-left max-w-xs mx-auto">
            {[
              "Dashboard real-time & analitik",
              "Manajemen menu & pesanan",
              "Laporan penjualan otomatis",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Side - Form ─────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-6 py-10 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl" />

        <div className="relative w-full max-w-sm">

          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/30 mx-auto mb-3">
              <Coffee size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">ASTAKIRA</h1>
            <p className="text-gray-400 text-sm mt-1">Admin Dashboard</p>
          </div>

          {/* Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-white font-bold text-xl mb-1">Masuk ke Dashboard</h2>
            <p className="text-gray-400 text-sm mb-6">Selamat datang kembali 👋</p>

            <form onSubmit={handle} className="space-y-4">

              {/* email */}
              <div>
                <label className="text-gray-300 text-xs font-semibold mb-2 block uppercase tracking-wide">
                  email
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    value={user}
                    onChange={e => setUser(e.target.value)}
                    placeholder="Masukkan email"
                    autoComplete="email"
                    autoFocus
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-amber-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-gray-300 text-xs font-semibold mb-2 block uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-10 py-3 text-white placeholder-gray-500 outline-none focus:border-amber-500 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {err && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{err}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all mt-2 ${
                  loading
                    ? "bg-amber-400 cursor-wait"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-[1.02]"
                } text-white shadow-lg`}
              >
                {loading ? "Memverifikasi..." : "Masuk →"}
              </button>
            </form>

            {/* Register link */}
            <div className="text-center mt-5">
              <p className="text-gray-400 text-sm">
                Belum punya akun?{" "}
                <a href="/daftar" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                  Daftar sekarang
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}