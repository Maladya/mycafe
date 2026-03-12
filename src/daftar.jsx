import { useState } from "react";
import { Link } from "react-router-dom";
import { Coffee, AlertCircle, Eye, EyeOff, Building2, Mail, User, Lock, CheckCircle2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.2:3000";

/* ── Success Overlay ─────────────────────────────────────────────── */
function SuccessOverlay({ visible }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.3s ease",
      }}
    >
      <div
        style={{
          background: "rgba(22,22,32,0.97)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "36px 32px",
          textAlign: "center",
          width: "280px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
          animation: visible ? "popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards" : "none",
        }}
      >
        {/* Check icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 0 20px rgba(16,185,129,0.3)",
            animation: visible ? "checkPop 0.4s 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275) both" : "none",
          }}
        >
          <CheckCircle2 size={32} color="white" strokeWidth={2.5} />
        </div>

        <h2 style={{ color: "white", fontSize: "17px", fontWeight: 700, marginBottom: "6px" }}>
          Pendaftaran Berhasil!
        </h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginBottom: "20px" }}>
          Mengarahkan ke halaman login...
        </p>

        {/* Progress bar */}
        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: "99px", height: "3px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #f59e0b, #f97316)",
              borderRadius: "99px",
              animation: visible ? "progressFill 2.5s 0.2s linear forwards" : "none",
              width: "0%",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0.88) translateY(8px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes checkPop {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.12); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes progressFill {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function Daftar() {
  const [namaCafe,     setNamaCafe]     = useState("");
  const [email,        setEmail]        = useState("");
  const [username,     setUsername]     = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [err,          setErr]          = useState("");
  const [showSuccess,  setShowSuccess]  = useState(false);

  const handleDaftar = async () => {
    setErr("");
    if (!namaCafe || !email || !username || !password) {
      setErr("Semua field wajib diisi");
      return;
    }
    setLoading(true);
    const toastId = toast.loading("Mendaftarkan akun...");
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_cafe: namaCafe, email, username, password }),
      });
      const data = await response.json();
      console.log("Register response:", data);
      const isSuccess =
        data.success === true ||
        data.status === "success" ||
        data.message?.toLowerCase().includes("berhasil") ||
        response.ok;
      if (isSuccess) {
        toast.dismiss(toastId);
        setShowSuccess(true);
        setTimeout(() => { window.location.href = "/login"; }, 2800);
      } else {
        toast.error(data.message || "Pendaftaran gagal", {
          id: toastId,
          iconTheme: { primary: "#ef4444", secondary: "#fff" },
        });
        setErr(data.message || "Pendaftaran gagal");
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan koneksi", { id: toastId });
      setErr("Terjadi kesalahan, silakan coba lagi");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleDaftar();
  };

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-center" reverseOrder={false} />
      <SuccessOverlay visible={showSuccess} />

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
            Mulai perjalanan digitalisasi kafe Anda bersama kami
          </p>
          <div className="space-y-4 text-left max-w-xs mx-auto">
            {["Gratis untuk cafe pemula", "Setup mudah & cepat", "Support 24/7"].map((item, i) => (
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
            <p className="text-gray-400 text-sm mt-1">Daftar Akun Baru</p>
          </div>

          {/* Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-white font-bold text-xl mb-1">Buat Akun Baru</h2>
            <p className="text-gray-400 text-sm mb-6">Daftarkan kafe Anda sekarang 🚀</p>

            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-xs font-semibold mb-2 block uppercase tracking-wide">Nama Cafe</label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="text" value={namaCafe} onChange={e => setNamaCafe(e.target.value)} onKeyPress={handleKeyPress} placeholder="Nama cafe Anda"
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-amber-500 transition-all text-sm" />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-xs font-semibold mb-2 block uppercase tracking-wide">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyPress={handleKeyPress} placeholder="example@gmail.com"
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-amber-500 transition-all text-sm" />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-xs font-semibold mb-2 block uppercase tracking-wide">Username</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} onKeyPress={handleKeyPress} placeholder="Masukkan username"
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:border-amber-500 transition-all text-sm" />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-xs font-semibold mb-2 block uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} onKeyPress={handleKeyPress} placeholder="••••••••"
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-10 py-3 text-white placeholder-gray-500 outline-none focus:border-amber-500 transition-all text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-400 transition-colors">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {err && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{err}</p>
                </div>
              )}

              <button onClick={handleDaftar} disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all mt-2 ${
                  loading ? "bg-amber-400 cursor-wait" : "bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-[1.02]"
                } text-white shadow-lg`}>
                {loading ? "Mendaftarkan..." : "Daftar Sekarang →"}
              </button>

              <div className="text-center pt-1">
                <p className="text-gray-400 text-sm">
                  Sudah punya akun?{" "}
                  <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                    Masuk sekarang
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}