import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, CheckCircle2, XCircle, Settings2 } from "lucide-react";
import DataTable from "../components/DataTable";

const API_URL = import.meta.env.VITE_API_URL ?? "https://api.mycafe-order.net";

function formatRupiah(num) {
  if (!num && num !== 0) return "Rp0";
  return `Rp${Number(num).toLocaleString("id-ID")}`;
}

function normalizeFeaturesToList(raw, depth = 0) {
  if (!raw) return [];
  if (depth > 3) return [];

  if (typeof raw === "string") {
    // Handle JSON string / double-encoded JSON
    let parsed = raw;
    for (let i = 0; i < 2 && typeof parsed === "string"; i++) {
      const s = String(parsed || "").trim();
      const looksLikeJson =
        (s.startsWith("[") && s.endsWith("]")) ||
        (s.startsWith("{") && s.endsWith("}")) ||
        ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")));
      if (!looksLikeJson) break;
      try {
        parsed = JSON.parse(s);
      } catch {
        break;
      }
    }

    if (parsed !== raw) {
      return normalizeFeaturesToList(parsed, depth + 1);
    }

    return String(raw)
      .split("\n")
      .map((s) => String(s || "").trim())
      .filter(Boolean);
  }

  if (Array.isArray(raw)) {
    // Handle ["[...]"] or ["{...}"]
    if (raw.length === 1 && typeof raw[0] === "string") {
      const s = String(raw[0] || "").trim();
      if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("{") && s.endsWith("}"))) {
        try {
          const again = JSON.parse(s);
          return normalizeFeaturesToList(again, depth + 1);
        } catch {
          // keep as-is
        }
      }
    }

    return raw
      .map((x) => {
        if (x == null) return "";
        if (typeof x === "string") return x;
        if (typeof x === "object") return String(x.label ?? x.name ?? x.key ?? "");
        return String(x);
      })
      .map((s) => String(s || "").trim())
      .filter(Boolean);
  }

  if (typeof raw === "object") {
    return Object.entries(raw)
      .filter(([, v]) => v === true || v === 1 || v === "1" || v === "true")
      .map(([k]) => String(k || "").trim())
      .filter(Boolean);
  }

  return [];
}

function featuresSummary(features) {
  const enabled = normalizeFeaturesToList(features);
  if (enabled.length === 0) return "-";
  return enabled.slice(0, 3).join(", ") + (enabled.length > 3 ? ` +${enabled.length - 3}` : "");
}

function getDurationInfo(plan) {
  const unit = String(plan?.duration_unit ?? plan?.durationUnit ?? "").toLowerCase();
  const value = plan?.duration_value ?? plan?.durationValue;
  const minutes = plan?.duration_minutes ?? plan?.durationMinutes;
  const days = plan?.duration_days ?? plan?.durationDays;

  if (Number.isFinite(Number(minutes)) && Number(minutes) > 0) {
    return { unit: "minute", value: Number(minutes) };
  }
  if (unit === "minute" && Number.isFinite(Number(value)) && Number(value) > 0) {
    return { unit: "minute", value: Number(value) };
  }
  if (Number.isFinite(Number(days)) && Number(days) > 0) {
    return { unit: "day", value: Number(days) };
  }
  if ((unit === "day" || unit === "days") && Number.isFinite(Number(value)) && Number(value) > 0) {
    return { unit: "day", value: Number(value) };
  }
  return { unit: "day", value: 30 };
}

