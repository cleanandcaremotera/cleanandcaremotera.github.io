import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import BottomNav from "./components/BottomNav.jsx";
import FloatingActions from "./components/FloatingActions.jsx";
import Footer from "./components/Footer.jsx";
import Navbar from "./components/Navbar.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { CompanyProvider } from "./context/CompanyContext.jsx";
import About from "./pages/About.jsx";
import Admin from "./pages/Admin.jsx";
import Cart from "./pages/Cart.jsx";
import Contact from "./pages/Contact.jsx";
import Feedback from "./pages/Feedback.jsx";
import Home from "./pages/Home.jsx";
import Offers from "./pages/Offers.jsx";
import Pricing from "./pages/Pricing.jsx";
import Services from "./pages/Services.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Hidden on /admin (not customer-facing) and /contact (its own destination,
// which already shows both forms on the page).
const HIDE_FAB_ON = ["/admin", "/contact"];
function GlobalFloatingActions() {
  const { pathname } = useLocation();
  if (HIDE_FAB_ON.includes(pathname)) return null;
  return <FloatingActions />;
}

export default function App() {
  return (
    <CompanyProvider>
      <CartProvider>
        <ScrollToTop />
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
        {/* Clearance for the fixed bottom nav so it doesn't cover footer content.
            Matches BottomNav's own height (~56px content + the iOS home-indicator
            safe area), not a flat value — notched iPhones need more than 64px. */}
        <div className="lg:hidden" style={{ height: "calc(3.5rem + env(safe-area-inset-bottom))" }} />
        <BottomNav />
        <GlobalFloatingActions />
      </CartProvider>
    </CompanyProvider>
  );
}
