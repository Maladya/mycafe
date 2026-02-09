import SideBar from "../../Layout/Layouts";
export default function DetailMenu() {
  return (
    <div className="dashboard h-screen">
      <div className="flex min-h-screen">
        <SideBar />
        <div className="w-1/1 sm:hidden md:block bg-gray-200 items-center justify-content-center">
          <div className="w-1/1 sm:hidden md:block bg-gray-100 min-h-screen p-8">
            <div className="mb-6">
              <h1 className="text-sm text-gray-600 mb-2">
                ADMIN / MANAGE MENU / DETAIL MENU
              </h1>
              <h3 className="text-5xl font-bold">Detail Menu</h3>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex gap-12">
                {/* Left Section - Image */}
                <div className="w-45 h-25 flex flex-col items-center mt-45 ms-50 mb-70">
                  <img
                    src="https://img.daisyui.com/images/profile/demo/2@94.webp"
                    alt="Menu Item"
                    className="w-80 h-80 object-cover rounded-full shadow-md mx-auto"
                  />
                </div>

                {/* Right Section - Information */}
                <div className="flex-1 ">
                  <div className="space-y-3  mt-48 ms-10 ">
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

                  <div className="flex justify-end mt-50">
                    <button
                      className="btn btn-outline me-3 "
                      onClick={() =>
                        (window.location.href = "/admin/menu/menu")
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
