import SideBar from "../../Layout/Layouts";
export default function TambahPayment() {
  return (
    <div className="dashboard h-screen">
      <div className="flex min-h-screen">
        <SideBar />
        <div className="w-1/1 sm:hidden md:block bg-gray-200 items-center justify-content-center">
          <div className=" w-full h-10 bg-white"></div>
          <div>
            <h1 className="ms-15 mt-7 text-sm">
              {" "}
              ADMIN/ MANAGE PAYMENT/TAMBAH PAYMENT
            </h1>
            <h3 className="ms-15 mt-1 text-5xl">Tambah Payment</h3>
          </div>
          <div className="flex">
            <table className="table w-1/2 ms-10 mt-10 bg-white">
              <tbody className="bg-white">
                <h1 className="text-3xl mt-5 mb-5 ms-10">
                  Informasi Pembayaran
                </h1>
                <div className="flex flex-col">
                  <div className="flex items-end gap-5 ms-10 mt-5 mb-10">
                    {/* ID Transaksi */}
                    <div className="flex flex-col w-2/4 ms-5 ">
                      <h2 className="text-xl">ID Transaksi</h2>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="Masukan ID Transaksi"
                      />
                    </div>
                    {/* Status Pembayaran */}
                    <div className="flex flex-col w-1/4">
                      <h2 className="text-xl">Status</h2>
                      <select className="select w-full">
                        <option>Berhasil</option>
                        <option>Pending</option>
                        <option>Gagal</option>
                      </select>
                    </div>
                  </div>
                </div>
              </tbody>
            </table>
          </div>
          <div className="flex">
            <button>
              <div
                className="btn bg-white border border-black text-black mt-45 ms-20 mb-10"
                onClick={() =>
                  (window.location.href = "/admin/payment/payment")
                }
              >
                Kembali
              </div>
            </button>
            <button>
              <div className="btn bg-white border border-primary text-primary mt-45 ms-170 mb-10">
                Simpan
              </div>
            </button>
            <button>
              <div className="btn bg-white border border-red-500 text-red-500 mt-45 ms-10 mb-10">
                Riset
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
