import SideBar from "../../Layout/Layouts";
export default function EditTable() {
  return (
    <div className="dashboard h-screen">
      <div className="flex min-h-screen">
        <SideBar />
        <div className="w-1/1 sm:hidden md:block bg-gray-200 items-center justify-content-center">
          <div className=" w-full h-10 bg-white"></div>
          <div>
            <h1 className="ms-15 mt-7 text-sm">
              {" "}
              ADMIN/ MANAGE TABLE/EDIT TABLE
            </h1>
            <h3 className="ms-15 mt-1 text-5xl">CETAK QR</h3>
          </div>
          <div className="flex">
            <table className="table w-1/3 ms-100 mt-20 bg-gray-500 rounded-lg shadow-md">
              <tbody className="bg-gray">
                  <div className="items-end gap-5 ms-10 mt-10 mb-20">
                    {/* QR */}
                    <h1 className="text-3xl ms-28 font-bold">Meja 1</h1>
                    <img
                      width="200"
                      height="200"
                      src="https://img.icons8.com/ios/50/qr-code--v1.png"
                      alt="qr-code--v1"
                      className="ms-13 mt-5 bg-white p-5 rounded-md"
                    />
                  </div>
              </tbody>
            </table>
          </div>
          <div className="flex">
            <button>
              <div
                className="btn bg-white border border-black text-black mt-20 mb-10 ms-40 "
                onClick={() => (window.location.href = "/admin/table/table")}
              >
                Kembali
              </div>
            </button>
            <button>
              <div className="btn bg-white border border-yellow-500 text-yellow-500 mt-20 ms-180">
                Cetak
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
