import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Loader2, Lock } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.5:3000";

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("superadmin_token");
    if (token) {
      navigate("/superadmin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/superadmin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      // Terima berbagai bentuk response: dengan/ tanpa 'success', dan perbedaan key superAdmin
      const token = data?.data?.token || data?.token;
      if (!res.ok || !token) {
        setError(data.message || "Login gagal");
        return;
      }

      const superAdminData =
        data?.data?.superadmin ||
        data?.data?.superAdmin ||
        data?.superadmin ||
        data?.superAdmin ||
        null;

      localStorage.setItem("superadmin_token", token);
      localStorage.setItem("superadmin_user", JSON.stringify(superAdminData));

      navigate("/superadmin/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
      
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20 relative z-10">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-10 text-center relative">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/30">
              <Shield size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">SUPER ADMIN</h1>
            <p className="text-purple-100 text-sm">Portal Manajemen Sistem</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-red-200 text-sm font-semibold text-center">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Lock size={14} className="text-purple-400" />
              Email Super Admin
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="superadmin@astakira.id"
              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 text-sm font-semibold outline-none focus:border-purple-400 focus:bg-white/20 transition-all backdrop-blur-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-white">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 text-sm font-semibold outline-none focus:border-purple-400 focus:bg-white/20 transition-all backdrop-blur-sm pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-purple-400 transition-all"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                <Shield size={20} />
                Masuk ke Dashboard
              </>
            )}
          </button>

          <div className="pt-4 text-center">
            <p className="text-white/40 text-xs">
              Akses terbatas untuk Super Administrator
            </p>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
