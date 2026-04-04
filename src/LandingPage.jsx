import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, CreditCard, Gauge, LayoutDashboard, QrCode, ShieldCheck, Smartphone, Sparkles, Store } from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://192.168.1.5:3000").replace(/\/$/, "");

function formatRupiah(num) {
  if (!num && num !== 0) return "Rp0";
  return `Rp${Number(num).toLocaleString("id-ID")}`;
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

function planFeaturePoints(plan) {
  const raw = plan?.features_json ?? plan?.featuresJson ?? plan?.features ?? {};
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw)
    .filter(([, v]) => v === true)
    .map(([k]) => String(k).replace(/_/g, " "));
}

export default function LandingPage() {
  const SHOW_TESTIMONIALS = false;
  const SHOW_FAQ = false;

  const features = [
    {
      title: "QR Menu & Pemesanan Cepat",
      desc: "Pelanggan scan QR, pilih menu, dan kirim pesanan tanpa antre.",
      icon: <QrCode size={20} className="text-white" />,
      color: "from-amber-500 to-orange-500",
    },
    {
      title: "Dashboard Admin Lengkap",
      desc: "Kelola menu, meja, promo, pesanan, dan laporan dari satu tempat.",
      icon: <LayoutDashboard size={20} className="text-white" />,
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "Pembayaran Online",
      desc: "Terima pembayaran online dan pantau performa penjualan dengan mudah.",
      icon: <CreditCard size={20} className="text-white" />,
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "Cepat, Ringan, Mobile-First",
      desc: "Dioptimalkan untuk perangkat mobile dan performa tinggi.",
      icon: <Smartphone size={20} className="text-white" />,
      color: "from-purple-500 to-pink-500",
    },
  ];

  const steps = [
    {
      title: "Buat akun & daftar cafe",
      desc: "Daftarkan cafe kamu, lengkapi profil, dan atur tema.",
      icon: <Store size={18} className="text-amber-600" />,
    },
    {
      title: "Atur menu & meja",
      desc: "Tambah menu, kategori, dan generate QR untuk setiap meja.",
      icon: <Sparkles size={18} className="text-amber-600" />,
    },
    {
      title: "Mulai terima pesanan",
      desc: "Pantau pesanan realtime dari dashboard admin / kasir.",
      icon: <Gauge size={18} className="text-amber-600" />,
    },
  ];

  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState("");
  const [plans, setPlans] = useState([]);

  const testimonials = [
    {
      name: "Rina",
      role: "Owner Coffee Shop",
      quote: "Setelah pakai MyCafe, antrian berkurang. Pelanggan tinggal scan QR, pesanan langsung masuk ke kasir.",
    },
    {
      name: "Bayu",
      role: "Manager Cafe",
      quote: "Laporan penjualan jadi rapi dan bisa dipantau dari HP. Setup awal juga cepat.",
    },
    {
      name: "Salsa",
      role: "Admin Operasional",
      quote: "Menu & promo gampang diupdate. Tim jadi fokus melayani, bukan urus catatan manual.",
    },
  ];

  const faqs = [
    {
      q: "Apakah bisa dipakai tanpa kasir?",
      a: "Bisa. Kamu tetap bisa pakai QR Menu untuk pemesanan, lalu pantau pesanan dari dashboard admin.",
    },
    {
      q: "Apakah pelanggan harus install aplikasi?",
      a: "Tidak. Pelanggan cukup scan QR dan membuka menu melalui browser.",
    },
    {
      q: "Apakah paket bisa diubah sewaktu-waktu?",
      a: "Bisa. Kamu bisa memperpanjang atau mengganti paket lewat halaman billing admin cafe.",
    },
    {
      q: "Pembayaran online pakai apa?",
      a: "Pembayaran online terintegrasi melalui Midtrans (tergantung konfigurasi cafe).",
    },
  ];

  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const fetchPlans = async () => {
      setPlansLoading(true);
      setPlansError("");
      try {
        const tryFetch = async (url) => {
          const res = await fetch(url);
          const data = await res.json().catch(() => ({}));
          return { res, data };
        };

        const publicUrl = `${API_URL}/api/subscriptions/plans/public`;
        const privateUrl = `${API_URL}/api/subscriptions/plans`;

        let out = await tryFetch(publicUrl);
        if (!out.res.ok) {
          console.error("LandingPage fetch public plans failed", { url: publicUrl, status: out.res.status, body: out.data });
          out = await tryFetch(privateUrl);
        }
        if (!out.res.ok) {
          console.error("LandingPage fetch plans failed", { url: privateUrl, status: out.res.status, body: out.data });
          throw new Error(out.data?.message || `HTTP ${out.res.status}`);
        }

        const data = out.data;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.plans)
              ? data.plans
              : [];
        setPlans(list);
      } catch (e) {
        setPlans([]);
        setPlansError(e?.message || "Gagal memuat paket");
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const activePlans = useMemo(() => {
    const arr = Array.isArray(plans) ? plans : [];
    return [...arr]
      .filter(p => Boolean(p.is_active ?? p.isActive ?? true))
      .sort((a, b) => {
        const sa = Number(a.sort_order ?? 9999);
        const sb = Number(b.sort_order ?? 9999);
        if (sa !== sb) return sa - sb;
        return Number(a.id ?? 0) - Number(b.id ?? 0);
      });
  }, [plans]);

  const highlightPlanId = useMemo(() => {
    if (activePlans.length === 0) return null;
    const mid = Math.floor(activePlans.length / 2);
    return activePlans[mid]?.id ?? null;
  }, [activePlans]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow">
              <Store size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black leading-none">MyCafe</p>
              <p className="text-[10px] text-gray-400 font-semibold -mt-0.5">POS & QR Menu</p>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            {SHOW_TESTIMONIALS ? (
              <a href="#testimoni" className="px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Testimoni</a>
            ) : null}
            {SHOW_FAQ ? (
              <a href="#faq" className="px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">FAQ</a>
            ) : null}
            <a href="#fitur" className="px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Fitur</a>
            <a href="#cara-kerja" className="px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cara Kerja</a>
            <a href="#paket" className="px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Paket</a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all"
            >
              Login
            </Link>
            <Link
              to="/daftar"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-black shadow hover:shadow-md transition-all"
            >
              Daftar
            </Link>
          </div>
        </div>
      </div>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-72 w-[620px] -translate-x-1/2 rounded-full bg-amber-200/45 blur-3xl" />
          <div className="absolute top-40 right-[-120px] h-80 w-80 rounded-full bg-orange-200/40 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[-120px] h-80 w-80 rounded-full bg-indigo-200/35 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">
                <ShieldCheck size={14} />
                Sistem langganan & kontrol akses
              </div>

              <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight leading-[1.08]">
                Kelola Cafe Lebih Cepat dengan
                <span className="block bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">QR Menu & POS Modern</span>
              </h1>

              <p className="mt-4 text-gray-500 text-base sm:text-lg leading-relaxed">
                MyCafe membantu cafe kamu menerima pesanan lebih cepat, mengelola menu & promo, dan memantau laporan penjualan dari satu dashboard.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/daftar"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-white font-black shadow-lg hover:shadow-xl transition-all"
                >
                  Mulai Sekarang <ArrowRight size={18} />
                </Link>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                {["Setup cepat", "UI modern", "Mobile-first", "Siap pembayaran online"].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[28px] border border-gray-100 bg-white shadow-[0_30px_90px_rgba(17,24,39,0.14)] overflow-hidden">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-4 flex items-center justify-between">
                  <p className="text-white font-black">Preview Dashboard</p>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow mb-3">
                          <Sparkles size={18} />
                        </div>
                        <p className="text-sm font-black text-gray-900">Stat {i}</p>
                        <p className="text-xs text-gray-500 mt-1">Ringkasan cepat</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
                    <p className="text-sm font-black text-gray-900">Pesanan Terbaru</p>
                    <div className="mt-3 space-y-2">
                      {["Meja 3 · 2 item", "Meja 7 · 1 item", "Takeaway · 4 item"].map((t) => (
                        <div key={t} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                          <p className="text-xs font-semibold text-gray-700">{t}</p>
                          <span className="text-[10px] font-black text-emerald-600">PAID</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white border border-gray-100 shadow-lg px-4 py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <ShieldCheck size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">Akses terkendali</p>
                  <p className="text-[10px] text-gray-500 font-semibold">Langganan & fitur terproteksi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {SHOW_TESTIMONIALS ? (
        <section id="testimoni" className="bg-gray-50 border-y border-gray-100">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black">Dipercaya untuk Operasional Harian</h2>
                <p className="text-gray-500 mt-2 text-sm sm:text-base">Cerita singkat dari pengguna MyCafe.</p>
              </div>
              <Link to="/daftar" className="text-sm font-black text-amber-700 hover:underline">Coba sekarang →</Link>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {testimonials.map((t) => (
                <div key={t.name} className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
                  <p className="text-sm text-gray-700 font-semibold leading-relaxed">“{t.quote}”</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black">
                      {String(t.name || "U").slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500 font-semibold">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {SHOW_FAQ ? (
        <section id="faq" className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black">FAQ</h2>
              <p className="text-gray-500 mt-2 text-sm sm:text-base">Pertanyaan yang sering ditanyakan.</p>
            </div>
            <Link to="/login" className="text-sm font-black text-amber-700 hover:underline">Login Admin →</Link>
          </div>

          <div className="mt-8 space-y-3">
            {faqs.map((f, idx) => {
              const open = openFaq === idx;
              return (
                <button
                  key={f.q}
                  type="button"
                  onClick={() => setOpenFaq(open ? -1 : idx)}
                  className="w-full text-left rounded-3xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-black text-gray-900">{f.q}</p>
                    <span className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-xl border text-xs font-black ${open ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
                      {open ? "-" : "+"}
                    </span>
                  </div>
                  {open ? (
                    <p className="mt-3 text-sm text-gray-500 font-semibold leading-relaxed">{f.a}</p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section id="fitur" className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black">Fitur Utama</h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">Semua yang kamu butuhkan untuk operasional cafe.</p>
          </div>
          <Link to="/daftar" className="text-sm font-black text-amber-700 hover:underline">Mulai gratis setup →</Link>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all">
              <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow mb-4`}>
                {f.icon}
              </div>
              <p className="font-black text-gray-900">{f.title}</p>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="cara-kerja" className="bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl sm:text-3xl font-black">Cara Kerja</h2>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">Mulai dalam beberapa langkah sederhana.</p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((s, idx) => (
              <div key={s.title} className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                    {s.icon}
                  </div>
                  <span className="text-xs font-black text-gray-400">0{idx + 1}</span>
                </div>
                <p className="mt-4 font-black text-gray-900">{s.title}</p>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="paket" className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black">Paket Langganan</h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">Pilih paket sesuai kebutuhan cafe kamu.</p>
          </div>
          <Link to="/login" className="text-sm font-black text-amber-700 hover:underline">Sudah punya akun? Login →</Link>
        </div>

        {plansLoading ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-3xl border border-gray-100 p-6 bg-white shadow-sm">
                <div className="h-4 w-28 bg-gray-100 rounded mb-2" />
                <div className="h-3 w-40 bg-gray-100 rounded" />
                <div className="mt-5 space-y-2">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="h-3 w-full bg-gray-100 rounded" />
                  ))}
                </div>
                <div className="mt-6 h-11 w-full bg-gray-100 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : plansError ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm font-black text-red-700">Gagal memuat paket</p>
            <p className="text-xs text-red-600 mt-1 font-semibold">{plansError}</p>
          </div>
        ) : activePlans.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-gray-200 bg-gray-50 p-5 text-center">
            <p className="text-sm font-black text-gray-700">Paket belum tersedia</p>
            <p className="text-xs text-gray-500 mt-1 font-semibold">Silakan cek lagi nanti.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {activePlans.map((p) => {
              const highlight = String(p.id) === String(highlightPlanId);
              const points = planFeaturePoints(p);
              const d = getDurationInfo(p);

              return (
                <div
                  key={p.id ?? p.name}
                  className={`rounded-3xl border p-6 shadow-sm bg-white ${highlight ? "border-amber-300 shadow-[0_18px_70px_rgba(245,158,11,0.16)]" : "border-gray-100"}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-black text-gray-900">{p.name ?? "-"}</p>
                      <p className="text-xs text-gray-500 mt-1 font-semibold">
                        {formatRupiah(p.price ?? 0)} · {d.value} {d.unit === "minute" ? "menit" : "hari"}
                      </p>
                    </div>
                    {highlight ? (
                      <span className="text-[10px] font-black px-2 py-1 rounded-full bg-amber-100 text-amber-700">Rekomendasi</span>
                    ) : null}
                  </div>
                  <ul className="mt-5 space-y-2">
                    {points.length === 0 ? (
                      <li className="text-sm text-gray-500 font-semibold">Fitur akan mengikuti paket</li>
                    ) : (
                      points.slice(0, 6).map((pt) => (
                        <li key={pt} className="flex items-start gap-2 text-sm text-gray-700 font-semibold">
                          <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                          {pt}
                        </li>
                      ))
                    )}
                  </ul>
                  <Link
                    to="/daftar"
                    className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-black transition-all ${highlight ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow hover:shadow-md" : "border-2 border-gray-200 text-gray-800 hover:bg-gray-50"}`}
                  >
                    Pilih {p.name ?? "Paket"} <ArrowRight size={18} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="rounded-[32px] bg-gradient-to-r from-amber-500 to-orange-500 p-8 sm:p-10 text-white shadow-2xl">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div>
                <p className="text-xs font-black text-white/90">Siap tingkatkan operasional cafe?</p>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black">Mulai pakai MyCafe hari ini.</h3>
                <p className="mt-2 text-sm text-white/90 font-semibold">Buat akun, atur menu, dan mulai terima pesanan.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Link
                  to="/daftar"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-gray-900 font-black hover:opacity-95 transition-all"
                >
                  Daftar Sekarang <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/40 px-6 py-3 text-white font-black hover:bg-white/10 transition-all"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
            <p className="font-semibold">© {new Date().getFullYear()} MyCafe</p>
            <div className="flex items-center gap-3">
              <span className="font-semibold">Build untuk cafe modern</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
