import { useEffect, useState, useRef } from "react";
import { Wrench } from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://192.168.1.5:3000").replace(/\/$/, "");
const POLL_MS = 30_000;
export const MAINTENANCE_LS_KEY = "MYCAFE_maintenance_mode";

function isSuperAdmin() {
  return Boolean(localStorage.getItem("superadmin_token"));
}

function extractMode(data) {
  return Boolean(
    data?.data?.maintenanceMode ??
    data?.data?.maintenance_mode ??
    data?.settings?.maintenanceMode ??
    data?.settings?.maintenance_mode ??
    data?.maintenanceMode ??
    data?.maintenance_mode ??
    false
  );
}

async function fetchMaintenanceStatus() {
  const endpoints = [
    { url: `${API_URL}/api/superadmin/settings/public`, token: null },
    { url: `${API_URL}/api/superadmin/settings`, token: localStorage.getItem("superadmin_token") },
  ];

  for (const { url, token } of endpoints) {
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(url, { headers });
      if (!res.ok) continue;
      const data = await res.json().catch(() => ({}));
      const mode = extractMode(data);
      try { localStorage.setItem(MAINTENANCE_LS_KEY, mode ? "1" : "0"); } catch {}
      return mode;
    } catch {}
  }

  try {
    return localStorage.getItem(MAINTENANCE_LS_KEY) === "1";
  } catch {
    return false;
  }
}

export function useMaintenanceMode() {
  const [maintenance, setMaintenance] = useState(() => {
    try { return localStorage.getItem(MAINTENANCE_LS_KEY) === "1"; } catch { return false; }
  });
  const timerRef = useRef(null);

  const check = async () => {
    if (isSuperAdmin()) {
      setMaintenance(false);
      return;
    }
    const mode = await fetchMaintenanceStatus();
    setMaintenance(mode);
  };

  useEffect(() => {
    check();
    timerRef.current = setInterval(check, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, []);

  return maintenance;
}

export default function MaintenanceBanner() {
  const maintenance = useMaintenanceMode();

  if (!maintenance) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6"
      style={{ background: "rgba(10,10,20,0.92)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="bg-gray-900 border border-yellow-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
        style={{ boxShadow: "0 0 60px rgba(234,179,8,0.15)" }}
      >
        <div className="w-20 h-20 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mx-auto mb-5">
          <Wrench size={36} className="text-yellow-400" />
        </div>
        <h2 className="text-white text-2xl font-black mb-2 tracking-tight">
          Sedang Maintenance
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Sistem sedang dalam pemeliharaan oleh tim kami. Layanan akan kembali normal sesegera mungkin.
        </p>
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2">
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-yellow-400 text-xs font-bold uppercase tracking-wide">
            Harap menunggu
          </span>
        </div>
        <p className="text-gray-600 text-[11px] mt-5">
          Jika kamu adalah administrator, silakan hubungi Super Admin.
        </p>
      </div>
    </div>
  );
}
