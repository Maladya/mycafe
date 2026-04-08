import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CheckCircle2, CreditCard, Gauge, LayoutDashboard,
  QrCode, ShieldCheck, Smartphone, Sparkles, Store,
  Instagram, Twitter, Facebook, Youtube, MessageCircle,
  MapPin, Phone, Mail, Star, Zap, Coffee, TrendingUp
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL ?? "https://www.mycafe-order.net").replace(/\/$/, "");

/* ─── helpers ─────────────────────────────────────────────────────────── */
function formatRupiah(num) {
  if (!num && num !== 0) return "Rp0";
  return `Rp${Number(num).toLocaleString("id-ID")}`;
}

function getDurationInfo(plan) {
  const unit = String(plan?.duration_unit ?? plan?.durationUnit ?? "").toLowerCase();
  const value = plan?.duration_value ?? plan?.durationValue;
  const minutes = plan?.duration_minutes ?? plan?.durationMinutes;
  const days = plan?.duration_days ?? plan?.durationDays;
  if (Number.isFinite(Number(minutes)) && Number(minutes) > 0) return { unit: "minute", value: Number(minutes) };
  if (unit === "minute" && Number.isFinite(Number(value)) && Number(value) > 0) return { unit: "minute", value: Number(value) };
  if (Number.isFinite(Number(days)) && Number(days) > 0) return { unit: "day", value: Number(days) };
  if ((unit === "day" || unit === "days") && Number.isFinite(Number(value)) && Number(value) > 0) return { unit: "day", value: Number(value) };
  return { unit: "day", value: 30 };
}

function planFeaturePoints(plan) {
  let raw = plan?.features_json ?? plan?.featuresJson ?? plan?.features ?? null;
  if (!raw) return [];
  if (typeof raw === "string") {
    let parsed = raw;
    for (let i = 0; i < 2 && typeof parsed === "string"; i++) {
      const s = String(parsed || "").trim();
      const looksLikeJson = (s.startsWith("[") && s.endsWith("]")) || (s.startsWith("{") && s.endsWith("}"));
      if (!looksLikeJson) break;
      try { parsed = JSON.parse(s); } catch { break; }
    }
    raw = parsed;
    if (typeof raw === "string") return raw.split("\n").map(s => String(s || "").trim()).filter(Boolean);
  }
  if (Array.isArray(raw)) {
    if (raw.length === 1 && typeof raw[0] === "string") {
      const s = String(raw[0] || "").trim();
      if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("{") && s.endsWith("}"))) {
        try { raw = JSON.parse(s); } catch {}
      }
    }
    if (!Array.isArray(raw)) {
      if (typeof raw === "object" && raw) {
        return Object.entries(raw).filter(([, v]) => v === true || v === 1 || v === "1" || v === "true").map(([k]) => String(k).replace(/_/g, " ").trim()).filter(Boolean);
      }
      return [];
    }
    return raw.map(x => String(x?.label ?? x?.name ?? x?.key ?? x ?? "").trim()).filter(Boolean);
  }
  if (typeof raw === "object") {
    return Object.entries(raw).filter(([, v]) => v === true || v === 1 || v === "1" || v === "true").map(([k]) => String(k).replace(/_/g, " ")).filter(Boolean);
  }
  return [];
}

