import { useState, useEffect, useRef } from "react";
import { Coffee, ChevronRight, QrCode, Printer, Download, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

export default function CetakQR() {
  const navigate = useNavigate();
  const { id } = useParams();
  const printRef = useRef();
  
  const [tableData, setTableData] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTableData();
  }, [id]);

  const fetchTableData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with your actual API
      const response = await fetch(
        `http://192.168.1.2:3000/tables/${id}/qr`,
        
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setTableData(data.data);
      
        setQrCodeUrl(data.data.qr_code_png);
      } else {
        toast.error("Gagal memuat data meja");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `QR-${tableData?.nomor || "table"}.png`;
    link.click();
    toast.success("QR Code berhasil didownload");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Memuat QR Code...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Screen View - Hidden saat print */}
      <div className="print:hidden min-h-screen bg-gray-50">
        {/* Top Bar */}
        <div className="h-14 bg-white sticky top-0 z-20 flex items-center justify-between px-8 border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 font-black text-lg tracking-tight text-blue-700">
            <Coffee className="w-5 h-5 text-blue-600" />
            <span>MyCafe</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span>Manage Table</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600 font-bold">Cetak QR Code</span>
          </div>
        </div>

        <div className="p-8">
          {/* Page Title */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">
              Manage Table
            </p>
            <h3 className="text-3xl font-extrabold tracking-tight text-gray-800">
              Cetak QR Code Meja
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Download atau cetak QR code untuk {tableData?.nomor_meja}
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Preview Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden mb-6">
              <div
                className="px-6 py-5 flex items-center justify-between"
                style={{
                  background: "linear-gradient(90deg,#eff6ff,#f0f9ff)",
                  borderBottom: "1px solid #e0e7ff",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(29,78,216,0.1)" }}
                  >
                    <QrCode className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-base font-bold text-gray-800">
                    Preview QR Code
                  </h2>
                </div>
                <button
                  onClick={() => navigate("/admin/table/table")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* QR Preview - Same as print version */}
              <div className="p-12 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full">
                  {/* Logo/Branding */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Coffee className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-800 mb-1">
                      MyCafe
                    </h1>
                    <p className="text-sm text-gray-500">
                      Scan untuk melihat menu
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="bg-white p-6 rounded-2xl border-4 border-blue-100 mb-6">
                    {qrCodeUrl && (
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="w-full h-auto"
                      />
                    )}
                  </div>

                  {/* Table Number */}
                  <div className="text-center space-y-2">
                    <div
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl"
                      style={{
                        background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                      }}
                    >
                      <span className="text-white text-sm font-semibold">
                        {tableData?.nomor_meja}
                      </span>
                     
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      Arahkan kamera ke QR code untuk order
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/admin/table/table")}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 transition-all border border-gray-200 hover:bg-gray-50"
                >
                  Kembali
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-emerald-600 transition-all border border-emerald-200 hover:bg-emerald-50"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md"
                  style={{
                    background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
                  }}
                >
                  <Printer className="w-4 h-4" />
                  Cetak QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print View - Only visible saat print */}
      <div className="hidden print:block" ref={printRef}>
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
        `}</style>
        
        <div className="w-full h-screen flex items-center justify-center p-8 bg-white">
          <div className="text-center">
            {/* Logo/Branding */}
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-black text-gray-800 mb-2">
                MyCafe
              </h1>
              <p className="text-lg text-gray-600">
                Scan QR Code untuk melihat menu
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-8 rounded-3xl border-8 border-blue-100 inline-block mb-8">
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  style={{ width: "400px", height: "400px" }}
                />
              )}
            </div>

            {/* Table Number */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600">
                <span className="text-white text-xl font-bold">
                  Nomor Meja
                </span>
                <span className="text-white text-5xl font-black">
                  {tableData?.nomor}
                </span>
              </div>
              <p className="text-gray-500 text-base">
                Arahkan kamera smartphone Anda ke QR code di atas
              </p>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t-2 border-gray-200">
              <p className="text-sm text-gray-400">
                Terima kasih telah berkunjung ke MyCafe
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
