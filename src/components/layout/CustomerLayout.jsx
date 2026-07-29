import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CartToast } from "./CartToast";

export const CustomerLayout = () => (
  <div className="min-h-screen bg-slate-50">
    <Navbar />
    <main className="min-h-[70vh]">
      <Outlet />
    </main>
    <Footer />
    <CartToast />
  </div>
);
