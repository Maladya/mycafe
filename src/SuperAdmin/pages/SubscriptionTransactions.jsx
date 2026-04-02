import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import DataTable from "../components/DataTable";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.5:3000";

function formatRupiah(num) {
  if (num == null) return "-";
  return `Rp${Number(num).toLocaleString("id-ID")}`;
}

function toYmd(d) {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
}

export default function SubscriptionTransactions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [cafeId, setCafeId] = useState("");
  const [planId, setPlanId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("superadmin_token") || ""}`,
  });

  const fetchTransactions = async (opts = {}) => {
    const nextPage = opts.page ?? page;
    const nextLimit = opts.limit ?? limit;

    setLoading(true);
    setError("");

    try {
      const qs = new URLSearchParams();
      qs.set("page", String(nextPage));
      qs.set("limit", String(nextLimit));
      if (q.trim()) qs.set("q", q.trim());
      if (status) qs.set("status", status);
      if (cafeId) qs.set("cafe_id", cafeId);
      if (planId) qs.set("plan_id", planId);
      if (dateFrom) qs.set("date_from", dateFrom);
      if (dateTo) qs.set("date_to", dateTo);

      const res = await fetch(`${API_URL}/api/subscriptions/superadmin/transactions?${qs.toString()}`, {
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      const payload = data?.data ?? data;
      const list = payload?.rows ?? payload?.data ?? payload?.transactions ?? [];

      setRows(Array.isArray(list) ? list : []);
      setPage(Number(payload?.page ?? nextPage) || 1);
      setLimit(Number(payload?.limit ?? nextLimit) || 20);
      setTotal(Number(payload?.total ?? 0) || 0);
      setTotalPages(Number(payload?.total_pages ?? payload?.totalPages ?? 1) || 1);
    } catch (e) {
      setRows([]);
      setTotal(0);
      setTotalPages(1);
      setError(e?.message || "Gagal memuat transaksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(
    () => [
      {
        header: "Order",
        accessor: "order_id",
        render: (val, row) => (
          <div>
            <p className="font-bold text-gray-900">{val || row.orderId || "-"}</p>
            <p className="text-[11px] text-gray-400">ID: {row.id ?? "-"}</p>
          </div>
        ),
      },
      {
        header: "Cafe",
        accessor: "nama_cafe",
        render: (val, row) => (
          <div>
            <p className="font-bold text-gray-900">{val || row.cafe_name || row.namaCafe || "-"}</p>
            <p className="text-[11px] text-gray-400">cafe_id: {row.cafe_id ?? row.cafeId ?? "-"}</p>
          </div>
        ),
      },
      {
        header: "Paket",
        accessor: "plan_name",
        render: (val, row) => (
          <div>
            <p className="font-bold text-gray-900">{val || row.planName || "-"}</p>
            <p className="text-[11px] text-gray-400">{formatRupiah(row.plan_price ?? row.planPrice ?? row.expected_amount ?? row.expectedAmount)}</p>
          </div>
        ),
      },
      {
        header: "Status",
        accessor: "status",
        render: (val, row) => {
          const st = String(val || row.transaction_status || "").toLowerCase();
          const ok = st === "paid" || st === "settlement" || st === "capture";
          return (
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${ok ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {(val || row.transaction_status || "-").toString()}
            </span>
          );
        },
      },
      {
        header: "Waktu",
        accessor: "created_at",
        render: (val, row) => {
          const raw = val || row.createdAt || row.transaction_time || row.transactionTime;
          if (!raw) return "-";
          try {
            const d = new Date(raw);
            if (Number.isNaN(d.getTime())) return String(raw);
            return d.toLocaleString("id-ID");
          } catch {
            return String(raw);
          }
        },
      },
    ],
    []
  );

  const handleApplyFilter = () => {
    fetchTransactions({ page: 1 });
  };

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
            <CreditCard size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Transaksi Langganan</h2>
            <p className="text-sm text-gray-500 mt-1">Audit & rekap transaksi langganan cafe</p>
          </div>
        </div>
        <button
          onClick={() => fetchTransactions({ page })}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <p className="text-[11px] font-bold text-gray-500 mb-1">Cari Order ID</p>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500 transition-all"
                placeholder="SUB-..."
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-500 mb-1">Status</p>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500 transition-all"
            >
              <option value="">Semua</option>
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="failed">failed</option>
              <option value="expired">expired</option>
              <option value="canceled">canceled</option>
            </select>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-500 mb-1">cafe_id</p>
            <input
              value={cafeId}
              onChange={(e) => setCafeId(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500 transition-all"
              placeholder="27"
            />
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-500 mb-1">plan_id</p>
            <input
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500 transition-all"
              placeholder="2"
            />
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-500 mb-1">Limit</p>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value) || 20)}
              className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500 transition-all"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-3">
          <div className="md:col-span-2">
            <p className="text-[11px] font-bold text-gray-500 mb-1">Tanggal dari</p>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500 transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <p className="text-[11px] font-bold text-gray-500 mb-1">Tanggal sampai</p>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500 transition-all"
            />
          </div>
          <div className="md:col-span-2 flex items-end gap-2">
            <button
              onClick={handleApplyFilter}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-black shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
            >
              Terapkan Filter
            </button>
            <button
              onClick={() => {
                setQ("");
                setStatus("");
                setCafeId("");
                setPlanId("");
                setDateFrom("");
                setDateTo("");
                setLimit(20);
                setPage(1);
                fetchTransactions({ page: 1, limit: 20 });
              }}
              disabled={loading}
              className="px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-60"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500 font-semibold">
          Total: {total.toLocaleString("id-ID")} transaksi
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={rows}
        searchable={false}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 font-semibold">
          Halaman {page} / {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => canPrev && fetchTransactions({ page: page - 1 })}
            disabled={!canPrev || loading}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={18} className="text-gray-700" />
          </button>
          <button
            onClick={() => canNext && fetchTransactions({ page: page + 1 })}
            disabled={!canNext || loading}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={18} className="text-gray-700" />
          </button>
        </div>
      </div>

      <div className="hidden">
        {toYmd(new Date())}
      </div>
    </div>
  );
}
