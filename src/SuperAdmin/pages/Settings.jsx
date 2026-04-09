import { useState, useEffect } from "react";
import { Save, Shield } from "lucide-react";
import { MAINTENANCE_LS_KEY } from "../../components/MaintenanceBanner";

const API_URL = import.meta.env.VITE_API_URL ?? "https://api.mycafe-order.net";

function asTimeoutError(err) {
  if (!err) return null;
  if (err?.name === "AbortError") return new Error("Request timeout");
  if (String(err?.message || "").toLowerCase().includes("timeout")) return new Error("Request timeout");
  return null;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export default function Settings() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetchWithTimeout(`${API_URL}/api/superadmin/settings`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }, 15000);

      if (res.ok) {
        const data = await res.json();
        const mode = (data?.data?.maintenanceMode ?? data?.settings?.maintenanceMode ?? data?.maintenanceMode) ?? false;
        setSettings({ maintenanceMode: Boolean(mode) });
      }
    } catch (err) {
      const tErr = asTimeoutError(err);
      if (tErr) {
        showToast("Gagal memuat pengaturan (timeout). Pastikan backend aktif.", "error");
        return;
      }
      console.error("Failed to fetch settings:", err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetchWithTimeout(`${API_URL}/api/superadmin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ maintenanceMode: settings.maintenanceMode }),
      }, 15000);

      if (res.ok) {
        try { localStorage.setItem(MAINTENANCE_LS_KEY, settings.maintenanceMode ? "1" : "0"); } catch {}
        showToast("Pengaturan berhasil disimpan", "success");
      } else {
        showToast("Gagal menyimpan pengaturan", "error");
      }
    } catch (err) {
      const tErr = asTimeoutError(err);
      if (tErr) {
        showToast("Gagal menyimpan (timeout). Pastikan backend aktif dan bisa diakses.", "error");
        return;
      }
      console.error("Failed to save settings:", err);
      showToast("Gagal menyimpan pengaturan", "error");
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Pengaturan Sistem</h2>
        <p className="text-sm text-gray-500 mt-1">Mode Maintenance</p>
      </div>

      

      {/* System Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield size={18} className="text-purple-600" />
          Kontrol Sistem
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900">Mode Maintenance</p>
              <p className="text-xs text-gray-500 mt-1">Nonaktifkan akses sementara untuk semua cafe</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save size={18} />
              Simpan
            </>
          )}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white font-semibold text-sm animate-slideInRight ${
            toast.type === "error" ? "bg-red-500" : toast.type === "success" ? "bg-green-500" : "bg-blue-500"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
