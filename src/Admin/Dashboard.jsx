import { useEffect, useRef } from "react";
import SideBar from "../Layout/Layouts";
import Chart from "chart.js/auto";

export default function Dashboard() {
  const chartRef1 = useRef(null);
  const chart1 = useRef(null);

  useEffect(() => {
    // Destroy previous charts if they exist
    if (chart1.current) {
      chart1.current.destroy();
    }

    // Bar Chart - Penjualan Harian
    if (chartRef1.current) {
      const ctx1 = chartRef1.current.getContext("2d");
      chart1.current = new Chart(ctx1, {
        type: "bar",
        data: {
          labels: [
            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jumat",
            "Sabtu",
            "Minggu",
          ],
          datasets: [
            {
              label: "Penjualan (Rp)",
              data: [
                1500000, 1800000, 1600000, 2100000, 2300000, 2500000, 2000000,
              ],
              backgroundColor: "#3b82f6",
              borderColor: "#1e40af",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return "Rp " + value.toLocaleString("id-ID");
                },
              },
            },
          },
        },
      });
    }

    return () => {
      if (chart1.current) chart1.current.destroy();
    };
  }, []);
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ===== SIDEBAR ===== */}
      <SideBar />
      <div className="flex-1 bg-gray-100 flex flex-col">
        <div className="h-12 bg-white sticky top-0 z-10 flex items-center justify-center border-b border-gray-200">
          <h1 className="text-lg font-bold text-primary">MyCafe ☕</h1>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {/* ===== KONTEN DASHBOARD ===== */}
          <div className="w-full">
            <div className="mb-4">
              <h1 className="text-sm text-gray-600">Admin/Beranda</h1>
              <h3 className="text-3xl font-bold mt-2">Dashboard</h3>
            </div>

            {/* Cards and Calendar Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Cards Grid */}
              <div className="lg:col-span-2 w-150 mt-2 ms-15 ">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="card bg-primary text-primary-content h-35">
                    <div className="card-body">
                      <h1 className="card-title text-sm">Jumlah Menu</h1>
                      <p className="text-2xl font-bold">10</p>
                    </div>
                  </div>
                  <div className="card bg-primary text-primary-content h-35">
                    <div className="card-body">
                      <h1 className="card-title text-sm">Total Transaksi</h1>
                      <p className="text-2xl font-bold">25</p>
                    </div>
                  </div>
                  <div className="card bg-primary text-primary-content h-35">
                    <div className="card-body">
                      <h1 className="card-title text-sm">Jumlah Meja</h1>
                      <p className="text-2xl font-bold">15</p>
                    </div>
                  </div>
                  <div className="card bg-primary text-primary-content h-35">
                    <div className="card-body">
                      <h1 className="card-title text-sm">Promo Aktif</h1>
                      <p className="text-2xl font-bold">5</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div className="card bg-white shadow-lg me-15 mt-2">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">Kalender</h2>
                  <div className="calendar bg-gray-50 p-4 rounded">
                    <div className="flex justify-between items-center mb-4">
                      <button className="btn btn-sm btn-ghost">«</button>
                      <span className="font-bold">Februari 2026</span>
                      <button className="btn btn-sm btn-ghost">»</button>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center text-sm">
                      <span className="font-bold">Min</span>
                      <span className="font-bold">Sen</span>
                      <span className="font-bold">Sel</span>
                      <span className="font-bold">Rab</span>
                      <span className="font-bold">Kam</span>
                      <span className="font-bold">Jum</span>
                      <span className="font-bold">Sab</span>
                      {[
                        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
                        17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
                      ].map((day) => (
                        <span
                          key={day}
                          className={`p-2 rounded ${day === 4 ? "bg-primary text-white font-bold" : "hover:bg-gray-200"} cursor-pointer`}
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 mb-6">
              {/* Bar Chart */}
              <div className="card bg-white shadow-lg">
                <div className="card-body">
                  <h3 className="card-title text-lg mb-4">
                    Penjualan Harian (7 Hari Terakhir)
                  </h3>
                  <div className="relative h-135 w-full">
                    <canvas ref={chartRef1}></canvas>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
