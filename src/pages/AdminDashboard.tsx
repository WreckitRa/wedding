import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Calendar, Loader2, X, Eye, Pencil, Trash2 } from "lucide-react";
import { adminListEvents, adminCreateEvent, adminDeleteEvent, getAdminUser } from "../api/client";
import type { EventConfig } from "../types/event";
import EventConfigForm from "../components/admin/EventConfigForm";
import InvitationPreview from "../components/admin/InvitationPreview";
import AdminLayout from "../components/admin/AdminLayout";
import AdminEmptyState from "../components/admin/AdminEmptyState";
import { AdminTableSkeleton } from "../components/admin/AdminPageLoader";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { getBaseUrl } from "../utils/app";
import { INPUT_CLASS, LABEL_CLASS, LABEL_CLASS_SM } from "../components/admin/formStyles";
import { ChevronRight, Sparkles } from "lucide-react";
import {
  loadNewEventDraft,
  saveNewEventDraft,
  clearNewEventDraft,
} from "../utils/draftStorage";

const emptyConfig: EventConfig = {};

type CreateStep = 1 | 2;

export default function AdminDashboard() {
  useDocumentTitle("Events");
  const user = getAdminUser();
  const isMainAdmin = user?.role === "main_admin";
  const [events, setEvents] = useState<Array<{ id: string; slug: string; name: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>(1);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [config, setConfig] = useState<EventConfig>(emptyConfig);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [showOwnerFields, setShowOwnerFields] = useState(false);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  // Restore create-form draft when opening create modal
  useEffect(() => {
    if (!showCreate) return;
    const draft = loadNewEventDraft();
    if (draft) {
      setSlug(draft.slug);
      setName(draft.name);
      setConfig(draft.config);
    }
  }, [showCreate]);

  // Persist create form to localStorage (debounced) so refresh doesn’t lose data
  useEffect(() => {
    if (!showCreate) return;
    const t = setTimeout(() => {
      saveNewEventDraft({ slug, name, config });
    }, 500);
    return () => clearTimeout(t);
  }, [showCreate, slug, name, config]);

  const fetchEvents = useCallback(() => {
    adminListEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const eventName = name.trim() || slug.trim();
      const payload: Parameters<typeof adminCreateEvent>[0] = {
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        name: eventName,
        config: {
          ...config,
          coupleNames: config.coupleNames?.trim() || eventName || undefined,
        },
      };
      if (ownerEmail.trim() && ownerPassword) {
        payload.ownerEmail = ownerEmail.trim();
        payload.ownerPassword = ownerPassword;
      }
      const result = await adminCreateEvent(payload);
      fetchEvents();
      clearNewEventDraft();
      setShowCreate(false);
      setCreateStep(1);
      setSlug("");
      setName("");
      setConfig(emptyConfig);
      setOwnerEmail("");
      setOwnerPassword("");
      setShowOwnerFields(false);
      if (result.createdOwner) {
        setCreateSuccess(
          `Event created. Event owner ${result.createdOwner.email} can sign in at /admin with the password you set.`
        );
        setTimeout(() => setCreateSuccess(null), 8000);
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  const baseUrl = getBaseUrl();

  const handleDeleteEvent = useCallback(
    async (slug: string) => {
      if (!confirm("Delete this event? All guests, RSVPs, and invite links will be removed. This cannot be undone.")) return;
      setDeletingSlug(slug);
      try {
        await adminDeleteEvent(slug);
        fetchEvents();
      } catch {
        setDeletingSlug(null);
      } finally {
        setDeletingSlug(null);
      }
    },
    [fetchEvents]
  );

  return (
    <AdminLayout title="Events">
      {/* Stats */}
      <div className="mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 inline-flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 tabular-nums">{events.length}</p>
            <p className="text-sm text-slate-500">Total events</p>
          </div>
        </div>
      </div>

      {/* Actions + success message */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <p className="text-sm text-slate-600">Manage your events, guests, and RSVPs.</p>
        {isMainAdmin && (
          <button
            type="button"
            onClick={() => { setShowCreate(true); setCreateStep(1); setCreateError(""); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New event
          </button>
        )}
      </div>
      {createSuccess && (
        <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          {createSuccess}
        </div>
      )}

      {/* Event list */}
      {loading ? (
        <AdminTableSkeleton rows={6} />
      ) : events.length === 0 ? (
        <AdminEmptyState
          icon={Calendar}
          title="No events yet"
          description="Create your first event to start sending invitations and collecting RSVPs."
          action={isMainAdmin ? { label: "Create event", onClick: () => { setShowCreate(true); setCreateStep(1); setCreateError(""); } } : undefined}
        />
      ) : (
        <>
          {/* Desktop: table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Event</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">URL</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right w-48">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{ev.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{baseUrl}e/{ev.slug}</code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/events/${ev.slug}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            title="View / Manage"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                          <Link
                            to={`/admin/events/${ev.slug}?tab=invitation`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            title="Edit invitation"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </Link>
                          {isMainAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(ev.slug)}
                              disabled={deletingSlug === ev.slug}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                              title="Delete event"
                            >
                              {deletingSlug === ev.slug ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3"
              >
                <div>
                  <p className="font-medium text-slate-900">{ev.name}</p>
                  <code className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded block mt-1 break-all">
                    {baseUrl}e/{ev.slug}
                  </code>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/admin/events/${ev.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 min-h-[44px]"
                    title="View / Manage"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <Link
                    to={`/admin/events/${ev.slug}?tab=invitation`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 min-h-[44px]"
                    title="Edit invitation"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Link>
                  {isMainAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(ev.slug)}
                      disabled={deletingSlug === ev.slug}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 min-h-[44px]"
                      title="Delete event"
                    >
                      {deletingSlug === ev.slug ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create event modal — two steps: basics then optional customization */}
      {isMainAdmin && showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col sm:max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Create event</h2>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Step {createStep} of 2</span>
              </div>
              <button
                type="button"
                onClick={() => { if (!creating) { setShowCreate(false); setCreateStep(1); } }}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {createStep === 1 && (
                  <div className="space-y-5">
                    <p className="text-sm text-slate-600">Set a URL and name. You can customize the invitation now or later from the event page.</p>
                    <div>
                      <label className={LABEL_CLASS}>Event URL</label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                        placeholder="raphael-christine"
                        className={INPUT_CLASS}
                        required
                        autoFocus
                      />
                      <p className="text-xs text-slate-500 mt-1">Guests will open: <strong>{baseUrl}e/{slug || "…"}</strong></p>
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Event name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Raphael & Christine"
                        className={INPUT_CLASS}
                      />
                      <p className="text-xs text-slate-500 mt-1">Couple names or event title. Used in the admin list and on the invitation—no need to enter it again when customizing.</p>
                    </div>
                    <div className="border-t border-slate-200 pt-5">
                      <button
                        type="button"
                        onClick={() => setShowOwnerFields((b) => !b)}
                        className="text-sm font-medium text-slate-700 hover:text-slate-900"
                      >
                        {showOwnerFields ? "− Hide" : "+ Add"} event owner (optional)
                      </button>
                      <p className="text-xs text-slate-500 mt-0.5">They can sign in at /admin and manage this event only.</p>
                      {showOwnerFields && (
                        <div className="grid gap-3 sm:grid-cols-2 mt-3">
                          <div>
                            <label className={LABEL_CLASS_SM}>Owner email</label>
                            <input
                              type="email"
                              value={ownerEmail}
                              onChange={(e) => setOwnerEmail(e.target.value)}
                              placeholder="owner@example.com"
                              className={INPUT_CLASS}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS_SM}>Owner password</label>
                            <input
                              type="password"
                              value={ownerPassword}
                              onChange={(e) => setOwnerPassword(e.target.value)}
                              placeholder="••••••••"
                              className={INPUT_CLASS}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {createError && (
                      <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                        {createError}
                      </div>
                    )}
                  </div>
                )}
                {createStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Customize invitation text, theme colors, and fonts. Couple names is pre-filled from the event name—edit it in Basics if you like.
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="max-h-[40vh] lg:max-h-[50vh] overflow-y-auto pr-2">
                        <EventConfigForm config={config} onChange={setConfig} />
                      </div>
                      <div className="min-h-0">
                        <p className="text-xs font-medium text-slate-500 mb-2">Live preview</p>
                        <InvitationPreview config={config} />
                      </div>
                    </div>
                    {createError && (
                      <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                        {createError}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50/50 shrink-0">
                <div className="flex flex-wrap gap-2">
                  {createStep === 2 && (
                    <button
                      type="button"
                      onClick={() => setCreateStep(1)}
                      className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
                    >
                      Back
                    </button>
                  )}
                  {createStep === 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setCreateStep(2);
                        setCreateError("");
                        setConfig((prev) => ({ ...prev, coupleNames: prev.coupleNames?.trim() || name.trim() || prev.coupleNames }));
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
                    >
                      Customize invitation
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      createStep === 1 ? "Create event" : "Create event"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (!creating) { setShowCreate(false); setCreateStep(1); } }}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
