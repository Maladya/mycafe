import { useState, useEffect } from "react";
import { 
  Users, Plus, Search, Edit2, Trash2, Loader2, 
  Eye, EyeOff, X, Check, UserPlus
} from "lucide-react";
import { useAdmin } from "../AdminPanel";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.14:3000";

/* --------------------------------------------------
   KELOLA KASIR — Admin Manage Kasir Users
   -------------------------------------------------- */
export default function KelolaKasir() {
  const { showToast } = useAdmin();
  
  const [kasirList, setKasirList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingKasir, setEditingKasir] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
  });

  // Get current admin user for cafe_id
  const getCurrentAdmin = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  // Fetch kasir users
  const fetchKasir = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/kasir`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setKasirList(data.data ?? data.users ?? data ?? []);
    } catch (err) {
      console.error("Fetch kasir error:", err);
      showToast("Gagal memuat data kasir", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKasir();
  }, []);

  // Filter kasir by search
  const filteredKasir = kasirList.filter(k => 
    k.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset form
  const resetForm = () => {
    setForm({
      email: "",
      password: "",
    });
    setEditingKasir(null);
  };

  // Open modal for add/edit
  const openModal = (kasir = null) => {
    if (kasir) {
      setEditingKasir(kasir);
      setForm({
        email: kasir.email || "",
        password: "", // Don't show password when editing
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Save kasir (create or update)
  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const admin = getCurrentAdmin();
      const cafeId = admin?.cafe_id ?? admin?.id ?? "";
      
      if (!cafeId) {
        showToast("Admin cafe ID tidak ditemukan", "error");
        return;
      }
      
      const payload = {
        email: form.email,
        username: form.email,
        password: form.password,
        role: "kasir",
        cafe_id: cafeId,
      };

      let res;
      if (editingKasir) {
        // Update existing kasir
        res = await fetch(`${API_URL}/api/kasir/${editingKasir.id}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        // Create new kasir
        res = await fetch(`${API_URL}/api/kasir`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      
      if (res.ok) {
        showToast(editingKasir ? "Kasir berhasil diupdate" : "Kasir berhasil ditambahkan", "success");
        closeModal();
        fetchKasir();
      } else {
        throw new Error(data.message || "Gagal menyimpan kasir");
      }
    } catch (err) {
      console.error("Save kasir error:", err);
      showToast(err.message || "Gagal menyimpan kasir", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete kasir
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      const res = await fetch(`${API_URL}/api/kasir/${deleteConfirm.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (res.ok) {
        showToast("Kasir berhasil dihapus", "success");
        setDeleteConfirm(null);
        fetchKasir();
      } else {
        const data = await res.json();
        throw new Error(data.message || "Gagal menghapus kasir");
      }
    } catch (err) {
      console.error("Delete kasir error:", err);
      showToast(err.message || "Gagal menghapus kasir", "error");
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">Kelola Kasir</h1>
          <p className="text-gray-400 text-sm">
            {kasirList.length} kasir terdaftar
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl px-4 py-2.5 font-bold shadow-lg hover:shadow-xl transition-all text-sm"
        >
          <Plus size={18} />
          Tambah Kasir
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kasir..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Kasir List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="text-amber-500 animate-spin" />
        </div>
      ) : filteredKasir.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKasir.map((kasir) => (
            <div key={kasir.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Users size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{kasir.email}</p>
                    <p className="text-xs text-gray-500">Kasir</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-lg uppercase">
                  {kasir.role}
                </span>
              </div>
              
              

              <div className="flex gap-2">
                <button
                  onClick={() => openModal(kasir)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-sm font-bold transition-all"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(kasir)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-all"
                >
                  <Trash2 size={14} />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">
            {searchTerm ? "Tidak ada kasir yang cocok" : "Belum ada kasir"}
          </p>
          <p className="text-xs mt-1">
            {searchTerm ? "Coba kata kunci lain" : "Klik Tambah Kasir untuk memulai"}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <UserPlus size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">
                    {editingKasir ? "Edit Kasir" : "Tambah Kasir"}
                  </h2>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Email (Gmail)</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@gmail.com"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">
                  Password {editingKasir && "(Kosongkan jika tidak ingin mengubah)"}
                </label>
                <input
                  type="password"
                  required={!editingKasir}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingKasir ? "Password baru (opsional)" : "Password"}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
                  ) : (
                    <><Check size={18} /> Simpan</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Kasir?</h3>
              <p className="text-gray-500 text-sm">
                Apakah Anda yakin ingin menghapus <strong>{deleteConfirm.email}</strong>? 
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg hover:bg-red-600 transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
