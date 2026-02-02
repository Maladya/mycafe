import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, Router, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import Daftar from "./Daftar.jsx";
import Dashboard from "./Admin/Dashboard.jsx";



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
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
