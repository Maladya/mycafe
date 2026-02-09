import SideBar from "../../Layout/Layouts";
export default function TambahMenu() {
  return (
    <div className="dashboard h-screen">
      <div className="flex min-h-screen">
        <SideBar />
        <div className="w-1/1 sm:hidden md:block bg-gray-200 items-center justify-content-center">
          <div className=" w-full h-10 bg-white"></div>
          <div>
            <h1 className="ms-15 mt-7 text-sm">
              {" "}
              ADMIN/ MANAGE MENU/TAMBAH MENU
            </h1>
            <h3 className="ms-15 mt-1 text-5xl">Tambah Menu</h3>
          </div>
          <div className="flex">
            <table className="table w-1/2 ms-10 mt-10 bg-white">
              <tbody className="bg-white">
                <h1 className="text-3xl mt-5 mb-5 ms-10">Informasi Menu</h1>
                <div className="flex flex-col">
                  <div className="flex items-end gap-5 ms-10 mt-5">
                    {/* Nama Menu */}
                    <div className="flex flex-col w-2/4 ms-5">
                      <h2 className="text-xl">Nama Menu</h2>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="Masukan Nama Menu"
                      />
                    </div>
                    {/* Kode Menu */}
                    <div className="flex flex-col w-1/4">
                      <h2 className="text-xl">Kode Menu</h2>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="Kode"
                      />
                    </div>
                  </div>
                </div>
                <h1 className="mt-5 ms-15 text-xl">Kategori Menu</h1>
                <input
                  type="text"
                  className="input ms-15 w-3/4"
                  placeholder="Masukan Kategori"
                />
                <h1 className="mt-5 ms-15 text-xl">Deskripsi</h1>
                <textarea
                  type="textarea"
                  className="input ms-15 w-3/4"
                  placeholder="Deskripsikan menu anda."
                />
                <h1 className="mt-5 ms-15 text-xl">Harga</h1>
                <input
                  type="text"
                  className="input ms-15 mb-10 w-3/4"
                  placeholder="Masukan Harga"
                />
              </tbody>
            </table>
            <table className="table w-1/2 ms-10 me-10 mt-10 bg-white">
              <tbody className="bg-white">
                <h1 className="text-3xl mt-5 mb-5 ms-10">Gambar</h1>
              </tbody>
            </table>
          </div>
          <div className="flex">
            <button>
              <div
                className="btn bg-white border border-black text-black mt-20 ms-20 mb-10"
                onClick={() => (window.location.href = "/admin/menu/menu")}
              >
                Kembali
              </div>
            </button>
            <button>
              <div className="btn bg-white border border-primary text-primary mt-20 ms-170 mb-10">
                Simpan
              </div>
            </button>
            <button>
              <div className="btn bg-white border border-red-500 text-red-500 mt-20 ms-10 mb-10">
                Riset
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
