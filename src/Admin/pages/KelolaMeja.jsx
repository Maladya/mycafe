import { useState, useEffect, useRef } from "react";

import { Plus, Table2, Trash2, QrCode, Loader2, RefreshCw, Square, CheckSquare2, X } from "lucide-react";

import { useAdmin } from "../AdminPanel";

import { QRModal } from "../components/QRModal";

import { ConfirmDialog } from "../components/SharedComponents";



const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.13:3000";



const authHeaders = () => ({

  "Content-Type": "application/json",

  Authorization: `Bearer ${localStorage.getItem("token")}`,

});



export default function KelolaMeja() {

  const { setTables, orders, showToast } = useAdmin();



  const [tables,     setLocalTables] = useState([]);

  const [search,     setSearch]      = useState("");

  const [page,       setPage]        = useState(1);

  const [confirmDel, setConfirmDel]  = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set());

  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);

  const [qrTable,    setQrTable]     = useState(null);

  const [adding,     setAdding]      = useState(false);

  const [deleting,   setDeleting]    = useState(false);

  const [fetching,   setFetching]    = useState(false);



  // Simpan referensi stabil ke setTables & showToast pakai ref

  // supaya tidak trigger useEffect ulang saat parent re-render

  const setTablesRef  = useRef(setTables);

  const showToastRef  = useRef(showToast);

  useEffect(() => { setTablesRef.current  = setTables;  }, [setTables]);

  useEffect(() => { showToastRef.current  = showToast;  }, [showToast]);



  // ─── Fetch ───────────────────────────────────────────────────────────────

  const fetchTables = async () => {

    setFetching(true);

    try {

      const res  = await fetch(`${API_URL}/api/tables`, { headers: authHeaders() });

      const data = await res.json();

      const arr  = data.data ?? data.tables ?? data ?? [];

      setLocalTables(arr);

      setTablesRef.current(arr);

    } catch (err) {

      console.error("Fetch tables error:", err);

      showToastRef.current("Gagal memuat data meja", "error");

    } finally {

      setFetching(false);

    }

  };



  // Fetch hanya sekali saat mount — [] dependency yang benar-benar stabil

  useEffect(() => { fetchTables(); }, []);  



  // ─── Tambah Meja ─────────────────────────────────────────────────────────

  const handleAdd = async () => {

    setAdding(true);

    try {

      const nextNo = tables.length > 0

        ? Math.max(...tables.map(t => Number(t.nomor_meja ?? t.id ?? 0))) + 1

        : 1;



      const res  = await fetch(`${API_URL}/api/tables`, {

        method:  "POST",

        headers: authHeaders(),

        body:    JSON.stringify({ nomor_meja: nextNo, status: true }),

      });

      const data = await res.json();



      if (!res.ok || data.success === false) {

        showToast(data.message ?? "Gagal menambah meja", "error");

        return;

      }



      await fetchTables();

      showToast(`Meja ${nextNo} berhasil ditambahkan!`, "success");

    } catch (err) {

      console.error("Add table error:", err);

      showToast("Gagal terhubung ke server", "error");

    } finally {

      setAdding(false);

    }

  };



  // ─── Hapus Banyak Meja ───────────────────────────────────────────────────

  const handleBulkDelete = async () => {

    if (selectedIds.size === 0) return;

    setDeleting(true);

    try {

      const ids = Array.from(selectedIds);

      const res = await fetch(`${API_URL}/api/tables/bulk`, {

        method: "DELETE",

        headers: authHeaders(),

        body: JSON.stringify({ ids }),

      });

      const data = await res.json();



      if (!res.ok || data.success === false) {

        showToast(data.message ?? "Gagal menghapus meja", "error");

        return;

      }



      await fetchTables();

      setSelectedIds(new Set());

      setBulkDeleteMode(false);

      showToast(`${ids.length} meja berhasil dihapus!`, "success");

    } catch (err) {

      console.error("Bulk delete error:", err);

      showToast("Gagal terhubung ke server", "error");

    } finally {

      setDeleting(false);

      setConfirmDel(null);

    }

  };

  const handleDel = async (id) => {

    setDeleting(true);

    try {

      const res  = await fetch(`${API_URL}/api/tables/${id}`, {

        method:  "DELETE",

        headers: authHeaders(),

      });

      const data = await res.json();



      if (!res.ok || data.success === false) {

        showToast(data.message ?? "Gagal menghapus meja", "error");

        return;

      }



      await fetchTables();

      showToast("Meja berhasil dihapus!", "success");

    } catch (err) {

      console.error("Delete table error:", err);

      showToast("Gagal terhubung ke server", "error");

    } finally {

      setDeleting(false);

      setConfirmDel(null);

    }

  };



  const filteredTables = tables.filter(t => {

    const q = search.trim().toLowerCase();

    if (!q) return true;

    const no = String(t.nomor_meja ?? t.id ?? "").toLowerCase();

    return no.includes(q);

  });



  useEffect(() => { setPage(1); }, [search]);



  const pageSize = 12;

  const totalPages = Math.max(1, Math.ceil(filteredTables.length / pageSize));

  const safePage = Math.min(Math.max(page, 1), totalPages);

  const startIndex = (safePage - 1) * pageSize;

  const paginatedTables = filteredTables.slice(startIndex, startIndex + pageSize);



  const toggleSelect = (id) => {

    setSelectedIds(prev => {

      const next = new Set(prev);

      if (next.has(id)) next.delete(id);

      else next.add(id);

      return next;

    });

  };



  const clearSelection = () => {

    setSelectedIds(new Set());

    setBulkDeleteMode(false);

  };



  return (

    <div className="p-4 lg:p-6 space-y-4">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-lg font-medium text-gray-900">Meja</h1>

          <p className="text-gray-500 text-xs">

            {tables.length} meja{selectedIds.size > 0 && <span className="text-gray-700"> • {selectedIds.size} terpilih</span>}

          </p>

        </div>

        <div className="flex gap-1.5">

          {selectedIds.size > 0 && (

            <>

              <button

                onClick={() => setConfirmDel('bulk')}

                disabled={deleting}

                className="flex items-center gap-1.5 bg-red-600 text-white rounded px-3 py-1.5 text-xs font-medium disabled:opacity-50"

              >

                {deleting ? <Loader2 size={12} className="animate-spin"/> : <Trash2 size={12}/>}

                Hapus {selectedIds.size}

              </button>

              <button

                onClick={clearSelection}

                className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 rounded text-xs"

                title="Batal"

              >

                <X size={14}/>

              </button>

            </>

          )}

          <button

            onClick={() => setBulkDeleteMode(!bulkDeleteMode)}

            className={`px-3 py-1.5 rounded text-xs font-medium ${

              bulkDeleteMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'

            }`}

          >

            {bulkDeleteMode ? 'Selesai' : 'Pilih'}

          </button>

          <button

            onClick={fetchTables}

            disabled={fetching}

            className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 rounded text-xs disabled:opacity-50"

            title="Refresh"

          >

            <RefreshCw size={12} className={fetching ? "animate-spin" : ""}/>

          </button>

          <button

            onClick={handleAdd}

            disabled={adding || fetching}

            className="flex items-center gap-1 bg-gray-900 text-white rounded px-3 py-1.5 text-xs font-medium disabled:opacity-50"

          >

            {adding ? <Loader2 size={12} className="animate-spin"/> : <Plus size={12}/>}

            Tambah

          </button>

        </div>

      </div>



      <input

        value={search}

        onChange={(e) => setSearch(e.target.value)}

        placeholder="Cari meja..."

        className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400"

      />



      {/* Skeleton */}

      {fetching && tables.length === 0 && (

        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">

          {[...Array(8)].map((_, i) => (

            <div key={i} className="bg-gray-50 rounded p-3 h-16 animate-pulse"/>

          ))}

        </div>

      )}



      {/* Table Grid */}

      {(!fetching || tables.length > 0) && (

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

          {paginatedTables.map(table => {

            const order = (orders ?? []).find(o => o.id === table.currentOrder);

            const noMeja = table.nomor_meja ?? table.id;

            const isSelected = selectedIds.has(table.id);



            return (

              <div key={table.id} className={`bg-white rounded-2xl border-2 p-4 hover:shadow-md transition-all ${isSelected ? 'border-amber-400 bg-amber-50/30' : 'border-gray-100'}`}>

                <div className="flex items-center justify-between mb-3">

                  <div className="flex items-center gap-2">

                    {bulkDeleteMode && (

                      <button

                        onClick={() => toggleSelect(table.id)}

                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${

                          isSelected 

                            ? 'bg-amber-500 text-white' 

                            : 'bg-gray-100 border-2 border-gray-300 hover:border-amber-400'

                        }`}

                      >

                        {isSelected && <CheckSquare2 size={14}/>}

                      </button>

                    )}

                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">

                      <span className="font-black text-gray-700 text-xl">{noMeja}</span>

                    </div>

                  </div>

                  <div className="w-2 h-2 rounded-full bg-gray-200"/>

                </div>

                <p className="text-[10px] text-gray-400">🪑 Meja {noMeja}</p>

                {order && <p className="text-[10px] text-amber-600 font-bold mt-0.5 truncate">{order.id}</p>}

                <div className="flex gap-1.5 mt-3">

                  <button

                    onClick={() => {

                      const userStr = localStorage.getItem("user");

                      const cafeStr = localStorage.getItem("cafe");

                      let cafeId = "";

                      try {

                        const user = JSON.parse(userStr);

                        cafeId = user?.cafe_id ?? user?.cafeId ?? user?.cafe ?? cafeStr ?? "";

                      } catch {

                        cafeId = cafeStr ?? "";

                      }

                      setQrTable({...table, nomor_meja: noMeja, cafe_id: cafeId});

                    }}

                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-[10px] font-bold transition-all"

                  >

                    <QrCode size={11}/> QR

                  </button>

                  <button

                    onClick={() => setConfirmDel(table.id)}

                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-[10px] font-bold transition-all"

                  >

                    <Trash2 size={11}/> Hapus

                  </button>

                </div>

              </div>

            );

          })}



          {tables.length === 0 && !fetching && (

            <div className="col-span-full text-center py-16 text-gray-400">

              <Table2 size={40} className="mx-auto mb-3 opacity-30"/>

              <p className="font-semibold">Belum ada meja</p>

              <p className="text-xs mt-1">Klik Tambah Meja untuk memulai</p>

            </div>

          )}



          {tables.length > 0 && filteredTables.length === 0 && !fetching && (

            <div className="col-span-full text-center py-16 text-gray-400">

              <Table2 size={40} className="mx-auto mb-3 opacity-30"/>

              <p className="font-semibold">Meja tidak ditemukan</p>

              <p className="text-xs mt-1">Coba kata kunci lain</p>

            </div>

          )}

        </div>

      )}



      {filteredTables.length > 0 && totalPages > 1 && (

        <div className="flex items-center justify-center gap-3 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">

          <button

            onClick={() => setPage(p => Math.max(1, p - 1))}

            disabled={safePage <= 1}

            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-bold disabled:opacity-50"

          >

            Prev

          </button>

          <p className="text-sm font-bold text-gray-700">

            Halaman {safePage} / {totalPages}

          </p>

          <button

            onClick={() => setPage(p => Math.min(totalPages, p + 1))}

            disabled={safePage >= totalPages}

            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-bold disabled:opacity-50"

          >

            Next

          </button>

        </div>

      )}



      {qrTable    && <QRModal table={qrTable} onClose={() => setQrTable(null)}/>}

      {confirmDel && (

        <ConfirmDialog

          msg={confirmDel === 'bulk' 

            ? `Yakin hapus ${selectedIds.size} meja terpilih?`

            : `Yakin hapus Meja ${tables.find(t => t.id === confirmDel)?.nomor_meja ?? confirmDel}?`

          }

          loading={deleting}

          onConfirm={() => confirmDel === 'bulk' ? handleBulkDelete() : handleDel(confirmDel)}

          onCancel={() => setConfirmDel(null)}

        />

      )}

    </div>

  );

}