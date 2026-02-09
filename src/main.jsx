import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, Router, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import Daftar from "./Daftar.jsx";
import Dashboard from "./Admin/Dashboard.jsx";
import Menu from "./Admin/Menu/Menu.jsx";
import TambahMenu from "./Admin/Menu/TambahMenu.jsx";
import EditMenu from "./Admin/Menu/EditMenu.jsx";
import DetailMenu from "./Admin/Menu/DetailMenu.jsx";
import TambahTable from "./Admin/Table/TambahTable.jsx";
import EditTable from "./Admin/Table/EditTable.jsx";
import LihatTable from "./Admin/Table/LihatTable.jsx";
import TambahPromo from "./Admin/Promo/TambahPromo.jsx";
import DetailPromo from "./Admin/Promo/DetailPromo.jsx";
import EditPromo from "./Admin/Promo/EditPromo.jsx";
import TambahPayment from "./Admin/Payment/TambahPayment.jsx";
import Table from "./Admin/Table/Table.jsx";
import Promo from "./Admin/Promo/Promo.jsx";
import Payment from "./Admin/Payment/Payment.jsx";
import EditPayment from "./Admin/Payment/EditPayment.jsx";
import Billing from "./Admin/Billing/Billing.jsx";
import Pembayaran from "./Admin/Billing/Pembayaran.jsx";
import Setting from "./Admin/Setting/Setting.jsx";
import MenuPage from "./User/Search.jsx";
import InfoOutlet from "./User/Outlet.jsx";
import ProfilePage from "./User/Dropdown.jsx";
import OrderHistory from "./User/OrderHistory.jsx";
import ReservationHistory from "./User/ReservationHistory.jsx";
import PesananUser from "./User/Pesanan.jsx";
import PembayaranUser from "./User/Pembayaran.jsx";
import RingkasanPesananUser from "./User/RingkasanPesanan.jsx";
import Home from "./User/Index.jsx";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/daftar",
    element: <Daftar />,
  },
  {
    path: "/admin/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/admin/menu/menu",
    element: <Menu />,
  },
  {
    path: "/admin/menu/tambahmenu",
    element: <TambahMenu />,
  },
  {
    path: "/admin/menu/editmenu",
    element: <EditMenu />,
  },
  {
    path: "/admin/menu/detailmenu",
    element: <DetailMenu />,
  },
  {
    path: "/admin/promo/detailpromo",
    element: <DetailPromo />,
  },
  {
    path: "/admin/promo/editpromo",
    element: <EditPromo />,
  },
  {
    path: "/admin/table/tambahtable",
    element: <TambahTable />,
  },
  {
    path: "/admin/promo/tambahpromo",
    element: <TambahPromo />,
  },
  {
    path: "/admin/payment/tambahpayment",
    element: <TambahPayment />,
  },
  {
    path: "/admin/payment/editpayment",
    element: <EditPayment />,
  },
  {
    path: "/admin/table/table",
    element: <Table />,
  },
  {
    path: "/admin/table/edittable",
    element: <EditTable />,
  },
  {
    path: "/admin/table/lihattable",
    element: <LihatTable />,
  },
  {
    path: "/admin/promo/promo",
    element: <Promo />,
  },
  {
    path: "/admin/payment/payment",
    element: <Payment />,
  },

  {
    path: "/admin/billing/billing",
    element: <Billing />,
  },
  {
    path: "/admin/billing/pembayaran",
    element: <Pembayaran />,
  },
  {
    path: "/admin/setting/setting",
    element: <Setting />,
  },
  {
    path: "/admin/tambahmenu",
  },
  {
    path: "/search",
    element: <MenuPage />,
  },
  {
    path: "/user/index",
    element: <Home />,
  },
  {
    path: "/outlet",
    element: <InfoOutlet />,
  },
  {
    path: "/dropdown",
    element: <ProfilePage />,
  },
  {
    path: "/orderhistory",
    element: <OrderHistory />,
  },
  {
    path: "/reservationhistory",
    element: <ReservationHistory />,
  },
  {
    path: "/pesanan",
    element: <PesananUser />,
  },
  {
    path: "/pembayaran",
    element: <PembayaranUser />,
  },
  {
    path: "/ringkasanpesanan",
    element: <RingkasanPesananUser />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
