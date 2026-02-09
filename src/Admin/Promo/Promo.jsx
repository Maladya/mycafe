import SideBar from "../../Layout/Layouts";
export default function Promo() {
  return (
    <div className="flex min-h-screen bg-gray-100">
          {/* ===== SIDEBAR ===== */}
          <SideBar />
          <div className="flex-1 bg-gray-100 flex flex-col">
            <div className="h-12 bg-white sticky top-0 z-10 flex items-center justify-center border-b border-gray-200">
              <h1 className="text-lg font-bold text-primary">MyCafe ☕</h1>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {/* ===== KONTEN DASHBOARD ===== */}
              <div className="w-full">
                <div className="ms-9 mt-4 mb-4">
                  <h1 className="text-sm text-gray-600">Admin/Manage Promo/Edit Promo</h1>
                  <h3 className="text-3xl font-bold mt-2">PROMO</h3>
                </div>
                {/* konten*/}
                          <div className="flex row-auto">
            <label className="input mt-20 ms-20 flex items-center">
              <svg
                className="h-[1em] opacity-50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <g
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </g>
              </svg>
              <input type="search" required placeholder="Search" />
            </label>
            <div className="flex flex-col gap-4 items-start">
              <div
                className="btn btn-primary mt-5 ms-98 w-35 "
                onClick={() => (window.location.href = "/admin/promo/tambahpromo")}
              >
                Tambah
              </div>
              <div className="dropdown ms-89">
                <div tabIndex={0} role="button" className="btn m-1 w-50">
                  Filter
                </div>
                <ul
                  tabIndex="-1"
                  className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
                >
                  <li>
                    <a>Makanan</a>
                  </li>
                  <li>
                    <a>Minuman</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto mt-3 ms-10 me-10">
            <table className="table bg-white ">
              {/* head */}
              <thead>
                <tr>
                  <th>No</th>
                  <th>Kode Voucer</th>
                  <th>Status</th>
                  <th>Berlaku Untuk Menu</th>
                  <th>Berlaku Sampai</th>
                  <th>Diskon</th>
                  <th>Harga Awal</th>
                  <th>Harga Diskon</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {/* row 1 */}
                <tr className="hover:bg-base-300">
                  <td>1</td>
                  <td>PROMO001</td>
                  <td>
                    <span className="badge badge-success">Aktif</span>
                  </td>
                  <td>Makanan</td>
                  <td>2025-12-31</td>
                  <td>20%</td>
                  <td>Rp 50.000</td>
                  <td>Rp 40.000</td>
                  <td className="flex gap-2">
                    <img
                      width="20"
                      height="20"
                      src="https://img.icons8.com/external-neu-royyan-wijaya/32/external-eyes-neu-interface-neu-royyan-wijaya.png"
                      alt="view"
                      className="cursor-pointer"
                      onClick={() => (window.location.href = "/admin/promo/detailpromo")}
                    />
                    <img
                      width="20"
                      height="20"
                      src="https://img.icons8.com/forma-regular-filled/24/pencil-tip.png"
                      alt="edit"
                      className="cursor-pointer"
                      onClick={() => (window.location.href = "/admin/promo/editpromo")}
                    />
                    <img
                      width="20"
                      height="20"
                      src="https://img.icons8.com/ios-glyphs/30/trash--v1.png"
                      alt="delete"
                      className="cursor-pointer"
                    />
                  </td>
                </tr>
                {/* row 2 */}
                <tr className="hover:bg-base-300">
                  <td>2</td>
                  <td>PROMO002</td>
                  <td>
                    <span className="badge badge-success">Aktif</span>
                  </td>
                  <td>Minuman</td>
                  <td>2025-11-15</td>
                  <td>15%</td>
                  <td>Rp 35.000</td>
                  <td>Rp 29.750</td>
                  <td className="flex gap-2">
                    <img
                      width="20"
                      height="20"
                      src="https://img.icons8.com/external-neu-royyan-wijaya/32/external-eyes-neu-interface-neu-royyan-wijaya.png"
                      alt="view"
                      className="cursor-pointer"
                    />
                    <img
                      width="20"
                      height="20"
                      src="https://img.icons8.com/forma-regular-filled/24/pencil-tip.png"
                      alt="edit"
                      className="cursor-pointer"
                    />
                    <img
                      width="20"
                      height="20"
                      src="https://img.icons8.com/ios-glyphs/30/trash--v1.png"
                      alt="delete"
                      className="cursor-pointer"
                    />
                  </td>
                </tr>
                {/* row 3 */}
                <tr className="hover:bg-base-300">
                  <td>3</td>
                  <td>PROMO003</td>
                  <td>
                    <span className="badge badge-error">Expired</span>
                  </td>
                  <td>Makanan</td>
                  <td>2025-10-30</td>
                  <td>10%</td>
                  <td>Rp 75.000</td>
                  <td>Rp 67.500</td>
                  <td className="flex gap-2">
                    <img
                      width="20"
                      height="20"
                      src="https://img.icons8.com/external-neu-royyan-wijaya/32/external-eyes-neu-interface-neu-royyan-wijaya.png"
                      alt="view"
                      className="cursor-pointer"
                    />
                    <img
                      width="20"
                      height="20"
                      src="https://img.icons8.com/forma-regular-filled/24/pencil-tip.png"
                      alt="edit"
                      className="cursor-pointer"
                    />
                    <img
                      width="20"
                      height="20"
                      src="https://img.icons8.com/ios-glyphs/30/trash--v1.png"
                      alt="delete"
                      className="cursor-pointer"
                    />
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="9">
                    <div className="flex justify-center py-2">
                      <div className="join">
                        <button className="join-item btn">«</button>
                        <button className="join-item btn btn-active">1</button>
                        <button className="join-item btn">2</button>
                        <button className="join-item btn">3</button>
                        <button className="join-item btn">»</button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
              </div>
            </div>
          </div>
        </div>
  );
}


