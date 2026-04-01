import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ title, value, icon, trend, trendValue, color = "purple" }) {
  const colorClasses = {
    purple: "from-purple-500 to-blue-500",
    green: "from-green-500 to-emerald-500",
    orange: "from-orange-500 to-amber-500",
    red: "from-red-500 to-pink-500",
    blue: "from-blue-500 to-cyan-500",
  };

  const bgColorClasses = {
    purple: "bg-purple-50",
    green: "bg-green-50",
    orange: "bg-orange-50",
    red: "bg-red-50",
    blue: "bg-blue-50",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${trend === "up" ? "bg-green-50" : "bg-red-50"}`}>
            {trend === "up" ? (
              <TrendingUp size={12} className="text-green-600" />
            ) : (
              <TrendingDown size={12} className="text-red-600" />
            )}
            <span className={`text-xs font-bold ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
              {trendValue}
            </span>
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
      </div>
    </div>
  );
}
