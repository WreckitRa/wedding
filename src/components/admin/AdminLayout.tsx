import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, LogOut, Calendar, ChevronRight, Mail } from "lucide-react";
import { getAdminUser, logout } from "../../api/client";

interface AdminLayoutProps {
  children: React.ReactNode;
  /** Optional page title (e.g. event name on event page) */
  title?: string;
  /** Breadcrumb segments: [{ label, to? }, ...] */
  breadcrumb?: { label: string; to?: string }[];
}

export default function AdminLayout({ children, title, breadcrumb }: AdminLayoutProps) {
  const location = useLocation();
  const user = getAdminUser();
  const isEventsList = location.pathname === "/admin/events" || location.pathname === "/admin/events/";
  const isEarlyAccess = location.pathname === "/admin/early-access";

  return (
    <div className="admin-portal min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-700/50">
          <Link to="/admin/events" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <span className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </span>
            Guestlist
          </Link>
        </div>
        <nav className="p-3 flex-1">
          <Link
            to="/admin/events"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isEventsList && !location.pathname.split("/").filter(Boolean).slice(2).length
                ? "bg-slate-700/80 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Events
          </Link>
          <Link
            to="/admin/early-access"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isEarlyAccess ? "bg-slate-700/80 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Mail className="w-4 h-4 shrink-0" />
            Early access
          </Link>
        </nav>
        <div className="p-3 border-t border-slate-700/50">
          <div className="px-3 py-2 text-xs text-slate-400 truncate" title={user?.email}>
            {user?.email ?? "—"}
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              window.location.href = "/admin";
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar: breadcrumb + optional title */}
        <header className="bg-white border-b border-slate-200 px-6 lg:px-8 py-4 shrink-0">
          {breadcrumb && breadcrumb.length > 0 ? (
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              {breadcrumb.map((b, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
                  {b.to ? (
                    <Link to={b.to} className="hover:text-slate-900 transition-colors">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-slate-900 font-medium">{b.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : null}
          {title && <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h1>}
        </header>

        <div className="flex-1 p-6 lg:p-8 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
