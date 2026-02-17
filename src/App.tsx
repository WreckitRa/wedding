import { lazy, Suspense } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import LandingPage from "./pages/LandingPage";

const EventPage = lazy(() => import("./pages/EventPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminEventPage = lazy(() => import("./pages/AdminEventPage"));
const AdminEarlyAccess = lazy(() => import("./pages/AdminEarlyAccess"));

function AdminGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("admin_token");
  if (!token) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse text-slate-500 font-medium">Loading…</div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL || "/"}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/events"
            element={
              <AdminGuard>
                <AdminDashboard />
              </AdminGuard>
            }
          />
          <Route
            path="/admin/early-access"
            element={
              <AdminGuard>
                <AdminEarlyAccess />
              </AdminGuard>
            }
          />
          <Route
            path="/admin/events/:eventSlug"
            element={
              <AdminGuard>
                <AdminEventPage />
              </AdminGuard>
            }
          />
          <Route path="/e/:eventSlug" element={<EventPage />} />
          <Route path="/e/:eventSlug/invite/:token" element={<EventPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
