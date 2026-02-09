import { NavLink } from "react-router-dom";

export default function SideBar() {
  return (
    <div className="min-h-screen flex">
      {/* ===== SIDEBAR ===== */}
      <nav className="w-64 bg-white border-r p-4 flex flex-col gap-2 text-sm">
        <h1 className="text-center font-bold mb-4">Admin Panel</h1>
        <div className="flex p-2 w-full items-center my-5">
          <img
            className="w-9 rounded-4xl "
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDMgKRG2DbqpXvwrc1CHCqHWoG2P1IoUysPA&s"
            alt=""
          />
          <div className="flex flex-col ms-2">
            <h1 className="">Admin</h1>
            <h1 className="">mahesa@gmail.com</h1>
          </div>
        </div>
        {[
          ["Dashboard", "/admin/dashboard", "dashboard"],
          ["Menu", "/admin/menu/menu", "restaurant-menu"],
          ["Table", "/admin/table/table", "table"],
          ["Promo", "/admin/promo/promo", "discount"],
          ["Payment", "/admin/payment/payment", "online-payment-"],
          ["Billing", "/admin/billing/billing", "bill"],
          ["Setting", "/admin/setting/setting", "settings"],
        ].map(([label, path, icon]) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded mb-3
              ${
                isActive
                  ? "bg-blue-500 text-white"
                  : "hover:bg-blue-100 hover:text-blue-600"
              }`
            }
          >
            <img
              src={`https://img.icons8.com/ios-filled/50/000000/${icon}.png`}
              className="w-5 h-5"
            />
            {label}
          </NavLink>
        ))}
        <div
          className="flex ms-7 p-2 h-10 items-center mt-5 "
          onClick={() => (window.location.href = "/")}
        >
          <button className="btn btn- sm:btn-sm md:btn-md lg:btn-lg xl:btn-md me-10 border-black bg-white text-black flex items-center hover:bg-gray-200 rounded ">
            {" "}
            <img
              className="w-5  ms-2 "
              src="https://img.icons8.com/?size=100&id=2445&format=png&color=000000"
              alt=""
            />
            <div className="flex ms-1 ">
              <h1 className="">Keluar</h1>
            </div>
          </button>
        </div>
      </nav>

      <div className="flex-1 bg-gray-100 flex flex-col">
        <div className="h-12 bg-blue-400 sticky top-0 z-10" />
        <div className="flex-1 overflow-auto"></div>
      </div>
    </div>
  );
}
