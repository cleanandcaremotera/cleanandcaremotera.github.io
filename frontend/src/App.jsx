import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import BottomNav from "./components/BottomNav.jsx";
import FloatingActions from "./components/FloatingActions.jsx";
import Footer from "./components/Footer.jsx";
import Navbar from "./components/Navbar.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { CompanyProvider } from "./context/CompanyContext.jsx";
import { trackVisit } from "./lib/analytics.js";
import About from "./pages/About.jsx";
import Admin from "./pages/Admin.jsx";
import Cart from "./pages/Cart.jsx";
import Contact from "./pages/Contact.jsx";
import Feedback from "./pages/Feedback.jsx";
import Home from "./pages/Home.jsx";
import Offers from "./pages/Offers.jsx";
import Pricing from "./pages/Pricing.jsx";
import SchedulePickup from "./pages/SchedulePickup.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Hidden on /admin (not customer-facing), on each form's own destination
// page, and on /pricing (which shows its own cart-aware floating actions
// instead — see Pricing.jsx).
const HIDE_FAB_ON = ["/admin", "/contact", "/schedule-pickup", "/pricing"];
function GlobalFloatingActions() {
  const { pathname } = useLocation();
  if (HIDE_FAB_ON.includes(pathname)) return null;
  return <FloatingActions />;
}

// The admin dashboard is its own self-contained workspace (own header,
// own "View Site" link back out) — the customer-facing chrome around it
// would just be dead weight, not a real nav for an admin to use.
// Counts once per browser tab (sessionStorage guard) so SPA route changes
// within the same visit don't inflate the number — and never on /admin, so
// the business owner's own dashboard use isn't counted as a site visitor.
function VisitTracker() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;
    if (sessionStorage.getItem("cc_visit_counted")) return;
    sessionStorage.setItem("cc_visit_counted", "1");
    trackVisit();
  }, []);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname === "/admin";

  return (
    <CompanyProvider>
      <CartProvider>
        <ScrollToTop />
        <VisitTracker />
        {!isAdmin && <Navbar />}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/schedule-pickup" element={<SchedulePickup />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        {!isAdmin && <Footer />}
        {!isAdmin && (
          /* Clearance for the fixed bottom nav so it doesn't cover footer content.
             Matches BottomNav's own height (~56px content + the iOS home-indicator
             safe area), not a flat value — notched iPhones need more than 64px. */
          <div className="lg:hidden" style={{ height: "calc(3.5rem + env(safe-area-inset-bottom))" }} />
        )}
        {!isAdmin && <BottomNav />}
        <GlobalFloatingActions />
      </CartProvider>
    </CompanyProvider>
  );
}