function PlanModal({ open, initial, onClose, onSubmit, saving }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [durationUnit, setDurationUnit] = useState("day");
  const [durationValue, setDurationValue] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(1);
  const [featuresText, setFeaturesText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setName(initial?.name ?? "");
    setPrice(Number(initial?.price ?? 0));
    const d = getDurationInfo(initial);
    setDurationUnit(d.unit);
    setDurationValue(Number(d.value ?? 30));
    setIsActive(Boolean(initial?.is_active ?? initial?.isActive ?? true));
    setSortOrder(Number(initial?.sort_order ?? initial?.sortOrder ?? 1));
    const existing = initial?.features_json ?? initial?.featuresJson ?? initial?.features ?? null;
    const list = normalizeFeaturesToList(existing);
    setFeaturesText(list.join("\n"));
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = () => {
    setError("");
    if (!name.trim()) {
      setError("Nama paket wajib diisi");
      return;
    }
    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      setError("Harga tidak valid");
      return;
    }
    if (!Number.isFinite(Number(durationValue)) || Number(durationValue) <= 0) {
      setError(durationUnit === "minute" ? "Durasi (menit) tidak valid" : "Durasi (hari) tidak valid");
      return;
    }

    const features = String(featuresText || "")
      .split("\n")
      .map(s => String(s || "").trim())
      .filter(Boolean);

    const durVal = Number(durationValue);
    const unit = durationUnit === "minute" ? "minute" : "day";
    const payload = {
      name: name.trim(),
      price: Number(price),
      is_active: Boolean(isActive),
      sort_order: Number(sortOrder) || 1,
      features_json: features,

      // Forward-compatible
      duration_unit: unit,
      duration_value: durVal,
    };

    // Backward-compatible fields (existing backend may only support duration_days)
    if (unit === "minute") {
      payload.duration_minutes = durVal;
      payload.duration_days = 0;
    } else {
      payload.duration_days = durVal;
      payload.duration_minutes = 0;
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-black text-white text-lg">{initial?.id ? "Edit Paket" : "Tambah Paket"}</h2>
            <p className="text-white/70 text-xs">Atur nama, harga, durasi, fitur</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all">
            ×
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-gray-500 mb-1">Nama Paket</p>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-purple-500 transition-all"
              placeholder="Contoh: Basic / Pro"
            />
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 mb-1">Harga (Rp)</p>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-purple-500 transition-all"
              placeholder="50000"
            />
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 mb-1">Durasi</p>
            <div className="flex gap-2">
              <input
                type="number"
                value={durationValue}
                onChange={e => setDurationValue(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-purple-500 transition-all"
                placeholder={durationUnit === "minute" ? "60" : "30"}
              />
              <select
                value={durationUnit}
                onChange={e => setDurationUnit(e.target.value)}
                className="px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-purple-500 transition-all"
              >
                <option value="day">Hari</option>
                <option value="minute">Menit</option>
              </select>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 mb-1">Urutan</p>
            <input
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-purple-500 transition-all"
              placeholder="1"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-500">Fitur</p>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                Aktif
              </label>
            </div>
            <textarea
              value={featuresText}
              onChange={e => setFeaturesText(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-purple-500 transition-all"
              placeholder="Tulis 1 fitur per baris"
            />
            {error && <p className="text-xs text-red-500 font-semibold mt-2">{error}</p>}
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-3 font-semibold hover:bg-gray-50 transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl py-3 font-black shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageSubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("superadmin_token") || ""}`,
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/subscriptions/superadmin/plans`, { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data?.plans) ? data.plans
        : [];
      setPlans(list);
    } catch (e) {
      console.error("fetch plans error", e);
      showToast(e?.message || "Gagal memuat paket", "error");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const sortedPlans = useMemo(() => {
    const arr = Array.isArray(plans) ? plans : [];
    return [...arr].sort((a, b) => {
      const sa = Number(a.sort_order ?? 9999);
      const sb = Number(b.sort_order ?? 9999);
      if (sa !== sb) return sa - sb;
      return Number(a.id ?? 0) - Number(b.id ?? 0);
    });
  }, [plans]);

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      const isEdit = Boolean(selected?.id);
      const url = isEdit
        ? `${API_URL}/api/subscriptions/superadmin/plans/${selected.id}`
        : `${API_URL}/api/subscriptions/superadmin/plans`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      showToast("Paket berhasil disimpan", "success");
      setShowModal(false);
      setSelected(null);
      await fetchPlans();
    } catch (e) {
      showToast(e?.message || "Gagal menyimpan", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!row?.id) return;
    const ok = confirm(`Hapus paket "${row.name || row.nama || row.id}"?`);
    if (!ok) return;

    try {
      const res = await fetch(`${API_URL}/api/subscriptions/superadmin/plans/${row.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      showToast("Paket berhasil dihapus", "success");
      fetchPlans();
    } catch (e) {
      showToast(e?.message || "Gagal menghapus", "error");
    }
  };

  const columns = [
    {
      header: "Nama",
      accessor: "name",
      render: (val, row) => (
        <div>
          <p className="font-bold text-gray-900">{val || row.nama || "-"}</p>
          <p className="text-[11px] text-gray-400">ID: {row.id ?? "-"} · Urutan: {row.sort_order ?? row.sortOrder ?? "-"}</p>
        </div>
      ),
    },
    {
      header: "Harga",
      accessor: "price",
      render: (val, row) => (
        <span className="font-black" style={{ color: "#4f46e5" }}>
          {formatRupiah(val ?? row.harga ?? 0)}
        </span>
      ),
    },
    {
      header: "Durasi",
      accessor: "duration_days",
      render: (val, row) => {
        const d = getDurationInfo({ ...row, duration_days: val ?? row.duration_days ?? row.durationDays });
        return (
          <span className="inline-flex px-2 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">
            {d.value ?? "-"} {d.unit === "minute" ? "menit" : "hari"}
          </span>
        );
      },
    },
    {
      header: "Status",
      accessor: "is_active",
      render: (val, row) => {
        const active = Boolean(val ?? row.isActive ?? true);
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
            {active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {active ? "Aktif" : "Nonaktif"}
          </span>
        );
      },
    },
    {
      header: "Fitur",
      accessor: "features_json",
      render: (val, row) => {
        const feat = val ?? row.featuresJson ?? row.features ?? null;
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600">
            <Settings2 size={14} className="text-gray-400" />
            {featuresSummary(feat)}
          </span>
        );
      },
    },
    {
      header: "Aksi",
      accessor: "id",
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelected(row);
              setShowModal(true);
            }}
            className="w-9 h-9 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
            title="Hapus"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">Memuat paket langganan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Paket Langganan</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola paket (nama, harga, durasi, fitur) untuk admin cafe</p>
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl px-4 py-2.5 font-black shadow-lg hover:shadow-xl transition-all"
        >
          <Plus size={16} /> Tambah Paket
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500 font-semibold mb-1">Total Paket</p>
          <p className="text-2xl font-black text-gray-900">{sortedPlans.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500 font-semibold mb-1">Paket Aktif</p>
          <p className="text-2xl font-black text-green-600">{sortedPlans.filter(p => Boolean(p.is_active ?? p.isActive ?? true)).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500 font-semibold mb-1">Paket Nonaktif</p>
          <p className="text-2xl font-black text-gray-700">{sortedPlans.filter(p => !Boolean(p.is_active ?? p.isActive ?? true)).length}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={sortedPlans}
        searchable
        searchPlaceholder="Cari paket..."
      />

      <PlanModal
        open={showModal}
        initial={selected}
        onClose={() => {
          if (saving) return;
          setShowModal(false);
          setSelected(null);
        }}
        onSubmit={handleSave}
        saving={saving}
      />

      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white font-semibold text-sm animate-slideInRight ${
          toast.type === "error" ? "bg-red-500" : toast.type === "success" ? "bg-green-500" : "bg-purple-500"
        }`}>{toast.msg}</div>
      )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.16,1,0.3,1); }
      `}</style>
    </div>
  );
}
