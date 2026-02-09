import SideBar from "../../Layout/Layouts";
export default function Menu() {
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
              <h1 className="text-sm text-gray-600">Admin/Manage Menu/Edit Menu</h1>
              <h3 className="text-3xl font-bold mt-2">MENU</h3>
            </div>

            {/* konten*/}
            <div className="flex row-auto">
              <label className="input mt-15 ms-20 flex items-center">
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
              <div className="flex flex-col gap-4 ">
                <div
                  className="btn btn-primary  ms-103 me-10"
                  onClick={() =>
                    (window.location.href = "/admin/menu/tambahmenu")
                  }
                >
                  Tambah Menu
                </div>
                <div className="dropdown ms-95 ">
                  <div tabIndex={0} role="button" className="btn  w-50">
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
            <div className=" mt-3 me-20 ms-10 mb-10">
              <table className="table ms-10 bg-white">
                {/* head */}
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Kategori</th>
                    <th>Nama Menu</th>
                    <th>Harga</th>
                    <th>Deskripsi</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {/* row 1 */}
                  <tr className="hover:bg-base-300">
                    <td>
                      <div className="flex items-center">
                        <div className="avatar">
                          <div className="mask mask-squircle h-12 w-12">
                            <img
                              src="https://img.daisyui.com/images/profile/demo/2@94.webp"
                              alt="Kopi Americano"
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>Minuman</td>
                    <td>Kopi Americano</td>
                    <td>Rp 35.000</td>
                    <td>Kopi hitam premium dengan rasa yang kuat</td>
                    <td className="flex gap-2">
                      <img
                        width="20"
                        height="20"
                        src="https://img.icons8.com/external-neu-royyan-wijaya/32/external-eyes-neu-interface-neu-royyan-wijaya.png"
                        alt="view"
                        className="cursor-pointer"
                        onClick={() =>
                          (window.location.href = "/admin/menu/detailmenu")
                        }
                      />
                      <img
                        width="20"
                        height="20"
                        src="https://img.icons8.com/forma-regular-filled/24/pencil-tip.png"
                        alt="edit"
                        className="cursor-pointer"
                        onClick={() =>
                          (window.location.href = "/admin/menu/editmenu")
                        }
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
                    <td>
                      <div className="flex items-center">
                        <div className="avatar">
                          <div className="mask mask-squircle h-12 w-12">
                            <img
                              src="https://img.daisyui.com/images/profile/demo/3@94.webp"
                              alt="Nasi Goreng"
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>Makanan</td>
                    <td>Nasi Goreng Spesial</td>
                    <td>Rp 55.000</td>
                    <td>Nasi goreng dengan telur dan sayuran pilihan</td>
                    <td className="flex gap-2">
                      <img
                        width="20"
                        height="20"
                        src="https://img.icons8.com/external-neu-royyan-wijaya/32/external-eyes-neu-interface-neu-royyan-wijaya.png"
                        alt="view"
                        className="cursor-pointer"
                        onClick={() =>
                          (window.location.href = "/admin/menu/detailmenu")
                        }
                      />
                      <img
                        width="20"
                        height="20"
                        src="https://img.icons8.com/forma-regular-filled/24/pencil-tip.png"
                        alt="edit"
                        className="cursor-pointer"
                        onClick={() =>
                          (window.location.href = "/admin/menu/editmenu")
                        }
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
                    <td>
                      <div className="flex items-center">
                        <div className="avatar">
                          <div className="mask mask-squircle h-12 w-12">
                            <img
                              src="https://img.daisyui.com/images/profile/demo/4@94.webp"
                              alt="Es Teh Manis"
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>Minuman</td>
                    <td>Es Teh Manis</td>
                    <td>Rp 15.000</td>
                    <td>Teh segar dengan es dan gula yang pas</td>
                    <td className="flex gap-2">
                      <img
                        width="20"
                        height="20"
                        src="https://img.icons8.com/external-neu-royyan-wijaya/32/external-eyes-neu-interface-neu-royyan-wijaya.png"
                        alt="view"
                        className="cursor-pointer"
                        onClick={() =>
                          (window.location.href = "/admin/menu/detailmenu")
                        }
                      />
                      <img
                        width="20"
                        height="20"
                        src="https://img.icons8.com/forma-regular-filled/24/pencil-tip.png"
                        alt="edit"
                        className="cursor-pointer"
                        onClick={() =>
                          (window.location.href = "/admin/menu/editmenu")
                        }
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
                  {/* row 4 */}
                  <tr className="hover:bg-base-300">
                    <td>
                      <div className="flex items-center">
                        <div className="avatar">
                          <div className="mask mask-squircle h-12 w-12">
                            <img
                              src="https://img.daisyui.com/images/profile/demo/5@94.webp"
                              alt="Mie Ayam"
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>Makanan</td>
                    <td>Mie Ayam Kuah</td>
                    <td>Rp 45.000</td>
                    <td>Mie dengan potongan daging ayam dan kuah lezat</td>
                    <td className="flex gap-2">
                      <img
                        width="20"
                        height="20"
                        src="https://img.icons8.com/external-neu-royyan-wijaya/32/external-eyes-neu-interface-neu-royyan-wijaya.png"
                        alt="view"
                        className="cursor-pointer"
                        onClick={() =>
                          (window.location.href = "/admin/menu/detailmenu")
                        }
                      />
                      <img
                        width="20"
                        height="20"
                        src="https://img.icons8.com/forma-regular-filled/24/pencil-tip.png"
                        alt="edit"
                        className="cursor-pointer"
                        onClick={() =>
                          (window.location.href = "/admin/menu/editmenu")
                        }
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
                    <td colSpan="6">
                      <div className="flex justify-center py-2">
                        <div className="join">
                          <button className="join-item btn">«</button>
                          <button className="join-item btn btn-active">
                            1
                          </button>
                          <button className="join-item btn">2</button>
                          <button className="join-item btn">3</button>
                          <button className="join-item btn">»</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
                {/* foot */}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
