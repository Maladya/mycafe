import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

import { useState, useEffect, useRef } from "react";

import FingerprintJS from "@fingerprintjs/fingerprintjs";

import {

  ChevronLeft, CheckCircle, Copy, Download, Share2,

  AlertCircle, Receipt, MapPin, Clock, QrCode,

  Loader2, Image, RefreshCw, Banknote

} from "lucide-react";



/* ─────────────────────────────────────────────

   Config & Helpers

   ──────────────────────────────────────────── */

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://192.168.1.5:3000").replace(/\/$/, "");

const FINGERPRINT_KEY = "astakira_fingerprint";

const TOKEN_KEY = "astakira_token";

const tokenManager = { get: () => localStorage.getItem(TOKEN_KEY) ?? import.meta.env.VITE_API_TOKEN ?? "" };

const THEME_CACHE_KEY = "astakira_theme";



async function getOrCreateFingerprint() {

  let fingerprint = localStorage.getItem(FINGERPRINT_KEY);

  if (fingerprint) return fingerprint;

  const fp = await FingerprintJS.load();

  const result = await fp.get();

  fingerprint = result?.visitorId ?? "";

  if (fingerprint) localStorage.setItem(FINGERPRINT_KEY, fingerprint);

  return fingerprint;

}



function parseTheme(raw) {

  const DEF = { primary: "#f59e0b", secondary: "#ea580c", bg: "#f9fafb", text: "#111827" };

  if (!raw) return DEF;

  try {

    const p = typeof raw === "string" ? JSON.parse(raw) : raw;

    return { primary: p.primary ?? DEF.primary, secondary: p.secondary ?? DEF.secondary,

             bg: p.bg ?? DEF.bg, text: p.text ?? DEF.text };

  } catch { return DEF; }

}



function contrast(hex) {

  try {

    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);

    return (0.299*r + 0.587*g + 0.114*b)/255 > 0.55 ? "#111827" : "#ffffff";

  } catch { return "#ffffff"; }

}



function ha(hex, a) {

  try {

    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);

    return `rgba(${r},${g},${b},${a})`;

  } catch { return hex; }

}



function applyThemeVars(theme) {

  const onP = "#ffffff";

  const vars = [

    `--p:${theme.primary}`, `--s:${theme.secondary}`, `--bg:${theme.bg}`, `--tx:${theme.text}`,

    `--on-p:${onP}`, `--p-20:${ha(theme.primary, 0.2)}`,

    `--bg-soft:${ha(theme.primary, 0.07)}`,

    `--grad:linear-gradient(135deg,${theme.primary},${theme.secondary})`,

  ].join(";");

  document.documentElement.setAttribute("style", vars);

}



/* ─────────────────────────────────────────────

   Main Component

   ──────────────────────────────────────────── */