/* ─── global styles ───────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; line-height: 1.62; text-rendering: geometricPrecision; -webkit-font-smoothing: antialiased; }
  .font-display { font-family: 'Syne', sans-serif !important; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes floatA {
    0%,100% { transform: translateY(0) rotate(0deg); }
    50%      { transform: translateY(-14px) rotate(2deg); }
  }
  @keyframes floatB {
    0%,100% { transform: translateY(0) rotate(0deg); }
    50%      { transform: translateY(-9px) rotate(-3deg); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }

  .anim-fade-up   { animation: fadeUp .65s cubic-bezier(.22,1,.36,1) both; }
  .anim-fade-up-1 { animation: fadeUp .65s .12s cubic-bezier(.22,1,.36,1) both; }
  .anim-fade-up-2 { animation: fadeUp .65s .24s cubic-bezier(.22,1,.36,1) both; }
  .anim-fade-up-3 { animation: fadeUp .65s .36s cubic-bezier(.22,1,.36,1) both; }
  .anim-float-a   { animation: floatA 5s ease-in-out infinite; }
  .anim-float-b   { animation: floatB 7s ease-in-out infinite; }

  .shimmer-text {
    background: linear-gradient(90deg,#f59e0b,#f97316,#ef4444,#f59e0b);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }

  .card-hover { transition: transform .22s ease, box-shadow .22s ease; }
  .card-hover:hover { transform: translateY(-5px); box-shadow: 0 28px 60px rgba(245,158,11,.18) !important; }

  .btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 26px; border-radius: 14px;
    background: linear-gradient(135deg,#f59e0b,#f97316);
    color: #fff; font-weight: 800; font-size: 14px;
    text-decoration: none; border: none; cursor: pointer;
    box-shadow: 0 8px 28px rgba(245,158,11,.38);
    transition: box-shadow .2s, transform .2s;
  }
  .btn-primary:hover {
    box-shadow: 0 12px 36px rgba(245,158,11,.55);
    transform: translateY(-2px);
  }

  .btn-outline {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 26px; border-radius: 14px;
    border: 1.5px solid #e7e5e4; background: #fff;
    color: #44403c; font-weight: 700; font-size: 14px;
    text-decoration: none; cursor: pointer;
    transition: border-color .15s, background .15s;
  }
  .btn-outline:hover { background: #fff8ec; border-color: #fde68a; }

  .feature-card { position: relative; overflow: hidden; }
  .feature-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg,#f59e0b,#f97316);
    transform: scaleX(0); transition: transform .3s ease; transform-origin: left;
  }
  .feature-card:hover::before { transform: scaleX(1); }

  .social-btn {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,.07);
    border: 1px solid rgba(255,255,255,.12);
    color: rgba(255,255,255,.6);
    transition: background .2s, transform .2s, box-shadow .2s, color .2s;
    text-decoration: none;
  }
  .social-btn:hover {
    background: linear-gradient(135deg,#f59e0b,#f97316);
    border-color: transparent; color: #fff;
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(245,158,11,.4);
  }

  .footer-link {
    display: block; font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,.5); text-decoration: none;
    margin-bottom: 11px; transition: color .15s;
  }
  .footer-link:hover { color: #f59e0b; }

  .nav-link {
    font-size: 13.5px; font-weight: 700; color: #44403c;
    text-decoration: none; padding: 7px 14px; border-radius: 12px;
    transition: color .15s, background .15s;
  }
  .nav-link:hover { color: #f59e0b; background: #fff8ec; }

  .section-label {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg,#fff8ec,#fff3e0);
    border: 1px solid #fde68a; border-radius: 99px;
    padding: 6px 14px; margin-bottom: 16px;
    font-size: 11px; font-weight: 800; color: #b45309;
    letter-spacing: .05em; text-transform: uppercase;
  }

  .stat-val {
    font-family: 'Syne', sans-serif;
    font-size: 1.8rem; font-weight: 900;
    background: linear-gradient(135deg,#f59e0b,#f97316);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @media (max-width: 900px) {
    .hero-grid { grid-template-columns: 1fr !important; }
    .hero-right { display: none !important; }
    .feat-grid { grid-template-columns: 1fr 1fr !important; }
    .steps-grid { grid-template-columns: 1fr !important; }
    .plans-grid { grid-template-columns: 1fr !important; }
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
    .stat-grid  { grid-template-columns: 1fr 1fr !important; }
    .nav-links-desktop { display: none !important; }
  }
  @media (max-width: 520px) {
    .feat-grid { grid-template-columns: 1fr !important; }
    .footer-grid { grid-template-columns: 1fr !important; }
    .stat-grid { grid-template-columns: 1fr 1fr !important; }
    .btn-primary, .btn-outline { padding: 12px 16px; font-size: 13px; border-radius: 14px; }
    .section-label { font-size: 10px; padding: 5px 12px; }
  }
`;

/* ─── component ───────────────────────────────────────────────────────── */
export default function LandingPage() {
  const features = [
    { title: "QR Menu & Pemesanan Cepat", desc: "Pelanggan scan QR, pilih menu, dan kirim pesanan langsung ke dapur & kasir tanpa antre.", icon: <QrCode size={22} color="#fff" />, grad: "linear-gradient(135deg,#f59e0b,#f97316)" },
    { title: "Dashboard Admin Lengkap", desc: "Kelola menu, meja, promo, pesanan, dan laporan penjualan dari satu dashboard terpadu.", icon: <LayoutDashboard size={22} color="#fff" />, grad: "linear-gradient(135deg,#3b82f6,#6366f1)" },
    { title: "Pembayaran Online", desc: "Terima berbagai metode pembayaran online dan pantau performa penjualan dengan mudah.", icon: <CreditCard size={22} color="#fff" />, grad: "linear-gradient(135deg,#10b981,#14b8a6)" },
    { title: "Mobile-First & Cepat", desc: "Dioptimalkan untuk perangkat mobile dengan performa tinggi — ringan di semua koneksi.", icon: <Smartphone size={22} color="#fff" />, grad: "linear-gradient(135deg,#8b5cf6,#ec4899)" },
  ];

  const steps = [
    { num: "01", title: "Buat akun & daftar cafe", desc: "Daftarkan cafe kamu, lengkapi profil, dan atur tema sesuai brand.", icon: <Store size={20} color="#f59e0b" /> },
    { num: "02", title: "Atur menu & generate QR", desc: "Tambah menu, kategori, atur harga, dan buat QR code untuk setiap meja.", icon: <Sparkles size={20} color="#f59e0b" /> },
    { num: "03", title: "Mulai terima pesanan", desc: "Pantau pesanan realtime dari dashboard admin atau tampilan kasir.", icon: <TrendingUp size={20} color="#f59e0b" /> },
  ];

  const socials = [
    { icon: <Instagram size={18} />, href: "https://instagram.com/mycafe", label: "Instagram" },
    { icon: <Facebook size={18} />, href: "https://facebook.com/mycafe", label: "Facebook" },
    { icon: <Twitter size={18} />, href: "https://twitter.com/mycafe", label: "Twitter" },
    { icon: <Youtube size={18} />, href: "https://youtube.com/@mycafe", label: "YouTube" },
    { icon: <MessageCircle size={18} />, href: "https://wa.me/6281234567890", label: "WhatsApp" },
  ];

  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    (async () => {
      setPlansLoading(true); setPlansError("");
      try {
        const tryFetch = async (url) => { const res = await fetch(url); const data = await res.json().catch(() => ({})); return { res, data }; };
        let out = await tryFetch(`${API_URL}/api/subscriptions/plans/public`);
        if (!out.res.ok) out = await tryFetch(`${API_URL}/api/subscriptions/plans`);
        if (!out.res.ok) throw new Error(out.data?.message || `HTTP ${out.res.status}`);
        const d = out.data;
        setPlans(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.plans) ? d.plans : []);
      } catch (e) { setPlans([]); setPlansError(e?.message || "Gagal memuat paket"); }
      finally { setPlansLoading(false); }
    })();
  }, []);

  const activePlans = useMemo(() => {
    return [...(Array.isArray(plans) ? plans : [])].filter(p => Boolean(p.is_active ?? p.isActive ?? true)).sort((a, b) => {
      const sa = Number(a.sort_order ?? 9999), sb = Number(b.sort_order ?? 9999);
      return sa !== sb ? sa - sb : Number(a.id ?? 0) - Number(b.id ?? 0);
    });
  }, [plans]);

  const highlightPlanId = useMemo(() => activePlans[Math.floor(activePlans.length / 2)]?.id ?? null, [activePlans]);

  const C = {
    cream: "#fffbf5",
    dark: "#1c1917",
    muted: "#78716c",
    border: "#f5f0e8",
    amber: "#f59e0b",
    orange: "#f97316",
  };

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: "100vh", background: C.cream, color: C.dark }}>

        {/* NAV */}
        <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,251,245,.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid #fde68a" }}>
          <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,#f59e0b,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(245,158,11,.4)" }}>
                <Coffee size={18} color="#fff" />
              </div>
              <div>
                <div className="font-display" style={{ fontWeight: 900, fontSize: 17, lineHeight: 1, color: C.dark }}>MyCafe</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#a8a29e" }}>POS & QR Menu</div>
              </div>
            </Link>

            <div className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <a href="#fitur" className="nav-link">Fitur</a>
              <a href="#cara-kerja" className="nav-link">Cara Kerja</a>
              <a href="#paket" className="nav-link">Paket</a>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Link to="/login" style={{ padding: "9px 18px", borderRadius: 12, border: "1.5px solid #e7e5e4", color: "#44403c", fontSize: 13, fontWeight: 700, textDecoration: "none", background: "#fff", transition: "background .15s" }}>
                Masuk
              </Link>
              <Link to="/daftar" className="btn-primary" style={{ padding: "9px 18px", fontSize: 13, borderRadius: 12 }}>
                Daftar <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "rgba(251,191,36,.18)", filter: "blur(90px)", top: -200, left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(249,115,22,.13)", filter: "blur(80px)", top: 60, right: -140, pointerEvents: "none" }} />

          <div style={{ maxWidth: 1152, margin: "0 auto", padding: "82px 20px 86px", position: "relative" }}>
            <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>

              {/* Left */}
              <div className="anim-fade-up">
                <div className="section-label"><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} /> Sistem POS Modern untuk Cafe</div>

                {/* ✅ PERBAIKAN: font lebih kecil & line-height lebih lapang */}
                <h1 className="font-display" style={{ fontSize: "clamp(1.55rem,2.6vw,2.1rem)", fontWeight: 900, lineHeight: 1.28, color: C.dark, marginBottom: 18, letterSpacing: "-0.02em" }}>
                  Kelola Cafe Lebih Cepat dengan <span className="shimmer-text">QR Menu & POS Modern</span>
                </h1>

                {/* ✅ PERBAIKAN: body text lebih kecil */}
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.78, fontWeight: 500, marginBottom: 28, maxWidth: 500 }}>
                  MyCafe membantu cafe kamu menerima pesanan lebih cepat, mengelola menu & promo, dan memantau laporan penjualan dari satu dashboard.
                </p>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 34 }}>
                  <Link to="/daftar" className="btn-primary">Mulai Sekarang <ArrowRight size={16} /></Link>
                  <a href="#cara-kerja" className="btn-outline">Lihat Cara Kerja</a>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                  {["Setup cepat & mudah", "Tampilan UI modern", "Mobile-first design", "Siap pembayaran online"].map(t => (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, color: "#57534e" }}>
                      <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0 }} />{t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Preview */}
              <div className="hero-right anim-fade-up-2" style={{ position: "relative" }}>
                <div style={{ borderRadius: 28, border: "1px solid #fde68a", background: "#fff", boxShadow: "0 40px 100px rgba(245,158,11,.17), 0 8px 32px rgba(0,0,0,.07)", overflow: "hidden" }}>
                  {/* Topbar */}
                  <div style={{ background: "linear-gradient(135deg,#1c1917,#292524)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["#ef4444","#f59e0b","#10b981"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.65)" }}>MyCafe Dashboard</span>
                    <div style={{ background: "rgba(16,185,129,.2)", border: "1px solid rgba(16,185,129,.4)", borderRadius: 6, padding: "2px 8px", fontSize: 9, fontWeight: 800, color: "#34d399" }}>LIVE</div>
                  </div>
                  <div style={{ padding: 20 }}>
                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                      {[
                        { label: "Omzet Hari Ini", val: "Rp2.4 Jt", icon: <TrendingUp size={13} color="#10b981" /> },
                        { label: "Pesanan Aktif", val: "14 Order", icon: <Zap size={13} color="#f59e0b" /> },
                        { label: "Meja Terisi", val: "8 / 12", icon: <Store size={13} color="#6366f1" /> },
                        { label: "Rating", val: "4.9 ★", icon: <Star size={13} color="#f97316" /> },
                      ].map(s => (
                        <div key={s.label} style={{ borderRadius: 14, border: "1px solid #f5f5f4", background: "linear-gradient(135deg,#fffbf5,#fff)", padding: "12px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#a8a29e" }}>{s.label}</span>
                            {s.icon}
                          </div>
                          <div className="font-display" style={{ fontSize: 18, fontWeight: 900, color: C.dark }}>{s.val}</div>
                        </div>
                      ))}
                    </div>
                    {/* Orders */}
                    <div style={{ borderRadius: 14, border: "1px solid #f5f5f4", padding: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: C.dark, marginBottom: 10 }}>Pesanan Terbaru</div>
                      {[
                        { t: "Meja 3", sub: "Kopi Susu, Croissant", badge: "BARU", bc: "#f59e0b", bg: "#fff8ec" },
                        { t: "Meja 7", sub: "Matcha Latte", badge: "PROSES", bc: "#6366f1", bg: "#f0f0ff" },
                        { t: "Takeaway", sub: "4 item", badge: "LUNAS", bc: "#10b981", bg: "#f0fdf9" },
                      ].map(o => (
                        <div key={o.t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafaf9", borderRadius: 10, padding: "8px 12px", marginBottom: 7 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>{o.t}</div>
                            <div style={{ fontSize: 11, color: "#a8a29e", fontWeight: 500 }}>{o.sub}</div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 99, color: o.bc, background: o.bg }}>{o.badge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="anim-float-b" style={{ position: "absolute", bottom: -22, left: -30, background: "#fff", borderRadius: 16, border: "1px solid #fde68a", padding: "12px 16px", boxShadow: "0 12px 40px rgba(245,158,11,.2)", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#10b981,#14b8a6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ShieldCheck size={18} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.dark }}>Akses Terkendali</div>
                    <div style={{ fontSize: 11, color: "#a8a29e", fontWeight: 600 }}>Fitur terproteksi</div>
                  </div>
                </div>

                <div className="anim-float-a" style={{ position: "absolute", top: -18, right: -22, background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 14, padding: "10px 14px", boxShadow: "0 8px 28px rgba(245,158,11,.4)", display: "flex", alignItems: "center", gap: 8 }}>
                  <QrCode size={20} color="#fff" />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>QR Ready</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.8)", fontWeight: 600 }}>Scan & Order</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STAT BAR */}
        <div style={{ borderTop: "1px solid #fde68a", borderBottom: "1px solid #fde68a", background: "#fff8ec" }}>
          <div className="stat-grid" style={{ maxWidth: 1152, margin: "0 auto", padding: "0 20px", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
            {[
              // { val: "2.000+", label: "Cafe Terdaftar" },
              // { val: "98%", label: "Kepuasan Pengguna" },
              { val: "< 5 Mnt", label: "Setup Awal" },
              { val: "24/7", label: "Dukungan Teknis" },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ padding: "22px 20px", borderRight: i < arr.length - 1 ? "1px solid #fde68a" : "none", textAlign: "center" }}>
                <div className="stat-val">{s.val}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <section id="fitur" style={{ maxWidth: 1152, margin: "0 auto", padding: "80px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div className="section-label"><span style={{ width: 5, height: 5, borderRadius: "50%", background: C.amber, display: "inline-block" }} />Fitur Unggulan</div>

            {/* ✅ PERBAIKAN: section heading lebih kecil */}
            <h2 className="font-display" style={{ fontSize: "clamp(1.35rem,2.1vw,1.85rem)", fontWeight: 900, color: C.dark, marginBottom: 12, letterSpacing: "-0.01em" }}>Semua yang Kamu Butuhkan</h2>
            <p style={{ fontSize: 14, color: C.muted, fontWeight: 500, maxWidth: 500, margin: "0 auto", lineHeight: 1.75 }}>Solusi lengkap untuk operasional cafe modern — dari pemesanan hingga laporan keuangan.</p>
          </div>
          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
            {features.map((f, i) => (
              <div key={f.title} className={`feature-card card-hover anim-fade-up-${Math.min(i+1,3)}`} style={{ borderRadius: 24, border: `1px solid ${C.border}`, background: "#fff", padding: 26, boxShadow: "0 2px 16px rgba(0,0,0,.04)" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: f.grad, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(0,0,0,.14)", marginBottom: 16 }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.dark, marginBottom: 8, letterSpacing: "-0.01em" }}>{f.title}</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.72, fontWeight: 500 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="cara-kerja" style={{ background: "linear-gradient(180deg,#fff8ec,#fffbf5)", borderTop: "1px solid #fde68a", borderBottom: "1px solid #fde68a" }}>
          <div style={{ maxWidth: 1152, margin: "0 auto", padding: "80px 20px" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div className="section-label"><span style={{ width: 5, height: 5, borderRadius: "50%", background: C.amber, display: "inline-block" }} />Cara Kerja</div>

              {/* ✅ PERBAIKAN: section heading lebih kecil */}
              <h2 className="font-display" style={{ fontSize: "clamp(1.35rem,2.1vw,1.85rem)", fontWeight: 900, color: C.dark, marginBottom: 12, letterSpacing: "-0.01em" }}>Mulai dalam 3 Langkah</h2>
              <p style={{ fontSize: 14, color: C.muted, fontWeight: 500, lineHeight: 1.75 }}>Tidak perlu keahlian teknis — setup cepat dan langsung bisa digunakan.</p>
            </div>
            <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, position: "relative" }}>
              <div style={{ position: "absolute", top: 37, left: "17%", right: "17%", height: 2, background: "linear-gradient(90deg,#f59e0b,#f97316)", opacity: .25, borderRadius: 99 }} />
              {steps.map(s => (
                <div key={s.title} className="card-hover" style={{ borderRadius: 24, background: "#fff", border: "1px solid #fde68a", padding: 28, boxShadow: "0 6px 28px rgba(245,158,11,.10)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 13, background: "linear-gradient(135deg,#fff8ec,#fff3e0)", border: "1.5px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
                    <span className="font-display" style={{ fontSize: 30, fontWeight: 900, color: "#fde68a" }}>{s.num}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.dark, marginBottom: 8, letterSpacing: "-0.01em" }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.72, fontWeight: 500 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="paket" style={{ maxWidth: 1152, margin: "0 auto", padding: "80px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div className="section-label"><span style={{ width: 5, height: 5, borderRadius: "50%", background: C.amber, display: "inline-block" }} />Paket Langganan</div>

            {/* ✅ PERBAIKAN: section heading lebih kecil */}
            <h2 className="font-display" style={{ fontSize: "clamp(1.35rem,2.1vw,1.85rem)", fontWeight: 900, color: C.dark, marginBottom: 12, letterSpacing: "-0.01em" }}>Harga Transparan, Tanpa Biaya Tersembunyi</h2>
            <p style={{ fontSize: 14, color: C.muted, fontWeight: 500, lineHeight: 1.75 }}>Pilih paket yang sesuai skala dan kebutuhan cafe kamu.</p>
          </div>

          {plansLoading ? (
            <div className="plans-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ borderRadius: 24, border: `1px solid ${C.border}`, padding: 28, background: "#fff" }}>
                  {[70,110,55,55,55,190].map((w,j) => <div key={j} style={{ height: 13, width: `${w}%`, maxWidth: "100%", background: "#f5f0e8", borderRadius: 7, marginBottom: 12 }} />)}
                </div>
              ))}
            </div>
          ) : plansError ? (
            <div style={{ borderRadius: 20, border: "1px solid #fecaca", background: "#fef2f2", padding: 28, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#dc2626" }}>Gagal memuat paket</div>
              <div style={{ fontSize: 13, color: "#ef4444", marginTop: 4, fontWeight: 500 }}>{plansError}</div>
            </div>
          ) : activePlans.length === 0 ? (
            <div style={{ borderRadius: 20, border: `1px solid ${C.border}`, background: "#fafaf9", padding: 28, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#44403c" }}>Paket belum tersedia</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4, fontWeight: 500 }}>Silakan cek lagi nanti.</div>
            </div>
          ) : (
            <div className="plans-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(activePlans.length,3)},1fr)`, gap: 20 }}>
              {activePlans.map(p => {
                const hl = String(p.id) === String(highlightPlanId);
                const pts = planFeaturePoints(p);
                const d = getDurationInfo(p);
                return (
                  <div key={p.id ?? p.name} className="card-hover" style={{ borderRadius: 24, padding: 28, border: hl ? "2px solid #f59e0b" : `1px solid ${C.border}`, background: hl ? "linear-gradient(160deg,#fffbf5,#fff)" : "#fff", boxShadow: hl ? "0 20px 60px rgba(245,158,11,.18)" : "0 2px 16px rgba(0,0,0,.04)", position: "relative" }}>
                    {hl && (
                      <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#fff", fontSize: 11, fontWeight: 800, padding: "5px 16px", borderRadius: 99, boxShadow: "0 4px 14px rgba(245,158,11,.4)", whiteSpace: "nowrap" }}>⭐ Paling Populer</div>
                    )}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: C.dark, letterSpacing: "-0.01em" }}>{p.name ?? "-"}</div>
                      <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span className="font-display" style={{ fontSize: 26, fontWeight: 900, color: hl ? C.orange : C.dark }}>{formatRupiah(p.price ?? 0)}</span>
                        <span style={{ fontSize: 13, color: "#a8a29e", fontWeight: 600 }}>/ {d.value} {d.unit === "minute" ? "menit" : "hari"}</span>
                      </div>
                    </div>
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 24 }}>
                      {pts.length === 0 ? (
                        <div style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>Fitur akan mengikuti paket.</div>
                      ) : pts.slice(0, 6).map(pt => (
                        <div key={pt} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                          <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 13, color: "#44403c", fontWeight: 600, lineHeight: 1.6 }}>{pt}</span>
                        </div>
                      ))}
                    </div>
                    <Link to="/daftar" style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "12px 18px", borderRadius: 14, fontWeight: 800, fontSize: 13.5,
                      textDecoration: "none", width: "100%",
                      background: hl ? "linear-gradient(135deg,#f59e0b,#f97316)" : "#fff",
                      color: hl ? "#fff" : "#44403c",
                      border: hl ? "none" : "1.5px solid #e7e5e4",
                      boxShadow: hl ? "0 6px 22px rgba(245,158,11,.35)" : "none",
                      transition: "all .2s",
                    }}>
                      Pilih {p.name ?? "Paket"} <ArrowRight size={15} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* CTA BANNER */}
        <div style={{ background: "#1c1917" }}>
          <div style={{ maxWidth: 1152, margin: "0 auto", padding: "60px 20px" }}>
            <div style={{ borderRadius: 30, background: "linear-gradient(135deg,#f59e0b 0%,#f97316 60%,#ef4444 100%)", padding: "48px 52px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 30, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -80, top: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.75)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".08em" }}>Mulai Hari Ini</div>

                {/* ✅ PERBAIKAN: CTA heading lebih kecil */}
                <h3 className="font-display" style={{ fontSize: "clamp(1.35rem,2.4vw,1.9rem)", fontWeight: 900, color: "#fff", marginBottom: 10 }}>Tingkatkan Operasional Cafe Kamu</h3>
                <p style={{ fontSize: 14.5, color: "rgba(255,255,255,.88)", fontWeight: 500, lineHeight: 1.68, maxWidth: 500 }}>Buat akun, atur menu, dan mulai terima pesanan dalam hitungan menit.</p>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", position: "relative" }}>
                <Link to="/daftar" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 14, background: "#fff", color: C.orange, fontWeight: 800, fontSize: 14, textDecoration: "none", boxShadow: "0 4px 20px rgba(0,0,0,.15)", transition: "transform .15s" }}>
                  Daftar Gratis <ArrowRight size={17} />
                </Link>
                <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 14, border: "2px solid rgba(255,255,255,.4)", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                  Masuk
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
        <footer style={{ background: "#141110", borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ maxWidth: 1152, margin: "0 auto", padding: "64px 20px 0" }}>
            <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1fr", gap: 48, paddingBottom: 52, borderBottom: "1px solid rgba(255,255,255,.07)" }}>

              {/* Brand */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: "linear-gradient(135deg,#f59e0b,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(245,158,11,.4)" }}>
                    <Coffee size={20} color="#fff" />
                  </div>
                  <div>
                    <div className="font-display" style={{ fontWeight: 900, fontSize: 18, color: "#fff" }}>MyCafe</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.35)" }}>POS & QR Menu Modern</div>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", lineHeight: 1.72, fontWeight: 500, marginBottom: 24, maxWidth: 270 }}>
                  Platform POS & QR Menu modern untuk cafe yang ingin tumbuh lebih cepat, efisien, dan terdata dengan baik.
                </p>

                {/* Contact */}
                <div style={{ marginBottom: 28 }}>
                  {[
                    { icon: <MapPin size={14} />, text: "Jawa Barat, Indonesia" },
                    { icon: <Phone size={14} />, text: "+62 853-2395-1221" },
                    { icon: <Mail size={14} />, text: "halo@mycafe-order.net" },
                  ].map(c => (
                    <div key={c.text} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "rgba(255,255,255,.45)", fontWeight: 600, marginBottom: 10 }}>
                      <span style={{ color: C.amber }}>{c.icon}</span>{c.text}
                    </div>
                  ))}
                </div>

                {/* Socials */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>Ikuti Kami</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {socials.map(s => (
                      <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label} className="social-btn">{s.icon}</a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Produk */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.amber, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 20 }}>Produk</div>
                {["QR Menu","Dashboard Admin","POS Kasir","Laporan Penjualan","Manajemen Meja","Integrasi Pembayaran"].map(l => (
                  <a key={l} href="#" className="footer-link">{l}</a>
                ))}
              </div>

              {/* Perusahaan */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.amber, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 20 }}>Perusahaan</div>
                {["Tentang Kami","Blog & Tips","Karir","Hubungi Kami","Kebijakan Privasi","Syarat & Ketentuan"].map(l => (
                  <a key={l} href="#" className="footer-link">{l}</a>
                ))}
              </div>

              {/* Dukungan */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.amber, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 20 }}>Dukungan</div>
                {["Pusat Bantuan","Dokumentasi","Tutorial Video","Status Layanan","Feedback","Komunitas"].map(l => (
                  <a key={l} href="#" className="footer-link">{l}</a>
                ))}

                {/* WA CTA */}
                {/* <div style={{ marginTop: 22, padding: "14px 16px", borderRadius: 14, background: "rgba(37,211,102,.08)", border: "1px solid rgba(37,211,102,.2)" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#34d399", marginBottom: 5 }}>💬 Chat via WhatsApp</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.4)", fontWeight: 500, marginBottom: 10, lineHeight: 1.5 }}>Senin–Sabtu, 09.00–21.00 WIB</div>
                  <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 800, color: "#34d399", textDecoration: "none" }}>
                    Hubungi Sekarang <ArrowRight size={12} />
                  </a>
                </div> */}
              </div>
            </div>

            {/* Bottom strip */}
            <div style={{ padding: "20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.28)" }}>
                © {new Date().getFullYear()} MyCafe · Dibangun untuk cafe modern Indonesia 🇮🇩
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {[
                  { name: "Instagram", href: "https://instagram.com/mycafe" },
                  { name: "Facebook", href: "https://facebook.com/mycafe" },
                  { name: "Twitter", href: "https://twitter.com/mycafe" },
                  { name: "YouTube", href: "https://youtube.com/@mycafe" },
                ].map(s => (
                  <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.3)", textDecoration: "none", transition: "color .15s" }}
                    onMouseEnter={e => e.target.style.color = C.amber}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,.3)"}
                  >{s.name}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}