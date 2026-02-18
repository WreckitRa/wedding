import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, LogOut, Calendar, ChevronRight, Mail, Menu, X } from "lucide-react";
import { getAdminUser, logout } from "../../api/client";

interface AdminLayoutProps {
  children: React.ReactNode;
  /** Optional page title (e.g. event name on event page) */
  title?: string;
  /** Breadcrumb segments: [{ label, to? }, ...] */
  breadcrumb?: { label: string; to?: string }[];
}

function SidebarContent({
  isEventsList,
  isEarlyAccess,
  onNavClick,
}: {
  isEventsList: boolean;
  isEarlyAccess: boolean;
  onNavClick?: () => void;
}) {
  const location = useLocation();
  const user = getAdminUser();

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
      active ? "bg-slate-700/80 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <>
      <div className="p-4 md:p-6 border-b border-slate-700/50">
        <Link
          to="/admin/events"
          onClick={onNavClick}
          className="flex items-center gap-2 font-semibold text-lg tracking-tight"
        >
          <span className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </span>
          Guestlist
        </Link>
      </div>
      <nav className="p-3 flex-1">
        <Link
          to="/admin/events"
          onClick={onNavClick}
          className={linkClass(isEventsList && !location.pathname.split("/").filter(Boolean).slice(2).length)}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          Events
        </Link>
        <Link
          to="/admin/early-access"
          onClick={onNavClick}
          className={linkClass(isEarlyAccess)}
          title="Signups from the landing page"
        >
          <Mail className="w-4 h-4 shrink-0" />
          Sign up access
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
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors min-h-[44px]"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </>
  );
}

export default function AdminLayout({ children, title, breadcrumb }: AdminLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isEventsList = location.pathname === "/admin/events" || location.pathname === "/admin/events/";
  const isEarlyAccess = location.pathname === "/admin/early-access";

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-portal min-h-screen bg-slate-50 flex">
      {/* Mobile overlay when sidebar open */}
      <div
        className="fixed inset-0 bg-slate-900/60 z-40 md:hidden"
        aria-hidden={!sidebarOpen}
        style={{ opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? "auto" : "none" }}
        onClick={closeSidebar}
      />

      {/* Sidebar: drawer on mobile, static on md+ */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col shrink-0 transform transition-transform duration-200 ease-out md:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 md:hidden shrink-0">
          <span className="font-semibold text-lg">Menu</span>
          <button
            type="button"
            onClick={closeSidebar}
            className="p-2 -m-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <SidebarContent
            isEventsList={isEventsList}
            isEarlyAccess={isEarlyAccess}
            onNavClick={closeSidebar}
          />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            {breadcrumb && breadcrumb.length > 0 ? (
              <nav className="flex items-center gap-2 text-sm text-slate-500 mb-1 flex-wrap">
                {breadcrumb.map((b, i) => (
                  <span key={i} className="flex items-center gap-2">
                    {i > 0 && <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                    {b.to ? (
                      <Link to={b.to} className="hover:text-slate-900 transition-colors truncate">
                        {b.label}
                      </Link>
                    ) : (
                      <span className="text-slate-900 font-medium truncate">{b.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            ) : null}
            {title && (
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight truncate">
                {title}
              </h1>
            )}
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
