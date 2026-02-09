import SideBar from "../../Layout/Layouts";
export default function EditPromo() {
  return (
    <div className="dashboard h-screen">
      <div className="flex min-h-screen">
        <SideBar />
        <div className="w-1/1 sm:hidden md:block bg-gray-200 items-center justify-content-center">
          <div className=" w-full h-10 bg-white"></div>
          <div>
            <h1 className="ms-15 mt-7 text-sm">
              {" "}
              ADMIN/ MANAGE PROMO/EDIT PROMO
            </h1>
            <h3 className="ms-15 mt-1 text-5xl">EDIT Promo</h3>
          </div>
          <div className="flex">
            <table className="table w-1/2 ms-10 mt-10 bg-white mb-60">
              <tbody className="bg-white">
                <div className="flex flex-col">
                  <div className="flex items-end gap-5 ms-10 mt-5">
                    {/* Kode Promo */}
                    <div className="flex flex-col w-2/4 ms-5">
                      <h2 className="text-xl">Kode Promo</h2>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="Masukan Kode Promo"
                      />
                    </div>
                    {/* Status Promo */}
                    <div className="flex flex-col w-1/4">
                      <h2 className="text-xl">Status</h2>
                      <select className="select w-full">
                        <option>Aktif</option>
                        <option>Expired</option>
                      </select>
                    </div>
                  </div>
                </div>
                <h1 className="mt-5 ms-15 text-xl">Berlaku Sampai</h1>
                <input
                  type="text"
                  className="input ms-15 w-3/4"
                  placeholder="Masukan Tanggal Berlaku Sampai"
                />
              </tbody>
            </table>
            <table className="table w-1/2 ms-10 me-10 mt-10 bg-white">
              <tbody className="bg-white">
                <h1 className="mt-5 ms-15 text-xl">Berlaku Untuk Menu</h1>
                <label className="input input-bordered ms-15 w-3/4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 opacity-50 me-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="search"
                    placeholder="Cari menu atau ketik untuk memilih"
                    className="w-full border-0 focus:outline-none"
                  />
                </label>

                <h1 className="mt-5 ms-15 text-xl">Pilih Menu</h1>
                <input
                  type="number"
                  className="input ms-15 mb-10 w-3/4"
                  placeholder="Masukan Persentase Diskon"
                />
                 <h1 className="mt-5 ms-15 text-xl">Berlaku Sampai</h1>
                <input
                  type="text"
                  className="input ms-15 w-3/4"
                  placeholder="Masukan Tanggal Berlaku Sampai"
                />
                 <h1 className="mt-5 ms-15 text-xl">Berlaku Sampai</h1>
                <input
                  type="text"
                  className="input ms-15 w-3/4"
                  placeholder="Masukan Tanggal Berlaku Sampai"
                />
                 <h1 className="mt-5 ms-15 text-xl ">Berlaku Sampai</h1>
                <input
                  type="text"
                  className="input ms-15 w-3/4 mb-10"
                  placeholder="Masukan Tanggal Berlaku Sampai"
                />
              </tbody>
            </table>
          </div>
          <div className="flex">
            <button>
              <div
                className="btn bg-white border border-black text-black mt-20 ms-20 mb-10"
                onClick={() => (window.location.href = "/admin/promo/promo")}
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
