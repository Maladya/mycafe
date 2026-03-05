import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  QrCode, Search, X, Check, Loader2, 
  Banknote, Receipt, Clock, User, Table2,
  ShoppingCart, Printer, ArrowLeft, ScanLine, Camera, LogOut
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.13:3000";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
});


export default function Kasir() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  const normalizePaymentDetail = (payload) => {
    const root = payload?.data ?? payload;
    return root;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("cafe");
    navigate("/login", { replace: true });
  };

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  const [scanning, setScanning] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);


  const handleSearch = async (rawCode) => {
    const code = rawCode?.toString().trim().toUpperCase();
    if (!code) return;

    // Parse QR format "ORDER:xxx" -> extract xxx
    const orderId = code.startsWith("ORDER:") ? code.replace("ORDER:", "").trim() : code;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCurrentOrder(normalizePaymentDetail(data.data ?? data));
        showToast("Pesanan ditemukan!", "success");
      } else {
        showToast("Pesanan tidak ditemukan", "error");
      }
    } catch {
      showToast("Gagal mencari pesanan", "error");
    } finally {
      setLoading(false);
      setSearchInput("");
    }
  };


  const handleSimulatedScan = (code) => { setScanning(false); handleSearch(code); };

  const processPayment = async (method) => {
    if (!currentOrder) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${currentOrder.id}/status`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status: "lunas" }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Pembayaran tunai berhasil!`, "success");
        setCurrentOrder({ ...currentOrder, status: "lunas" });
        setPaymentModal(null);
      } else throw new Error(data.message || "Gagal memproses pembayaran");
    } catch (err) {
      showToast(err.message || "Gagal memproses pembayaran", "error");
    } finally { setLoading(false); }
  };

  const formatRupiah = (num) => {
    if (!num && num !== 0) return "Rp0";
    return `Rp${Number(num).toLocaleString("id-ID")}`;
  };

  const formatWaktu = (raw) => {
    if (!raw) return "";
    try {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? raw : d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch { return raw; }
  };

  const getOrderTotal = (o) => (o?.total_bayar ?? o?.total ?? o?.subtotal ?? o?.items_total ?? 0);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-800 to-gray-900 text-white sticky top-0 z-20 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <QrCode size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg leading-none">TERMINAL KASIR</h1>
              <p className="text-gray-400 text-[10px]">ASTAKIRA POS</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">{new Date().toLocaleDateString("id-ID")}</p>
              <p className="text-sm font-bold">{new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-red-500/80 text-white rounded-xl px-3 py-2 text-xs font-bold transition-all border border-white/10"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-4 max-w-6xl mx-auto">
        {/* Konten Kasir - Langsung tanpa tab */}
        <>
          <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl lg:text-2xl font-black text-gray-900">Kasir</h1>
                <p className="text-gray-400 text-sm">Scan QR atau cari pesanan untuk pembayaran</p>
              </div>
              <button
                onClick={() => setScanning(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl px-4 py-2.5 font-bold shadow-lg hover:shadow-xl transition-all text-sm"
              >
                <ScanLine size={18} />
                Scan QR
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Scan QR atau ketik kode pesanan..."
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-500 transition-all"
                  />
                </div>
                <button
                  onClick={() => handleSearch()}
                  disabled={loading || !searchInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  Cari
                </button>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              {/* Current Order */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
                  <h2 className="font-bold text-white flex items-center gap-2"><Receipt size={18} />Detail Pesanan</h2>
                </div>
                <div className="p-4">
                  {currentOrder ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-2xl font-black text-gray-900">#{currentOrder.id || currentOrder.order_code}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              currentOrder.status === "lunas" ? "bg-green-100 text-green-700" :
                              currentOrder.status === "siap"  ? "bg-blue-100 text-blue-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>{currentOrder.status?.toUpperCase() || "BARU"}</span>
                            <span className="text-gray-400 text-xs">
                              <Clock size={10} className="inline mr-1" />
                              {formatWaktu(currentOrder.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Meja</p>
                          <p className="font-bold text-gray-900 flex items-center justify-end gap-1">
                            <Table2 size={14} />{currentOrder.meja ?? currentOrder.meja_id ?? currentOrder.nomor_meja ?? "-"}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                          <User size={18} className="text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{currentOrder.nama || currentOrder.customer_name || "Pelanggan"}</p>
                          <p className="text-xs text-gray-500">{currentOrder.items?.length || 0} item • {formatRupiah(getOrderTotal(currentOrder))}</p>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        <p className="text-xs font-bold text-gray-400 uppercase">Item Pesanan</p>
                        {(currentOrder.items || currentOrder.order_items || []).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center text-xs font-bold">
                                {item.quantity || item.qty}
                              </span>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{item.name || item.nama_menu}</p>
                                {(item.note || item.catatan) && <p className="text-[10px] text-gray-400">{item.note || item.catatan}</p>}
                              </div>
                            </div>
                            <p className="font-bold text-gray-900 text-sm">
                              {formatRupiah(item.subtotal ?? ((item.price || item.harga) * (item.quantity || item.qty)))}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-semibold">{formatRupiah(currentOrder.items_total ?? currentOrder.subtotal)}</span>
                        </div>
                        {currentOrder.discount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Diskon</span>
                            <span className="font-semibold">-{formatRupiah(currentOrder.discount)}</span>
                          </div>
                        )}
                        {currentOrder.tax > 0 && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Pajak</span>
                            <span className="font-semibold">{formatRupiah(currentOrder.tax)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg pt-2 border-t border-amber-200">
                          <span className="font-bold text-gray-900">TOTAL</span>
                          <span className="font-black text-amber-600">{formatRupiah(getOrderTotal(currentOrder))}</span>
                        </div>
                      </div>

                      {currentOrder.status !== "lunas" ? (
                        <button
                          onClick={() => setPaymentModal(currentOrder)}
                          disabled={loading}
                          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Banknote size={20} />Bayar Sekarang
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => window.print()} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                            <Printer size={16} />Cetak Struk
                          </button>
                          <button onClick={() => setCurrentOrder(null)} className="flex-1 py-3 bg-amber-100 text-amber-700 rounded-xl font-bold hover:bg-amber-200 transition-all">
                            Pesanan Baru
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                      <p className="font-semibold">Belum ada pesanan dipilih</p>
                      <p className="text-xs mt-1">Scan QR atau cari kode pesanan</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
      </div>

      {scanning && <QRScanModal onClose={() => setScanning(false)} onScan={handleSimulatedScan} />}
      {paymentModal && (
        <PaymentModal order={paymentModal} onClose={() => setPaymentModal(null)} onPay={processPayment} loading={loading} formatRupiah={formatRupiah} />
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

function QRScanModal({ onClose, onScan }) {
  const [manualCode, setManualCode] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const handleManualSubmit = () => { if (manualCode.trim()) onScan(manualCode.trim()); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Camera size={20} className="text-white" /></div>
            <div>
              <h2 className="font-bold text-white text-lg">Scan QR Pesanan</h2>
              <p className="text-white/70 text-xs">Arahkan ke QR code pelanggan</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all"><X size={18} /></button>
        </div>
        <div className="p-6">
          <div className="relative bg-gray-900 rounded-2xl aspect-square overflow-hidden mb-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500"><ScanLine size={48} className="mx-auto mb-2 opacity-50" /><p className="text-sm">Kamera QR Scanner</p></div>
            </div>
            <div className="absolute inset-8 border-2 border-amber-500/50 rounded-3xl">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-500 rounded-br-xl" />
            </div>
            <div className="absolute inset-8 flex items-center justify-center">
              <div className="w-full h-0.5 bg-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-center text-sm text-gray-500">Atau masukkan kode manual:</p>
            <div className="flex gap-2">
              <input ref={inputRef} type="text" value={manualCode} onChange={(e) => setManualCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()} placeholder="Kode pesanan..." className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-500 uppercase" />
              <button onClick={handleManualSubmit} disabled={!manualCode.trim()} className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"><ArrowLeft size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ order, onClose, onPay, loading, formatRupiah }) {
  const [cashAmount, setCashAmount] = useState("");
  const total = order?.total_bayar ?? order?.total ?? order?.subtotal ?? order?.items_total ?? 0;
  const change = Number(cashAmount) - total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div><h2 className="font-bold text-white text-lg">Pembayaran Tunai</h2><p className="text-white/70 text-xs">Input uang yang diterima</p></div>
          <button onClick={onClose} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-center py-4 bg-green-50 rounded-2xl">
            <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
            <p className="text-3xl font-black text-green-600">{formatRupiah(total)}</p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase">Uang Diterima</p>
            <input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="Masukkan jumlah uang..." className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-lg font-bold text-center outline-none focus:border-green-500 transition-all" />
            {change >= 0 && (
              <div className="bg-green-100 rounded-xl p-3 text-center">
                <p className="text-sm text-green-700">Kembalian</p>
                <p className="text-xl font-bold text-green-800">{formatRupiah(change)}</p>
              </div>
            )}
          </div>
          <button onClick={() => onPay("tunai")} disabled={loading || change < 0} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <><Loader2 size={20} className="animate-spin" /> Memproses...</> : <><Check size={20} /> Konfirmasi Pembayaran</>}
          </button>
        </div>
      </div>
    </div>
  );
}