import SideBar from "../../Layout/Layouts";
export default function TambahTable() {
  return (
    <div className="dashboard h-screen">
      <div className="flex min-h-screen">
        <SideBar />
        <div className="w-1/1 sm:hidden md:block bg-gray-200 items-center justify-content-center">
          <div className=" w-full h-10 bg-white"></div>
          <div>
            <h1 className="ms-15 mt-7 text-sm">
              {" "}
              ADMIN/ MANAGE TABLE/TAMBAH TABLE
            </h1>
            <h3 className="ms-15 mt-1 text-5xl">Tambah Table</h3>
          </div>
          <div className="flex">
            <table className="table w-1/2 ms-10 mt-10 bg-white rounded-lg shadow-md">
              <tbody className="bg-white">
                <div className="flex flex-col">
                  <div className="flex items-end gap-5 ms-10 mt-10 mb-20">
                    {/* Nomor Meja */}
                    <div className="flex flex-col w-2/4 ms-5">
                      <h2 className="text-xl mb-2">Nomor Meja</h2>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="Masukan Nomor Meja"
                      />
                    </div>
                  </div>
                </div>
              </tbody>
            </table>
          </div>
          <div className="flex">
            <button>
              <div
                className="btn bg-white border border-black text-black mt-50 ms-20 "
                onClick={() => (window.location.href = "/admin/table/table")}
              >
                Kembali
              </div>
            </button>
            <button>
              <div className="btn bg-white border border-primary text-primary mt-50 ms-170">
                Simpan
              </div>
            </button>
            <button>
              <div className="btn bg-white border border-red-500 text-red-500 mt-50 ms-10">
                Riset
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
