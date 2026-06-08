import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Outlet } from "react-router-dom";

const RootLayout = () => {
  return (
    <div className="flex min-h-screen flex-col relative">
      <div className="aurora-bg" aria-hidden="true" />
      <Navbar />
      <div className="flex-1 z-10">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default RootLayout;
