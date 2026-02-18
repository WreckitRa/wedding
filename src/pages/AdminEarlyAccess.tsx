import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { adminListEarlyAccess, getAdminUser } from "../api/client";
import AdminLayout from "../components/admin/AdminLayout";
import AdminEmptyState from "../components/admin/AdminEmptyState";
import { AdminTableSkeleton } from "../components/admin/AdminPageLoader";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Mail } from "lucide-react";

type Lead = {
  id: string;
  name: string;
  email: string;
  eventType: string | null;
  plan: string | null;
  city: string | null;
  createdAt: string;
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminEarlyAccess() {
  useDocumentTitle("Sign up access");
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getAdminUser()?.role !== "main_admin") {
      navigate("/admin/events", { replace: true });
    }
  }, [navigate]);

  const fetchLeads = useCallback(() => {
    adminListEarlyAccess()
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <AdminLayout title="Sign up access">
      <p className="text-sm text-slate-600 mb-6">
        Signups from the landing page &quot;Get early access&quot; and modal form. Reach out to them when you&apos;re ready.
      </p>

      {loading ? (
        <AdminTableSkeleton rows={8} />
      ) : leads.length === 0 ? (
        <AdminEmptyState
          icon={Mail}
          title="No signups yet"
          description="Sign-up leads will appear here when someone submits the form on the landing page."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Event type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">City</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Signed up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">{lead.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-slate-600 hover:text-slate-900 hover:underline"
                      >
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {lead.eventType || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {lead.plan || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {lead.city || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-sm">
                      {formatDate(lead.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
