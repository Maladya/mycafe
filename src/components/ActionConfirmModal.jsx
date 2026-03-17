import React from "react";

export default function ActionConfirmModal({
  open,
  icon,
  title = "Konfirmasi",
  message,
  cancelText = "Batal",
  confirmText = "Lanjutkan",
  confirmStyle,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fadeIn"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-[2rem] p-7 w-full max-w-sm text-center space-y-5 shadow-2xl animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center"
          style={{ background: "var(--bg-soft)" }}
        >
          <span className="text-5xl">{icon ?? "⚠️"}</span>
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900 mb-1">{title}</h3>
          {message && <p className="text-sm text-gray-500 leading-relaxed">{message}</p>}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border-2 border-gray-200 text-gray-700 rounded-2xl py-3.5 font-bold hover:bg-gray-50 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-2xl py-3.5 font-bold shadow-lg transition-all"
            style={confirmStyle ?? { background: "var(--grad)", color: "var(--on-p)" }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
