import SideBar from "../../Layout/Layouts";
export default function DetailPromo() {
  return (
    <div className="dashboard h-screen">
      <div className="flex min-h-screen">
        <SideBar />
        <div className="w-1/1 sm:hidden md:block bg-gray-200 items-center justify-content-center">
          <div className="w-1/1 sm:hidden md:block bg-gray-100 min-h-screen p-8">
            <div className="mb-6">
              <h1 className="text-sm text-gray-600 mb-2">
                ADMIN / MANAGE PROMO / DETAIL Promo
              </h1>
              <h3 className="text-5xl font-bold">Detail Promo</h3>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 w-115 h-60">
              <div className="flex gap-12">

                {/* Right Section - Information */}
                <div className="flex-1 ">
                  <div className="space-y-3  ms- ">
                    <div className="flex flex-row">
                      <p className=" text-lg font-bold gap-100">
                        KATEGORI
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        :
                      </p>
                      <p className="text-lg"> &nbsp;&nbsp;&nbsp;&nbsp;Minuman</p>
                    </div>
                    <div className="flex flex-row">
                      <p className="text-lg font-bold ">
                        NAMA MENU&nbsp; :
                      </p>
                        <p className="text-lg"> &nbsp;&nbsp;&nbsp;&nbsp;Es Teh Manis</p>
                    </div>
                    <div className="flex flex-row">
                      <p className="text-lg font-bold ">
                        HARGA &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                      </p>
                      <p className="text-lg "> &nbsp;&nbsp;&nbsp;&nbsp;Rp. 15.000</p>
                    </div>
                    <div className="flex flex-row">
                      <p className="text-lg font-bold ">
                        DESKRIPSI &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:
                      </p>
                        <p className="text-lg"> &nbsp;&nbsp;&nbsp;&nbsp;Es Teh Manis Dingin Segar</p>
                    </div>
                  </div>

                  <div className="flex ms-220 mt-60">
                    <button
                      className="btn btn-outline me-3 "
                      onClick={() =>
                        (window.location.href = "/admin/promo/promo")
                      }
                    >
                      Kembali
                    </button>
                    <button className="btn btn-primary ms-3">Edit</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
