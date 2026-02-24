import { useEffect, useRef, useState } from "react";
import SideBar from "../Layout/Layouts";
import Chart from "chart.js/auto";
import {
  UtensilsCrossed,
  ShoppingBag,
  Table2,
  Ticket,
  TrendingUp,
  Coffee,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";

const MONTH_NAMES = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];
const DAY_NAMES = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

function MiniCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-gray-700">{MONTH_NAMES[month]} {year}</span>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_NAMES.map(d => (
          <span key={d} className="text-xs font-bold py-1 text-blue-400">{d}</span>
        ))}
        {blanks.map((_, i) => <span key={`b${i}`} />)}
        {days.map(d => (
          <span
            key={d}
            className="text-xs py-1.5 rounded-lg cursor-pointer transition-all font-medium select-none"
            style={
              isToday(d)
                ? { background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", fontWeight: 800 }
                : { color: "#6b7280" }
            }
            onMouseEnter={e => { if (!isToday(d)) e.target.style.background = "#eff6ff"; }}
            onMouseLeave={e => { if (!isToday(d)) e.target.style.background = "transparent"; }}
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

const statCards = [
  {
    label: "Jumlah Menu",
    value: "10",
    icon: UtensilsCrossed,
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#bfdbfe",
    trend: "+2 bulan ini",
  },
  {
    label: "Total Transaksi",
    value: "25",
    icon: ShoppingBag,
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    trend: "+8 minggu ini",
  },
  {
    label: "Jumlah Meja",
    value: "15",
    icon: Table2,
    color: "#0284c7",
    bg: "#f0f9ff",
    border: "#bae6fd",
    trend: "Semua aktif",
  },
  {
    label: "Promo Aktif",
    value: "5",
    icon: Ticket,
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    trend: "3 segera habis",
  },
];

export default function Dashboard() {
  const chartRef1 = useRef(null);
  const chart1 = useRef(null);

  useEffect(() => {
    if (chart1.current) chart1.current.destroy();

    if (chartRef1.current) {
      const ctx1 = chartRef1.current.getContext("2d");

      const gradient = ctx1.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, "rgba(29,78,216,0.85)");
      gradient.addColorStop(1, "rgba(59,130,246,0.3)");

      chart1.current = new Chart(ctx1, {
        type: "bar",
        data: {
          labels: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"],
          datasets: [
            {
              label: "Penjualan (Rp)",
              data: [1500000, 1800000, 1600000, 2100000, 2300000, 2500000, 2000000],
              backgroundColor: gradient,
              borderColor: "#1d4ed8",
              borderWidth: 0,
              borderRadius: 10,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#1e3a8a",
              titleColor: "#bfdbfe",
              bodyColor: "#ffffff",
              borderColor: "#3b82f6",
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: (ctx) => " Rp " + ctx.raw.toLocaleString("id-ID"),
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#9ca3af", font: { size: 12, weight: "600" } },
              border: { display: false },
            },
            y: {
              beginAtZero: true,
              grid: { color: "#f3f4f6" },
              ticks: {
                color: "#9ca3af",
                font: { size: 11 },
                callback: (v) => "Rp " + (v / 1000000).toFixed(1) + "jt",
              },
              border: { display: false },
            },
          },
        },
      });
    }

    return () => { if (chart1.current) chart1.current.destroy(); };
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideBar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-14 bg-white sticky top-0 z-20 flex items-center justify-between px-8 border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 font-black text-lg tracking-tight text-blue-700">
            <Coffee className="w-5 h-5 text-blue-600" />
            <span>MyCafe</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Admin</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">Beranda</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {/* Page Title */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-blue-400">
              Selamat datang kembali 👋
            </p>
            <h3 className="text-3xl font-extrabold tracking-tight text-gray-800">Dashboard</h3>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map(({ label, value, icon: Icon, color, bg, border, trend }) => (
              <div
                key={label}
                className="rounded-2xl p-5 flex flex-col gap-4 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ border: `1px solid ${border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <span
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                    style={{ background: "#ecfdf5", color: "#059669" }}
                  >
                    <TrendingUp className="w-3 h-3" />
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-gray-800">{value}</p>
                  <p className="text-sm font-medium mt-0.5 text-gray-500">{label}</p>
                </div>
                <p className="text-xs text-gray-400">{trend}</p>
              </div>
            ))}
          </div>

          {/* Chart + Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-base text-gray-800">Penjualan Harian</h3>
                  <p className="text-xs mt-0.5 text-gray-400">7 hari terakhir</p>
                </div>
                <div
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: "#eff6ff", color: "#1d4ed8" }}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +12% vs minggu lalu
                </div>
              </div>
              <div className="relative" style={{ height: "260px" }}>
                <canvas ref={chartRef1} />
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50">
                  <span className="text-xs">📅</span>
                </div>
                <h3 className="font-bold text-sm text-gray-800">Kalender</h3>
              </div>
              <MiniCalendar />

              {/* Today */}
              <div
                className="mt-5 rounded-xl p-3 flex items-center gap-3"
                style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
                >
                  {new Date().getDate()}
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-600">Hari ini</p>
                  <p className="text-xs text-gray-400">
                    {new Date().toLocaleDateString("id-ID", {
                      weekday: "long",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