export default function RingkasanPesanan() {

  const navigate = useNavigate();

  const { state } = useLocation();

  const [searchParams] = useSearchParams();



  const CAFE_ID = state?.cafeId ?? searchParams.get("cafe_id") ?? "";

  const MEJA_ID = state?.mejaId ?? searchParams.get("table")   ?? "1";



  const cart      = state?.cart      || {};

  const items     = state?.items     || [];

  const note      = state?.note      || "";

  const itemNotes = state?.itemNotes || {};

  const subtotal  = state?.subtotal  || 0;

  const discount  = state?.discount  || 0;

  const total     = state?.total     || subtotal;

  const pajakPersenState = state?.pajakPersen;

  const form      = state?.form      || {};

  const method    = state?.method    || "online";

  const existingOrderId = state?.orderId ?? null;



  const orderedItems = items.filter(i => (cart[i.id]?.qty || 0) > 0);

  const totalQty     = orderedItems.reduce((s, i) => s + (cart[i.id]?.qty || 0), 0);



  const [pajakPersen, setPajakPersen] = useState(

    typeof pajakPersenState === "number" ? pajakPersenState : (Number(pajakPersenState) || 0)

  );



  const totalSebelumPajakView = Number(subtotal || 0) - Number(discount || 0);

  const pajakNominalView = Math.max(

    0,

    Math.round(totalSebelumPajakView * (Number(pajakPersen) || 0) / 100)

  );

  const totalView = totalSebelumPajakView + pajakNominalView;



  const buildOrderSignature = () => {

    const itemsSig = orderedItems

      .map(i => `${i.id}:${cart[i.id]?.qty || 0}`)

      .sort()

      .join("|");

    return [

      CAFE_ID,

      MEJA_ID,

      String(method || ""),

      String(form?.nama || ""),

      String(note || ""),

      String(subtotal || 0),

      String(discount || 0),

      String(totalView || 0),

      itemsSig,

    ].join("::");

  };



  const orderCacheKey = `order_cache:${CAFE_ID}:${MEJA_ID}`;



  /* ── State ── */

  const [orderNumber, setOrderNumber] = useState(""); // dari backend

  const [orderId,     setOrderId]     = useState(null);

  const [status,      setStatus]      = useState("submitting"); // submitting | waiting | processing | success | error

  const [submitError, setSubmitError] = useState(null);

  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending | paid



  const [copied,      setCopied]      = useState(false);

  const [cafeName,    setCafeName]    = useState("ASTAKIRA");

  const submitted = useRef(false); // guard double-submit



  const clearCachedOrder = () => {

    try { sessionStorage.removeItem(orderCacheKey); } catch {}

  };



  const handleOrderAgain = () => {

    clearCachedOrder();

    navigate(`/user?table=${encodeURIComponent(MEJA_ID)}&cafe_id=${encodeURIComponent(CAFE_ID)}`,

      {

        replace: true,

        state: { cafeId: CAFE_ID, mejaId: MEJA_ID, existingCart: null },

      }

    );

  };



  /* ── Muat tema ── */

  useEffect(() => {

    try {

      const cached = localStorage.getItem(THEME_CACHE_KEY);

      if (cached) applyThemeVars(JSON.parse(cached));

    } catch {}



    if (!CAFE_ID) return;

    fetch(`${BASE_URL}/api/pengaturan/user/${CAFE_ID}`, {

      headers: { "Content-Type": "application/json" }

    })

      .then(r => r.json())

      .then(r => {

        const raw = r.data ?? r;

        const theme = parseTheme(raw?.tema_colors);

        applyThemeVars(theme);

        try { localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme)); } catch {}

        setCafeName(raw?.nama_cafe ?? raw?.nama ?? raw?.name ?? "ASTAKIRA");

      })

      .catch(() => {});

  }, [CAFE_ID]);

  useEffect(() => {
    if (!CAFE_ID) return;
    if ((Number(pajakPersen) || 0) > 0) return;
    fetch(`${BASE_URL}/api/pajak/public/${CAFE_ID}`, {
      headers: { "Content-Type": "application/json" },
    })
      .then(r => r.json())
      .then(r => {
        const raw = r?.data ?? r;
        const d = Array.isArray(raw) ? (raw[0] ?? {}) : raw;
        const val =
          (typeof d === "number" ? d : null)
          ?? (typeof d?.pajak === "number" ? d.pajak : null)
          ?? (typeof d?.pajak === "string" ? Number(d.pajak) : null)
          ?? (typeof d?.pajak_persen === "string" ? Number(String(d.pajak_persen).replace(/%/g, "")) : null)
          ?? null;
        if (val === null || Number.isNaN(val)) return;
        setPajakPersen(val);
      })
      .catch(() => {});
  }, [CAFE_ID, pajakPersen]);



  /* ── POST pesanan ke backend saat mount ── */

  useEffect(() => {

    if (submitted.current) return; // hindari double submit (React StrictMode)

    submitted.current = true;



    // Jika metode online atau sudah ada orderId dari Midtrans, jangan bikin pesanan baru

    const midtransOrderId = state?.midtrans?.orderId;

    if (method === "online" && midtransOrderId) {

      setOrderId(midtransOrderId);

      setOrderNumber(midtransOrderId);

      setStatus("success");

      return;

    }



    const signature = buildOrderSignature();

    try {

      const cachedRaw = sessionStorage.getItem(orderCacheKey);

      if (cachedRaw) {

        const cached = JSON.parse(cachedRaw);

        if (cached?.signature === signature && cached?.orderId) {

          setOrderId(cached.orderId);

          setOrderNumber(cached.orderId);

          setStatus("success");

          return;

        }

      }

    } catch {}



    // Kalau tidak ada item, skip

    if (orderedItems.length === 0) {

      setStatus("error");

      setSubmitError("Tidak ada item dalam pesanan.");

      return;

    }



    const buatPesanan = async () => {

      setStatus("submitting");

      setSubmitError(null);

      try {

        let fingerprint = "";

        try {
          fingerprint = await getOrCreateFingerprint();
        } catch (err) {
          console.warn("fingerprint failed:", err);
        }

        const fingerprintHeader = fingerprint ? { "x-fingerprint": fingerprint } : {};

        // Jika datang dari flow "Tambah Pesanan", append ke order yang sudah ada

        if (existingOrderId) {

          const payloadTambah = {

            items: orderedItems.map(item => {
              const cartItem = cart[item.id] || {};
              const variantsPrice = (cartItem.variants || []).reduce((s, v) => s + (v?.hargaVariant || 0), 0);
              return {
                nama_menu: item.name ?? item.nama_menu ?? item.nama ?? "",
                qty:       cartItem.qty || 0,
                harga:     (item.price ?? item.harga ?? 0) + variantsPrice,
                catatan:   itemNotes?.[item.id] ?? cartItem.catatan ?? "",
                variants:  cartItem.variants || [],
              };
            }),

          };



          const resTambah = await fetch(`${BASE_URL}/api/orders/${existingOrderId}/items`, {

            method:  "POST",

            headers: { "Content-Type": "application/json", ...fingerprintHeader },

            body:    JSON.stringify(payloadTambah),

          });

          const dataTambah = await resTambah.json().catch(() => ({}));

          if (!resTambah.ok || dataTambah.success === false) {

            throw new Error(dataTambah.message ?? `HTTP ${resTambah.status}`);

          }



          setOrderId(existingOrderId);

          setOrderNumber(existingOrderId);

          setStatus("success");

          return;

        }



        const totalSebelumPajak = Number(subtotal || 0) - Number(discount || 0);

        const pajakNominal = Math.max(

          0,

          Math.round(totalSebelumPajak * (Number(pajakPersen) || 0) / 100)

        );

        const totalAkhir = totalSebelumPajak + pajakNominal;



        const payload = {

          cafe_id:  CAFE_ID,

          meja:     MEJA_ID,

          nama:     form?.nama ?? "",

          total:    totalAkhir,

          note:     note,

          method:   method,

          estimasi: "15 mnt",

          items:    orderedItems.map(item => {
            const cartItem = cart[item.id] || {};
            const variantsPrice = (cartItem.variants || []).reduce((s, v) => s + (v?.hargaVariant || 0), 0);
            return {
              nama_menu: item.name ?? item.nama_menu ?? item.nama ?? "",
              qty:       cartItem.qty || 0,
              harga:     (item.price ?? item.harga ?? 0) + variantsPrice,
              catatan:   itemNotes?.[item.id] ?? cartItem.catatan ?? "",
              variants:  cartItem.variants || [],
            };
          }),

        };



        const res = await fetch(`${BASE_URL}/api/orders`, {

          method:  "POST",

          headers: { "Content-Type": "application/json", ...fingerprintHeader },

          body:    JSON.stringify(payload),

        });

        const data = await res.json();



        if (!res.ok || data.success === false) {

          throw new Error(data.message ?? `HTTP ${res.status}`);

        }



        const newId = data.data?.id ?? data.id ?? data.order_id ?? "";

        setOrderId(newId);

        setOrderNumber(newId); // gunakan ID dari backend sebagai nomor pesanan

        setStatus("success");

        try {

          sessionStorage.setItem(orderCacheKey, JSON.stringify({ signature, orderId: newId, createdAt: Date.now() }));

        } catch {}

      } catch (err) {

        setSubmitError(err.message || "Gagal membuat pesanan");

        setStatus("error");

      }

    };



    buatPesanan();

   

  }, []);



  /* ── Polling status pembayaran untuk metode kasir ── */

  useEffect(() => {

    if (method !== "kasir" || !orderNumber || paymentStatus === "paid") return;

    

    console.log("Starting polling for order:", orderNumber);

    

    const checkPaymentStatus = async () => {

      try {

        // Gunakan endpoint publik /api/orders/:id dengan auth token

        const res = await fetch(`${BASE_URL}/api/orders/${orderNumber}/status`, {

          headers: { 

            "Content-Type": "application/json",

            "Authorization": `Bearer ${tokenManager.get()}`

          }

        });

        console.log("Polling response status:", res.status);

        if (res.ok) {

          const data = await res.json();

          console.log("Polling data:", data);

          // Cek status dari berbagai format response

          const orderStatus = data.data?.status ?? data.status ?? data.order?.status ?? "";

          console.log("Order status:", orderStatus);

          if (orderStatus === "lunas" || orderStatus === "paid" || orderStatus === "selesai") {

            console.log("Payment detected as PAID!");

            setPaymentStatus("paid");

          }

        } else {

          console.log("Polling failed:", res.status, res.statusText);

        }

      } catch (err) {

        console.error("Error checking payment status:", err);

      }

    };



    // Check immediately and then every 3 seconds

    checkPaymentStatus();

    const interval = setInterval(checkPaymentStatus, 3000);

    

    return () => clearInterval(interval);

  }, [method, orderNumber, paymentStatus, BASE_URL]);



  const triggerPaymentSuccess = () => {

    setStatus("success");

  };



  const handleCopy = async () => {
    if (!orderNumber) return;
    try {
      // Coba clipboard API modern
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(orderNumber);
      } else {
        // Fallback untuk HTTP atau browser lama
        const textArea = document.createElement("textarea");
        textArea.value = orderNumber;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!successful) throw new Error("Copy failed");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      // Fallback terakhir: select text untuk manual copy
      alert(`Kode pesanan: ${orderNumber}\n\nSilakan salin manual.`);
    }
  };


  const handleShare = async () => {
    if (!orderNumber) return;
    try {
      // Coba share API modern
      if (navigator.share) {
        await navigator.share({
          title: "Nomor Pesanan",
          text: `Nomor pesanan: ${orderNumber}`,
        });
      } else {
        // Fallback untuk browser lama atau tidak mendukung share API
        const whatsappUrl = `https://wa.me/?text=Nomor%20pesanan%3A%20${orderNumber}`;
        window.open(whatsappUrl, "_blank");
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };


  /* ── Sub-components ── */

  const DetailCard = ({ accentColor }) => (

    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">

        <Receipt size={15} style={{ color: accentColor || "var(--p)" }} />

        <h3 className="font-bold text-sm text-gray-900">Detail Pesanan</h3>

      </div>

      <div className="divide-y divide-gray-50">

        {orderedItems.map(item => (

          <div key={item.id} className="flex items-center gap-3 px-4 py-3">

            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"

              style={{ background: "var(--bg-soft)" }}>

              {item.image_url || item.image

                ? <img src={item.image_url ?? item.image} alt={item.name}

                    className="w-full h-full object-cover"

                    onError={e => { e.currentTarget.style.display = "none"; }} />

                : <div className="w-full h-full flex items-center justify-center">

                    <Image size={14} style={{ color: "var(--p)", opacity: 0.4 }} />

                  </div>

              }

            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm line-clamp-1">
                {item.name ?? item.nama_menu ?? item.nama}
              </p>
              {(cart[item.id]?.variants?.length > 0 || cart[item.id]?.catatan || itemNotes[item.id]) && (
                <div className="space-y-0.5 mt-0.5">
                  {cart[item.id]?.variants?.map((v, idx) => (
                    <p key={idx} className="text-[10px] text-gray-500">
                      • {v.namaGroup}: {v.label}
                      {v.hargaVariant > 0 && <span className="text-gray-400"> (+Rp{v.hargaVariant.toLocaleString()})</span>}
                    </p>
                  ))}
                  {cart[item.id]?.catatan && (
                    <p className="text-[10px] text-gray-500 italic"> {cart[item.id].catatan}</p>
                  )}
                  {itemNotes[item.id] && (
                    <p className="text-[10px]" style={{ color: "var(--p)" }}> Catatan: {itemNotes[item.id]}</p>
                  )}
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-gray-400">{cart[item.id]?.qty || 0}×</p>
              <p className="text-sm font-bold text-gray-800">
                Rp{(((cart[item.id]?.qty || 0) * (item.price ?? item.harga ?? 0)) + (cart[item.id]?.variants || []).reduce((s, v) => s + ((v.hargaVariant || 0) * (cart[item.id]?.qty || 0)), 0)).toLocaleString()}
              </p>
            </div>

          </div>

        ))}

      </div>

      {note && (

        <div className="px-4 pb-3">

          <div className="rounded-xl px-3 py-2 text-xs border"

            style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)", color: "var(--p)" }}>

             Catatan: {note}

          </div>

        </div>

      )}

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-2">

        <div className="flex justify-between text-sm">

          <span className="text-gray-500">Subtotal ({totalQty} item)</span>

          <span className="font-semibold">Rp{subtotal.toLocaleString()}</span>

        </div>

        {discount > 0 && (

          <div className="flex justify-between text-sm">

            <span className="text-green-600">Diskon Promo</span>

            <span className="font-semibold text-green-600">-Rp{discount.toLocaleString()}</span>

          </div>

        )}

        <div className="flex justify-between text-sm">

          <span className="text-gray-500">Biaya layanan</span>

          <span className="font-semibold text-green-600">Gratis</span>

        </div>

        {pajakNominalView > 0 && (

          <div className="flex justify-between text-sm">

            <span className="text-gray-500">Pajak ({Number(pajakPersen) || 0}%)</span>

            <span className="font-semibold">Rp{pajakNominalView.toLocaleString()}</span>

          </div>

        )}

        <div className="h-px bg-gray-200" />

        <div className="flex justify-between items-center">

          <span className="font-bold text-gray-900">Total Pembayaran</span>

          <span className="font-extrabold text-lg" style={{ color: accentColor || "var(--p)" }}>

            Rp{totalView.toLocaleString()}

          </span>

        </div>

      </div>

      {(form.nama || form.hp) && (

        <div className="px-4 py-3 border-t border-gray-100">

          <p className="text-xs text-gray-400 font-semibold mb-2">Info Pemesan</p>

          {form.nama && <p className="text-sm font-semibold text-gray-700">{form.nama}</p>}

          {form.hp   && <p className="text-xs text-gray-500">{form.hp}</p>}

        </div>

      )}

    </div>

  );



  const OrderNumberCard = ({ badgeText, tagStyle }) => (

    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

      <div className="px-4 py-2.5 flex items-center justify-between border-b" style={tagStyle}>

        <div className="flex items-center gap-2">

          <MapPin size={14} style={{ color: "var(--p)" }} />

          <span className="text-xs font-semibold" style={{ color: "var(--p)" }}>

            Makan di Tempat · Meja {MEJA_ID}

          </span>

        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"

          style={{ background: "var(--p-20)", color: "var(--p)" }}>

          {badgeText}

        </span>

      </div>

      <div className="p-5 text-center">

        <p className="text-xs text-gray-400 font-semibold mb-3">Nomor Pesanan</p>

        <div className="rounded-2xl px-6 py-3 inline-block shadow-lg mb-3" style={{ background: "var(--grad)" }}>

          <span className="font-extrabold text-2xl tracking-[0.2em]" style={{ color: "var(--on-p)" }}>

            {orderNumber || "—"}

          </span>

        </div>

        <div className="flex gap-2 justify-center mt-3">

          <button onClick={handleCopy} disabled={!orderNumber}

            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${

              copied ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-700 hover:bg-gray-200"

            } disabled:opacity-50`}>

            <Copy size={13} /> {copied ? "Tersalin!" : "Salin"}

          </button>

          <button onClick={handleShare}

            disabled={!orderNumber}

            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all disabled:opacity-50">

            <Share2 size={13} /> Bagikan

          </button>

        </div>

      </div>

    </div>

  );



  /* ══════════════════════════════════════════════════════════

      RENDER

  ══════════════════════════════════════════════════════════ */

  return (

    <div className="max-w-md mx-auto min-h-screen relative" style={{ background: "var(--bg)", color: "var(--tx)" }}>



      {/* HEADER */}

      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">

        <div className="flex items-center px-4 py-3.5">

          <button onClick={() => navigate(-1)}

            className="w-10 h-10 flex items-center justify-center rounded-xl hover:opacity-80 transition-all"

            style={{ background: "var(--bg-soft)" }}>

            <ChevronLeft size={20} style={{ color: "var(--p)" }} />

          </button>

          <div className="flex-1 text-center">

            <h1 className="font-extrabold text-base text-gray-900">Ringkasan Pesanan</h1>

            <p className="text-[10px] text-gray-400 mt-0.5">Meja {MEJA_ID} · {cafeName}</p>

          </div>

          <div className="w-10" />

        </div>

      </div>



      <div className="pb-8 transition-all duration-300">



        {/* ══ SUBMITTING ══ */}

        {status === "submitting" && (

          <div className="flex flex-col items-center justify-center py-24 px-8 text-center">

            <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl mb-4"

              style={{ background: "var(--grad)" }}>

              <Loader2 size={36} className="animate-spin" style={{ color: "var(--on-p)" }} />

            </div>

            <h2 className="text-lg font-extrabold text-gray-800 mb-1">Membuat Pesanan...</h2>

            <p className="text-sm text-gray-400">Mohon tunggu, pesananmu sedang dikirim ke dapur</p>

          </div>

        )}



        {/* ══ ERROR ══ */}

        {status === "error" && (

          <div className="flex flex-col items-center justify-center py-24 px-8 text-center">

            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center shadow-lg mb-4">

              <AlertCircle size={36} className="text-red-500" />

            </div>

            <h2 className="text-lg font-extrabold text-gray-800 mb-1">Gagal Membuat Pesanan</h2>

            <p className="text-sm text-gray-500 mb-6">{submitError || "Terjadi kesalahan. Silakan coba lagi."}</p>

            <button onClick={() => { submitted.current = false; setStatus("submitting"); setSubmitError(null); buatPesanan(); }}

              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105"

              style={{ background: "var(--grad)" }}>

              <RefreshCw size={16} /> Coba Lagi

            </button>

            <button onClick={() => navigate(-1)}

              className="mt-3 text-sm text-gray-400 underline hover:text-gray-600 transition-colors">

              Kembali ke Pembayaran

            </button>

          </div>

        )}



        {/* ══ SUCCESS ══ */}

        {status === "success" && (

          <>

            {method === "kasir" && paymentStatus === "paid" ? (

              /* ══ KASIR: SUDAH DIBAYAR ══ */

              <>

                <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-5 pt-8 pb-12">

                  <div className="text-center">

                    <div className="flex justify-center mb-4 relative">

                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl relative z-10">

                        <CheckCircle size={46} className="text-green-500" strokeWidth={2.5} />

                      </div>

                      <div className="absolute inset-0 flex items-center justify-center">

                        <div className="w-20 h-20 rounded-full border-4 border-white/30 animate-ping" />

                      </div>

                    </div>

                    <h2 className="text-white text-2xl font-extrabold mb-1">Pembayaran Selesai!</h2>

                    <p className="text-green-100 text-sm">Terima kasih, pesanan akan segera diproses</p>

                    <div className="flex items-center justify-center gap-2 mt-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 w-fit mx-auto">

                      <Clock size={13} className="text-green-100" />

                      <span className="text-white text-xs font-semibold">Estimasi 10–20 menit</span>

                    </div>

                  </div>

                </div>



                <div className="px-4 -mt-6 space-y-4">

                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

                    <div className="px-4 py-2.5 flex items-center justify-between border-b bg-green-50 border-green-100">

                      <div className="flex items-center gap-2">

                        <MapPin size={14} className="text-green-600" />

                        <span className="text-xs font-semibold text-green-700">Makan di Tempat · Meja {MEJA_ID}</span>

                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">

                        ✓ Lunas

                      </span>

                    </div>

                    <div className="p-5 text-center">

                      <p className="text-xs text-gray-400 font-semibold mb-3">Nomor Pesanan</p>

                      <div className="rounded-2xl px-6 py-3 inline-block shadow-lg shadow-green-500/30 mb-3"

                        style={{ background: "linear-gradient(135deg,#22c55e,#10b981)" }}>

                        <span className="text-white font-extrabold text-2xl tracking-[0.2em]">{orderNumber}</span>

                      </div>

                      <div className="flex gap-2 justify-center mt-3">

                        <button onClick={handleCopy}

                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${

                            copied ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-700 hover:bg-gray-200"

                          }`}>

                          <Copy size={13} /> {copied ? "Tersalin!" : "Salin"}

                        </button>

                        <button onClick={handleShare}

                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">

                          <Share2 size={13} /> Bagikan

                        </button>

                      </div>

                    </div>

                  </div>



                  <DetailCard accentColor="#22c55e" />



                  <button onClick={handleOrderAgain}

                    className="w-full py-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all flex items-center justify-center gap-2"

                    style={{ background: "var(--grad)", color: "var(--on-p)" }}>

                    <Receipt size={18} /> Buat Pesanan Baru

                  </button>



                  <p className="text-center text-xs text-gray-400 pb-4">

                    Terima kasih sudah memesan di {cafeName} ☕

                  </p>

                </div>

              </>

            ) : method === "kasir" ? (

              /* ══ KASIR: QR Code Langsung ══ */

              <>

                <div className="px-4 pt-6 space-y-4">

                  {/* QR Code - Fokus Utama */}

                  {orderNumber && (

                    <div className="bg-white rounded-2xl shadow-xl border-2 border-amber-200 overflow-hidden">

                      <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-500 to-orange-500">

                        <div className="flex items-center justify-center gap-2">

                          <QrCode size={20} className="text-white" />

                          <h3 className="font-bold text-base text-white">Scan di Kasir</h3>

                        </div>

                      </div>

                      <div className="p-6 text-center">

                        <div className="bg-white p-4 rounded-xl border-2 border-gray-200 inline-block shadow-inner">

                          <img

                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`ORDER:${orderNumber}`)}`}

                            alt="QR Code untuk Kasir"

                            className="w-56 h-56"

                            onError={(e) => {

                              e.currentTarget.style.display = 'none';

                              e.currentTarget.nextSibling.style.display = 'flex';

                            }}

                          />

                          <div className="hidden w-56 h-56 bg-gray-100 rounded-lg items-center justify-center">

                            <span className="text-3xl font-bold text-gray-400">{orderNumber}</span>

                          </div>

                        </div>

                        <p className="text-sm text-gray-600 mt-4 font-semibold">Tunjukkan QR ini ke kasir</p>

                        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 rounded-full">

                          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>

                          <span className="text-xs text-amber-700 font-medium">Menunggu scan kasir</span>

                        </div>

                      </div>

                    </div>

                  )}



                  {/* Order Number - Secondary */}

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">

                      <div className="flex items-center justify-between">

                        <div className="flex items-center gap-2">

                          <MapPin size={14} className="text-gray-500" />

                          <span className="text-xs font-semibold text-gray-600">Meja {MEJA_ID}</span>

                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">

                          ⏳ Menunggu Bayar

                        </span>

                      </div>

                    </div>

                    <div className="p-4 text-center">

                      <p className="text-xs text-gray-400 mb-2">Nomor Pesanan</p>

                      <div className="rounded-xl px-4 py-2 inline-block bg-gray-100">

                        <span className="font-bold text-xl text-gray-800 tracking-wider">{orderNumber}</span>

                      </div>

                      <div className="flex gap-2 justify-center mt-3">

                        <button onClick={handleCopy}

                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${

                            copied ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"

                          }`}>

                          <Copy size={12} /> {copied ? "Tersalin!" : "Salin"}

                        </button>

                        <button onClick={handleShare}

                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">

                          <Share2 size={12} /> Bagikan

                        </button>

                      </div>

                    </div>

                  </div>



                  <DetailCard accentColor="#f59e0b" />



                  <p className="text-center text-xs text-gray-400 pb-4">

                    Pesanan akan diproses setelah kasir scan QR ☕

                  </p>

                </div>

              </>

            ) : (

              /* ══ ONLINE: Pembayaran Selesai ══ */

              <>

                <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-5 pt-8 pb-12">

                  <div className="text-center">

                    <div className="flex justify-center mb-4 relative">

                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl relative z-10">

                        <CheckCircle size={46} className="text-green-500" strokeWidth={2.5} />

                      </div>

                      <div className="absolute inset-0 flex items-center justify-center">

                        <div className="w-20 h-20 rounded-full border-4 border-white/30 animate-ping" />

                      </div>

                    </div>

                    <h2 className="text-white text-2xl font-extrabold mb-1">Ringkasan Pesanan</h2>

                    <p className="text-green-100 text-sm">Pembayaran selesai, pesanan akan diantar</p>

                    <div className="flex items-center justify-center gap-2 mt-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 w-fit mx-auto">

                      <Clock size={13} className="text-green-100" />

                      <span className="text-white text-xs font-semibold">Estimasi 10–20 menit</span>

                    </div>

                  </div>

                </div>



                <div className="px-4 -mt-6 space-y-4">

                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

                    <div className="px-4 py-2.5 flex items-center justify-between border-b bg-green-50 border-green-100">

                      <div className="flex items-center gap-2">

                        <MapPin size={14} className="text-green-600" />

                        <span className="text-xs font-semibold text-green-700">Makan di Tempat · Meja {MEJA_ID}</span>

                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">

                        ✓ Pembayaran Diterima

                      </span>

                    </div>

                    <div className="p-5 text-center">

                      <p className="text-xs text-gray-400 font-semibold mb-3">Nomor Pesanan</p>

                      <div className="rounded-2xl px-6 py-3 inline-block shadow-lg shadow-green-500/30 mb-3"

                        style={{ background: "linear-gradient(135deg,#22c55e,#10b981)" }}>

                        <span className="text-white font-extrabold text-2xl tracking-[0.2em]">{orderNumber}</span>

                      </div>

                      <div className="flex gap-2 justify-center mt-3">

                        <button onClick={handleCopy}

                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${

                            copied ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-700 hover:bg-gray-200"

                          }`}>

                          <Copy size={13} /> {copied ? "Tersalin!" : "Salin"}

                        </button>

                        <button onClick={handleShare}

                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">

                          <Share2 size={13} /> Bagikan

                        </button>

                      </div>

                    </div>

                  </div>



                  <DetailCard accentColor="#22c55e" />



                  <button onClick={handleOrderAgain}

                    className="w-full py-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all flex items-center justify-center gap-2"

                    style={{ background: "var(--grad)", color: "var(--on-p)" }}>

                    <Receipt size={18} /> Buat Pesanan Baru

                  </button>



                  <p className="text-center text-xs text-gray-400 pb-4">

                    Terima kasih sudah memesan di {cafeName} ☕

                  </p>

                </div>

              </>

            )}

          </>

        )}

      </div>

      <style>{`

        @keyframes fadeIn  { from { opacity: 0; }             to { opacity: 1; } }

        @keyframes scaleIn { from { opacity: 0; scale: 0.9; } to { opacity: 1; scale: 1; } }

        .animate-fadeIn  { animation: fadeIn  0.3s ease-out; }

        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.16,1,0.3,1); }

        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }

      `}</style>

    </div>

  );

}