import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Loader2, Eye, EyeOff, Store } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.16:3000";

export default function KasirLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cafeInfo, setCafeInfo] = useState({ nama: "ASTAKIRA", alamat: "Ciakar, Tasikmalaya" });

  // Jika sudah login, redirect ke kasir
  useEffect(() => {
    const token = localStorage.getItem("kasir_token");
    if (token) navigate("/kasir", { replace: true });
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("kasir_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user?.cafe_id) fetchCafeInfo(user.cafe_id);
      } catch {}
    }
  }, []);

  const fetchCafeInfo = async (cafeId) => {
    try {
      const token = localStorage.getItem("kasir_token");
      const res = await fetch(`${API_URL}/api/pengaturan/user/${cafeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const cafe = data.data ?? data ?? null;
        setCafeInfo({
          nama: cafe?.nama_cafe || "ASTAKIRA",
          alamat: cafe?.alamat || "Ciakar, Tasikmalaya",
        });
      }
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError("Username dan password wajib diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Backend query pakai field: email — kirim username sebagai email
        body: JSON.stringify({ email: form.username, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login gagal");
      }

      // ✅ Struktur response backend:
      // { status, message, data: { token }, admin: { id, cafe_id, role, ... } }
      const token = data.data?.token;
      const user  = data.admin;

      if (!token) throw new Error("Token tidak ditemukan, hubungi developer");
      if (!user)  throw new Error("Data user tidak ditemukan, hubungi developer");

      const role = user?.role ?? "";
      if (role !== "kasir" && role !== "admin") {
        throw new Error("Akun ini tidak memiliki akses kasir");
      }

      if (!user.cafe_id) {
        throw new Error("Akun tidak terhubung ke cafe manapun");
      }

      localStorage.setItem("kasir_token", token);
      localStorage.setItem("kasir_user", JSON.stringify(user));

      navigate("/kasir", { replace: true });
    } catch (err) {
      setError(err.message || "Gagal login, periksa koneksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <QrCode size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">TERMINAL KASIR</h1>
          <p className="text-gray-400 text-sm mt-1">Login untuk akses terminal kasir</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-red-500 text-lg">!</span>
              </div>
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Username / Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Store size={14} className="text-amber-500" />
              Email
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Masukkan email"
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-500 transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Masukkan password"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-500 transition-all pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500 transition-all"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Memuat...</>
            ) : (
              "Masuk Ke Kasir"
            )}
          </button>

          {/* Back to admin */}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm"
          >
            ← Kembali ke Login Admin
          </button>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-400">
            Terminal Kasir {cafeInfo.nama?.toUpperCase()} • {cafeInfo.alamat}
          </p>
        </div>
      </div>
    </div>
  );
}