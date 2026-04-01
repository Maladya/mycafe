import { CheckCircle, XCircle, Info, AlertCircle } from "lucide-react";

export default function Toast({ msg, type = "info", onDone }) {
  const icons = {
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    info: <Info size={18} />,
    warning: <AlertCircle size={18} />,
  };

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-amber-500",
  };

  return (
    <div className={`fixed top-20 right-4 z-50 ${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slideInRight max-w-md`}>
      {icons[type]}
      <span className="font-semibold text-sm">{msg}</span>
    </div>
  );
}
