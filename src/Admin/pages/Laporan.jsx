import { useState } from "react";
import { getCatColor } from "../data/constants";
import { useAdmin } from "../AdminPanel";

const periodRev = {
  hari:   [48000,62000,35000,78000,90000,54000,83000,67000,45000,72000,88000,95000],
  minggu: [285000,342000,198000,425000,380000,510000,467000],
  bulan:  [3200000,4100000,3800000,4500000,3900000,5200000],
};
const labels = {
  hari:   ["07","08","09","10","11","12","13","14","15","16","17","18"],
  minggu: ["Sen","Sel","Rab","Kam","Jum","Sab","Min"],
  bulan:  ["Jan","Feb","Mar","Apr","Mei","Jun"],
};

export default function Laporan() {
  const { orders, menuItems } = useAdmin();
  const [period, setPeriod]   = useState("hari");

  const totalRev = (orders ?? []).reduce((s, o) => s + (o.total ?? 0), 0);
  const avgOrder = (orders ?? []).length ? Math.round(totalRev / orders.length) : 0;
  const topCat   = Object.entries(
    (menuItems ?? []).reduce((acc, m) => { acc[m.category] = (acc[m.category] || 0) + (m.sold ?? 0); return acc; }, {})
  ).sort((a, b) => b[1] - a[1])[0];

  const topMenus = [...(menuItems ?? [])].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, 8);
  const maxSold  = Math.max(...topMenus.map(m => m.sold ?? 0), 1);

  const revData = periodRev[period];
  const maxRevD = Math.max(...revData);

  const kpiCards = [
    { label:"Total Pendapatan",  value:`Rp${totalRev.toLocaleString("id-ID")}`, sub:"hari ini",        icon:"💰", color:"bg-green-50 border-green-200" },
    { label:"Total Pesanan",     value:(orders ?? []).length,                    sub:"transaksi",       icon:"📋", color:"bg-blue-50 border-blue-200" },
    { label:"Rata-rata Order",   value:`Rp${avgOrder.toLocaleString("id-ID")}`,  sub:"per transaksi",   icon:"📊", color:"bg-amber-50 border-amber-200" },
    { label:"Kategori Terlaris", value:topCat?.[0] || "-",                       sub:`${topCat?.[1]||0} terjual`, icon:"🏆", color:"bg-purple-50 border-purple-200" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">Laporan</h1>
          <p className="text-gray-400 text-sm">Ringkasan performa bisnis</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {["hari","minggu","bulan"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${period===p?"bg-white shadow text-gray-900":"text-gray-500 hover:text-gray-700"}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((k, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${k.color}`}>
            <span className="text-2xl">{k.icon}</span>
            <p className="font-black text-gray-900 text-xl mt-2 leading-none">{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            <p className="text-[10px] text-gray-400">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">Grafik Pendapatan — Per {period.charAt(0).toUpperCase() + period.slice(1)}</h2>
        <div className="flex items-end gap-1.5 h-36">
          {revData.map((rev, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
              <div className="relative w-full">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-orange-400" style={{ height:`${(rev/maxRevD)*128}px` }}/>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">
                  Rp{rev.toLocaleString("id-ID")}
                </div>
              </div>
              <span className="text-[9px] text-gray-400">{labels[period][i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">Ranking Menu Terlaris</h2>
        {topMenus.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Belum ada data menu</p>
        ) : (
          <div className="space-y-3">
            {topMenus.map((item, i) => (
              <div key={item.id ?? i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-4 flex-shrink-0">{i + 1}</span>
                {item.image && <img src={item.image} alt={item.name} className="w-7 h-7 rounded-lg object-cover flex-shrink-0"/>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-900 truncate">{item.name ?? item.nama}</p>
                    <span className="text-xs font-bold text-gray-700 ml-2 flex-shrink-0">{item.sold ?? 0}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width:`${((item.sold ?? 0) / maxSold) * 100}%` }}/>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getCatColor(item.category)}`}>{item.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}