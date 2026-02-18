import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Users,
  MessageCircle,
  MailOpen,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Music,
  Heart,
  MessageSquare,
} from "lucide-react";
import {
  adminGetEvent,
  adminListGuests,
  adminListRSVPs,
  adminAddGuest,
  adminDeleteGuest,
  adminUpdateGuest,
  adminUpdateEvent,
  adminUpdateEventOwner,
  getAdminUser,
} from "../api/client";
import type { Guest } from "../types/event";
import type { EventConfig } from "../types/event";
import EventConfigForm from "../components/admin/EventConfigForm";
import AdminLayout from "../components/admin/AdminLayout";
import CopyButton from "../components/admin/CopyButton";
import AdminPageLoader from "../components/admin/AdminPageLoader";
import AdminEmptyState from "../components/admin/AdminEmptyState";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { getBaseUrl } from "../utils/app";
import { INPUT_CLASS } from "../components/admin/formStyles";
import {
  loadEditDraft,
  saveEditDraft,
  clearEditDraft,
  type EditDraft,
} from "../utils/draftStorage";

type GuestRow = Guest & { token: string; firstOpenedAt?: string | null; hasRsvp: boolean; createdAt?: string };

type RsvpRow = {
  id: string;
  guest_id: string | null;
  guest_name: string;
  partner_name: string | null;
  attendance: string;
  extra_guests: number;
  song1: string | null;
  song2: string | null;
  reaction: string | null;
  message: string | null;
  submission_time: string;
};

export default function AdminEventPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [event, setEvent] = useState<{
    slug: string;
    name: string;
    config: EventConfig;
    guestCount: number;
    rsvpCount: number;
    comingCount: number;
    ownerId?: string;
    ownerEmail?: string;
  } | null>(null);
  const [invitationConfig, setInvitationConfig] = useState<EventConfig>({});
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [tab, setTab] = useState<"guests" | "rsvps" | "invitation">(
    (tabParam === "invitation" || tabParam === "rsvps" ? tabParam : "guests") as "guests" | "rsvps" | "invitation"
  );
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPartner, setAddPartner] = useState("");
  const [addExtra, setAddExtra] = useState(0);
  const [adding, setAdding] = useState(false);
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPartner, setEditPartner] = useState("");
  const [editExtra, setEditExtra] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [draftOffer, setDraftOffer] = useState<EditDraft | null>(null);
  const draftCheckDone = useRef(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [slugEditValue, setSlugEditValue] = useState("");
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugConfirmModal, setSlugConfirmModal] = useState<{ newSlug: string; guestCount: number; rsvpCount: number } | null>(null);
  const [nameEditValue, setNameEditValue] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [ownerEmailEdit, setOwnerEmailEdit] = useState("");
  const [ownerPasswordEdit, setOwnerPasswordEdit] = useState("");
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [ownerSuccess, setOwnerSuccess] = useState(false);
  const [eventNameSlugExpanded, setEventNameSlugExpanded] = useState(false);
  const [viewSubmission, setViewSubmission] = useState<{ guest: GuestRow } | { rsvp: RsvpRow } | null>(null);

  const navigate = useNavigate();
  const isMainAdmin = getAdminUser()?.role === "main_admin";
  const baseUrl = getBaseUrl();
  useDocumentTitle(event?.name ?? "Event");

  const fetchData = useCallback(() => {
    if (!eventSlug) return;
    setLoading(true);
    Promise.all([
      adminGetEvent(eventSlug),
      adminListGuests(eventSlug),
      adminListRSVPs(eventSlug),
    ])
      .then(([e, g, r]) => {
        setEvent({
          slug: e.slug,
          name: e.name,
          config: e.config ?? {},
          guestCount: e.guestCount,
          rsvpCount: e.rsvpCount,
          comingCount: e.comingCount ?? 0,
          ownerId: e.ownerId,
          ownerEmail: e.ownerEmail,
        });
        setInvitationConfig(e.config ?? {});
        setGuests(g);
        setRsvps(r);
      })
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [eventSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (event?.slug != null) setSlugEditValue(event.slug);
    if (event?.name != null) setNameEditValue(event.name);
    if (event?.ownerEmail != null) setOwnerEmailEdit(event.ownerEmail);
  }, [event?.slug, event?.name, event?.ownerEmail]);

  useEffect(() => {
    draftCheckDone.current = false;
  }, [eventSlug]);

  // After load: offer to restore draft if one exists
  useEffect(() => {
    if (!eventSlug || !event || loading) return;
    if (draftCheckDone.current) return;
    draftCheckDone.current = true;
    const draft = loadEditDraft(eventSlug);
    if (draft) setDraftOffer(draft);
  }, [eventSlug, event, loading]);

  // Persist invitation config to localStorage (debounced) so refresh/tab close doesn’t lose data
  useEffect(() => {
    if (!eventSlug || !event) return;
    const t = setTimeout(() => {
      saveEditDraft(eventSlug, invitationConfig);
    }, 500);
    return () => clearTimeout(t);
  }, [eventSlug, event, invitationConfig]);

  const restoreDraft = useCallback(() => {
    if (draftOffer) {
      setInvitationConfig(draftOffer.config);
      clearEditDraft(eventSlug ?? "");
      setDraftOffer(null);
    }
  }, [draftOffer, eventSlug]);

  const discardDraft = useCallback(() => {
    clearEditDraft(eventSlug ?? "");
    setDraftOffer(null);
  }, [eventSlug]);

  // Sync tab from URL (e.g. /admin/events/:slug?tab=invitation)
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "invitation" || t === "rsvps") setTab(t);
    else if (t === "guests" || !t) setTab("guests");
  }, [searchParams]);

  const setTabAndUrl = useCallback((newTab: "guests" | "rsvps" | "invitation") => {
    setTab(newTab);
    setSearchParams(newTab === "guests" ? {} : { tab: newTab }, { replace: true });
  }, [setSearchParams]);

  const normalizeSlug = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const handleSaveSlug = useCallback(async () => {
    if (!eventSlug || !event) return;
    const normalized = normalizeSlug(slugEditValue);
    if (normalized.length < 2) {
      setSlugError("URL must be at least 2 characters (letters, numbers, hyphens only)");
      return;
    }
    if (normalized === event.slug) {
      setSlugError(null);
      return;
    }
    setSlugError(null);
    setSlugSaving(true);
    try {
      const result = await adminUpdateEvent(eventSlug, { slug: normalized });
      setSlugConfirmModal(null);
      if (result.slug) {
        navigate(`/admin/events/${result.slug}${tab !== "guests" ? `?tab=${tab}` : ""}`, { replace: true });
      }
    } catch (err: unknown) {
      const body = (err as Error & { body?: { requireConfirm?: boolean; guestCount?: number; rsvpCount?: number; error?: string } })?.body;
      if (body?.requireConfirm && typeof body.guestCount === "number" && typeof body.rsvpCount === "number") {
        setSlugConfirmModal({ newSlug: normalized, guestCount: body.guestCount, rsvpCount: body.rsvpCount });
      } else {
        setSlugError(body?.error ?? (err instanceof Error ? err.message : "Failed to update URL"));
      }
    } finally {
      setSlugSaving(false);
    }
  }, [eventSlug, event, slugEditValue, tab, navigate]);

  const handleSaveName = useCallback(async () => {
    if (!eventSlug || !event) return;
    const trimmed = nameEditValue.trim();
    if (!trimmed) {
      setNameError("Event name is required");
      return;
    }
    if (trimmed === event.name) {
      setNameError(null);
      return;
    }
    setNameError(null);
    setNameSaving(true);
    try {
      await adminUpdateEvent(eventSlug, { name: trimmed });
      setEvent((prev) => (prev ? { ...prev, name: trimmed } : null));
    } catch (err: unknown) {
      const body = (err as Error & { body?: { error?: string } })?.body;
      setNameError(body?.error ?? (err instanceof Error ? err.message : "Failed to update name"));
    } finally {
      setNameSaving(false);
    }
  }, [eventSlug, event, nameEditValue]);

  const handleUpdateOwner = useCallback(async () => {
    if (!eventSlug || !event) return;
    const email = ownerEmailEdit.trim();
    const password = ownerPasswordEdit.trim();
    if (!email && !password) {
      setOwnerError("Enter a new email and/or password");
      return;
    }
    setOwnerError(null);
    setOwnerSuccess(false);
    setOwnerSaving(true);
    try {
      await adminUpdateEventOwner(eventSlug, {
        ...(email ? { email } : {}),
        ...(password ? { newPassword: password } : {}),
      });
      setOwnerPasswordEdit("");
      setOwnerSuccess(true);
      if (email) setEvent((prev) => (prev ? { ...prev, ownerEmail: email } : null));
      setTimeout(() => setOwnerSuccess(false), 3000);
    } catch (err: unknown) {
      const body = (err as Error & { body?: { error?: string } })?.body;
      setOwnerError(body?.error ?? (err instanceof Error ? err.message : "Failed to update login"));
    } finally {
      setOwnerSaving(false);
    }
  }, [eventSlug, event, ownerEmailEdit, ownerPasswordEdit]);

  const handleConfirmSlugChange = useCallback(async () => {
    if (!eventSlug || !slugConfirmModal) return;
    setSlugSaving(true);
    try {
      const result = await adminUpdateEvent(eventSlug, {
        slug: slugConfirmModal.newSlug,
        confirmRemoveGuestsAndRsvps: true,
      });
      setSlugConfirmModal(null);
      if (result.slug) {
        navigate(`/admin/events/${result.slug}${tab !== "guests" ? `?tab=${tab}` : ""}`, { replace: true });
      }
    } catch (err) {
      setSlugError(err instanceof Error ? err.message : "Failed to update URL");
    } finally {
      setSlugSaving(false);
    }
  }, [eventSlug, slugConfirmModal, tab, navigate]);

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventSlug || !addName.trim()) return;
    setAdding(true);
    setNewInviteUrl(null);
    try {
      const r = await adminAddGuest(eventSlug, {
        name: addName.trim(),
        partnerName: addPartner.trim() || undefined,
        maxExtraGuests: addExtra || undefined,
      });
      setGuests((prev) => [
        ...prev,
        {
          id: r.id,
          token: r.token,
          name: r.name,
          partnerName: r.partnerName,
          maxExtraGuests: r.maxExtraGuests ?? undefined,
          hasRsvp: false,
          firstOpenedAt: null,
        },
      ]);
      setNewInviteUrl(`${baseUrl}e/${eventSlug}/invite/${r.token}`);
      setAddName("");
      setAddPartner("");
      setAddExtra(0);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteGuest = useCallback(
    async (guestId: string) => {
      if (!eventSlug || !confirm("Remove this guest from the list?")) return;
      try {
        await adminDeleteGuest(eventSlug, guestId);
        setGuests((prev) => prev.filter((g) => g.id !== guestId));
      } catch {
        // ignore
      }
    },
    [eventSlug]
  );

  const startEdit = useCallback((g: GuestRow) => {
    setEditingGuestId(g.id);
    setEditName(g.name);
    setEditPartner(g.partnerName || "");
    setEditExtra(g.maxExtraGuests ?? "");
  }, []);

  const cancelEdit = useCallback(() => setEditingGuestId(null), []);

  const handleSaveInvitation = useCallback(async () => {
    if (!eventSlug) return;
    setSavingConfig(true);
    try {
      await adminUpdateEvent(eventSlug, { config: invitationConfig });
      setEvent((prev) => (prev ? { ...prev, config: invitationConfig } : null));
      clearEditDraft(eventSlug);
      setPreviewKey((k) => k + 1);
    } finally {
      setSavingConfig(false);
    }
  }, [eventSlug, invitationConfig]);

  const handleUpdateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventSlug || !editingGuestId) return;
    setSaving(true);
    try {
      await adminUpdateGuest(eventSlug, editingGuestId, {
        name: editName.trim(),
        partnerName: editPartner.trim() || null,
        maxExtraGuests: editExtra === "" ? null : Number(editExtra),
      });
      setGuests((prev) =>
        prev.map((g) =>
          g.id === editingGuestId
            ? {
                ...g,
                name: editName.trim(),
                partnerName: editPartner.trim() || null,
                maxExtraGuests: editExtra === "" ? undefined : Number(editExtra),
              }
            : g
        )
      );
      setEditingGuestId(null);
    } finally {
      setSaving(false);
    }
  };

  const openCount = guests.filter((g) => g.firstOpenedAt).length;

  if (loading || !event) {
    return (
      <AdminLayout
        title={event?.name ?? "Event"}
        breadcrumb={[{ label: "Events", to: "/admin/events" }, { label: event?.name ?? "…" }]}
      >
        <AdminPageLoader />
        {!loading && !event && (
          <p className="text-slate-500 text-sm">Event not found. It may have been removed or you don’t have access.</p>
        )}
      </AdminLayout>
    );
  }

  const publicUrl = `${baseUrl}e/${eventSlug}`;

  const tabClass = (active: boolean) =>
    `px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
    }`;

  return (
    <AdminLayout
      title={event.name}
      breadcrumb={[{ label: "Events", to: "/admin/events" }, { label: event.name }]}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 tabular-nums">{event.guestCount}</p>
            <p className="text-sm text-slate-500">Guests</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 tabular-nums">{event.comingCount}</p>
            <p className="text-sm text-slate-500">Coming</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <MailOpen className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 tabular-nums">{openCount}</p>
            <p className="text-sm text-slate-500">Opened link</p>
          </div>
        </div>
      </div>

      {draftOffer && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-amber-900">
            You have unsaved changes from {new Date(draftOffer.savedAt).toLocaleString()}. Restore them?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
            >
              Restore
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 text-sm font-medium hover:bg-amber-100"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Event links */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Event links</h3>
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setEventNameSlugExpanded((e) => !e)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 text-left bg-slate-50/80 hover:bg-slate-100/80 transition-colors min-h-[44px]"
              aria-expanded={eventNameSlugExpanded}
            >
              <span className="text-sm font-medium text-slate-800">Event name &amp; URL</span>
              <span className="flex items-center gap-2 shrink-0">
                {!eventNameSlugExpanded && event && (
                  <span className="text-xs text-slate-500 truncate max-w-[180px] sm:max-w-none" title={`${event.name} · e/${event.slug}`}>
                    {event.name} · e/{event.slug}
                  </span>
                )}
                {eventNameSlugExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" aria-hidden />
                )}
              </span>
            </button>
            {eventNameSlugExpanded && (
              <div className="p-3 sm:p-4 pt-0 border-t border-slate-200 space-y-4">
                {isMainAdmin ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">Event name</label>
                      <p className="text-xs text-slate-500 mb-2">Shown in the admin list and on the invitation (e.g. couple names or event title).</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <input
                          type="text"
                          value={nameEditValue}
                          onChange={(e) => { setNameEditValue(e.target.value); setNameError(null); }}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                          placeholder="e.g. Raphael & Christine"
                          className={INPUT_CLASS + " flex-1 min-w-0"}
                        />
                        <button
                          type="button"
                          onClick={handleSaveName}
                          disabled={nameSaving || nameEditValue.trim() === event.name}
                          className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 min-h-[44px]"
                        >
                          {nameSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save name"}
                        </button>
                      </div>
                      {nameError && <p className="text-sm text-red-600 mt-1">{nameError}</p>}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Event URL — change only if you haven’t shared the link yet, or you’re okay removing all guests and RSVPs</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-slate-500 shrink-0">{baseUrl}e/</span>
              <input
                type="text"
                value={slugEditValue}
                onChange={(e) => setSlugEditValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveSlug()}
                placeholder="event-slug"
                className={INPUT_CLASS + " flex-1 min-w-0 font-mono text-sm"}
                spellCheck={false}
              />
              <button
                type="button"
                onClick={handleSaveSlug}
                disabled={slugSaving || normalizeSlug(slugEditValue) === event.slug}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 min-h-[44px]"
              >
                {slugSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save URL"}
              </button>
            </div>
            {slugError && <p className="text-sm text-red-600 mt-1">{slugError}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Event name</label>
                      <p className="text-sm text-slate-900">{event.name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Event URL</label>
                      <p className="text-sm font-mono text-slate-900 break-all">{baseUrl}e/{event.slug}</p>
                    </div>
                    <p className="text-xs text-slate-500">Only the system admin can change the event name or URL.</p>
                  </>
                )}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2">Public link — anyone can open and enter their name to RSVP</p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
              <code className="flex-1 min-w-0 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-700 break-all">
                {publicUrl}
              </code>
              <CopyButton text={publicUrl} variant="secondary" className="shrink-0 self-start sm:self-center" />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Add guests in the Guests tab to generate unique invite links for each person.
          </p>
          {isMainAdmin && (event?.ownerId ?? event?.ownerEmail) && (
            <div className="pt-4 mt-4 border-t border-slate-200">
              <label className="block text-xs font-medium text-slate-700 mb-2">Event owner login</label>
              <p className="text-xs text-slate-500 mb-3">Update the email and/or password the event owner uses to sign in at /admin.</p>
              <div className="flex flex-col gap-3">
                <div>
                  <input
                    type="email"
                    value={ownerEmailEdit}
                    onChange={(e) => { setOwnerEmailEdit(e.target.value); setOwnerError(null); }}
                    placeholder="owner@example.com"
                    className={INPUT_CLASS + " w-full max-w-xs"}
                  />
                  <p className="text-xs text-slate-500 mt-1">Leave blank to keep current email</p>
                </div>
                <div>
                  <input
                    type="password"
                    value={ownerPasswordEdit}
                    onChange={(e) => { setOwnerPasswordEdit(e.target.value); setOwnerError(null); }}
                    placeholder="New password"
                    autoComplete="new-password"
                    className={INPUT_CLASS + " w-full max-w-xs"}
                  />
                  <p className="text-xs text-slate-500 mt-1">Leave blank to keep current password</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUpdateOwner}
                    disabled={
                      ownerSaving ||
                      ((!ownerEmailEdit.trim() || ownerEmailEdit.trim() === event?.ownerEmail) && !ownerPasswordEdit.trim())
                    }
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 min-h-[44px]"
                  >
                    {ownerSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save login"}
                  </button>
                  {ownerSuccess && <span className="text-sm text-emerald-600">Saved.</span>}
                </div>
                {ownerError && <p className="text-sm text-red-600">{ownerError}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm slug change (removes guests & RSVPs) */}
      {slugConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Change event URL?</h3>
            <p className="text-sm text-slate-600 mb-4">
              This event has <strong>{slugConfirmModal.guestCount} guest(s)</strong> and <strong>{slugConfirmModal.rsvpCount} RSVP(s)</strong>.
              Changing the URL will invalidate all invite links. All guests and RSVPs will be <strong>permanently removed</strong>.
            </p>
            <p className="text-sm text-slate-600 mb-4">
              New URL: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{baseUrl}e/{slugConfirmModal.newSlug}</code>
            </p>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setSlugConfirmModal(null)}
                disabled={slugSaving}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSlugChange}
                disabled={slugSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {slugSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Change URL and remove guests &amp; RSVPs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest submission modal — what the guest sent (songs, message, reaction) */}
      {viewSubmission && (() => {
        const isGuest = "guest" in viewSubmission;
        const guest = isGuest ? viewSubmission.guest : null;
        const rsvpFromPayload = !isGuest ? viewSubmission.rsvp : null;
        const rsvp = rsvpFromPayload ?? (guest ? rsvps.find((r) => r.guest_id === guest.id) : null);
        const titleName = isGuest && guest ? guest.name : rsvpFromPayload?.guest_name ?? "Guest";
        const titlePartner = isGuest && guest ? guest.partnerName : rsvpFromPayload?.partner_name;
        const inviteToken = isGuest && guest ? guest.token : null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setViewSubmission(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-submission-title"
          >
            <div
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6 border-b border-slate-200 flex items-start justify-between gap-3">
                <h3 id="guest-submission-title" className="text-lg font-semibold text-slate-900">
                  {titleName}
                  {titlePartner && (
                    <span className="text-slate-500 font-normal"> + {titlePartner}</span>
                  )}
                </h3>
                <button
                  type="button"
                  onClick={() => setViewSubmission(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 sm:p-6 space-y-4">
                {!rsvp ? (
                  <>
                    <p className="text-slate-500">Hasn&apos;t responded yet.</p>
                    {inviteToken && (
                      <a
                        href={`${baseUrl}e/${eventSlug}/invite/${inviteToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open invite link
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${
                          rsvp.attendance === "yes" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        {rsvp.attendance === "yes" ? "Coming" : "Not coming"}
                      </span>
                      {rsvp.attendance === "yes" && (rsvp.partner_name || rsvp.extra_guests > 0) && (
                        <span className="text-sm text-slate-500">
                          {rsvp.partner_name && "+1 partner"}
                          {rsvp.partner_name && rsvp.extra_guests > 0 && " · "}
                          {rsvp.extra_guests > 0 && `+${rsvp.extra_guests} extra`}
                        </span>
                      )}
                    </div>
                    {rsvp.reaction && (
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-rose-400 shrink-0" />
                        <span className="text-2xl" role="img" aria-label="Reaction">
                          {rsvp.reaction}
                        </span>
                      </div>
                    )}
                    {(rsvp.song1 || rsvp.song2) && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Music className="w-4 h-4" />
                          Song requests
                        </p>
                        <ul className="space-y-1.5 text-slate-800">
                          {rsvp.song1 && <li className="flex items-start gap-2">{rsvp.song1}</li>}
                          {rsvp.song2 && <li className="flex items-start gap-2">{rsvp.song2}</li>}
                        </ul>
                      </div>
                    )}
                    {rsvp.message && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4" />
                          Message
                        </p>
                        <p className="text-slate-800 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm">
                          {rsvp.message}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 pt-1">
                      Submitted {new Date(rsvp.submission_time).toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        <button type="button" onClick={() => setTabAndUrl("guests")} className={tabClass(tab === "guests") + " min-h-[44px] px-3 sm:px-4"}>
          Guests ({event.guestCount})
        </button>
        <button type="button" onClick={() => setTabAndUrl("rsvps")} className={tabClass(tab === "rsvps") + " min-h-[44px] px-3 sm:px-4"}>
          RSVPs ({event.rsvpCount})
        </button>
        <button
          type="button"
          onClick={() => setTabAndUrl("invitation")}
          className={tabClass(tab === "invitation") + " min-h-[44px] px-3 sm:px-4"}
        >
          Invitation
        </button>
      </div>

      {/* Tab: Guests */}
      {tab === "guests" && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Add guest (dedicated link)</h3>
            <form onSubmit={handleAddGuest} className="flex flex-col sm:flex-row flex-wrap gap-3">
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Name *"
                className={INPUT_CLASS + " w-full sm:w-40 min-h-[44px]"}
                required
              />
              <input
                type="text"
                value={addPartner}
                onChange={(e) => setAddPartner(e.target.value)}
                placeholder="Partner (optional)"
                className={INPUT_CLASS + " w-full sm:w-36 min-h-[44px]"}
              />
              <input
                type="number"
                min={0}
                value={addExtra}
                onChange={(e) => setAddExtra(parseInt(e.target.value, 10) || 0)}
                placeholder="Max +1"
                className={INPUT_CLASS + " w-full sm:w-24 min-h-[44px]"}
              />
              <button
                type="submit"
                disabled={adding}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {adding ? "Adding…" : "Add guest"}
              </button>
            </form>
            {newInviteUrl && (
              <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-sm font-medium text-emerald-800 mb-2">Invite link created — copy and send to guest:</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <code className="flex-1 min-w-0 px-3 py-2 bg-white rounded text-sm break-all">{newInviteUrl}</code>
                  <CopyButton text={newInviteUrl} label="Copy" copiedLabel="Copied!" variant="primary" className="shrink-0 self-start" />
                </div>
              </div>
            )}
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            {guests.length === 0 ? (
              <div className="p-10">
                <AdminEmptyState
                  icon={Users}
                  title="No guests yet"
                  description="Add a guest above to generate a unique invite link for them."
                />
              </div>
            ) : (
              <table className="w-full text-left text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Guest</th>
                    <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Opened</th>
                    <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">RSVP</th>
                    <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right w-52">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {guests.map((g) =>
                    editingGuestId === g.id ? (
                      <tr key={g.id} className="bg-slate-50/50">
                        <td colSpan={4} className="px-4 py-3">
                          <form onSubmit={handleUpdateGuest} className="flex flex-wrap gap-2 items-end">
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Name"
                              className={INPUT_CLASS + " w-36"}
                              required
                            />
                            <input
                              value={editPartner}
                              onChange={(e) => setEditPartner(e.target.value)}
                              placeholder="Partner"
                              className={INPUT_CLASS + " w-28"}
                            />
                            <input
                              type="number"
                              min={0}
                              value={editExtra}
                              onChange={(e) =>
                                setEditExtra(e.target.value === "" ? "" : parseInt(e.target.value, 10) || 0)
                              }
                              placeholder="+1"
                              className={INPUT_CLASS + " w-20"}
                            />
                            <button
                              type="submit"
                              disabled={saving}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
                            >
                              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              {saving ? "Saving…" : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          </form>
                        </td>
                      </tr>
                    ) : (
                      <tr key={g.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">{g.name}</span>
                          {g.partnerName && <span className="text-slate-500"> + {g.partnerName}</span>}
                          {g.maxExtraGuests != null && g.maxExtraGuests > 0 && (
                            <span className="text-slate-400 text-xs ml-1">(max +{g.maxExtraGuests})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {g.firstOpenedAt ? new Date(g.firstOpenedAt).toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {g.hasRsvp ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                              <Check className="w-4 h-4" /> Yes
                            </span>
                          ) : (
                            <span className="text-slate-400">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setViewSubmission({ guest: g })}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              title="View guest response"
                            >
                              <MessageSquare className="w-4 h-4" />
                              View
                            </button>
                            <CopyButton
                              text={`${baseUrl}e/${eventSlug}/invite/${g.token}`}
                              label="Copy"
                              variant="ghost"
                              className="!p-1.5 !px-2"
                            />
                            <button
                              type="button"
                              onClick={() => startEdit(g)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-700"
                              title="Edit guest"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGuest(g.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                              title="Remove guest"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab: RSVPs */}
      {tab === "rsvps" && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-6">
            {rsvps.length === 0 ? (
              <AdminEmptyState
                icon={MessageCircle}
                title="No RSVPs yet"
                description="Responses will appear here once guests submit their RSVP."
              />
            ) : (
              <div className="space-y-4">
                {rsvps.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50/60 transition-colors overflow-hidden"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {r.guest_name}
                            {r.partner_name && <span className="text-slate-600 font-normal"> + {r.partner_name}</span>}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                r.attendance === "yes" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              {r.attendance === "yes" ? "Coming" : "Not coming"}
                            </span>
                            {r.attendance === "yes" && (r.partner_name || r.extra_guests > 0) && (
                              <span className="text-xs text-slate-500">
                                {r.partner_name && "+1 partner"}
                                {r.partner_name && r.extra_guests > 0 && " · "}
                                {r.extra_guests > 0 && `+${r.extra_guests} extra`}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">
                          {new Date(r.submission_time).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 sm:gap-6">
                        {r.reaction && (
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-rose-400 shrink-0" aria-hidden />
                            <span className="text-2xl" role="img" aria-label="Reaction">{r.reaction}</span>
                          </div>
                        )}
                        {(r.song1 || r.song2) && (
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                              <Music className="w-3.5 h-3.5" />
                              Song requests
                            </p>
                            <ul className="text-sm text-slate-800 space-y-0.5">
                              {r.song1 && <li>{r.song1}</li>}
                              {r.song2 && <li>{r.song2}</li>}
                            </ul>
                          </div>
                        )}
                        {r.message && (
                          <div className="min-w-0 flex-1 basis-full sm:basis-0">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5" />
                              Message
                            </p>
                            <p className="text-sm text-slate-800 whitespace-pre-wrap rounded-lg bg-white/80 border border-slate-100 p-3">
                              {r.message}
                            </p>
                          </div>
                        )}
                      </div>
                      {!(r.reaction || r.song1 || r.song2 || r.message) && (
                        <p className="text-sm text-slate-400 italic">No message or song requests</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Invitation */}
      {tab === "invitation" && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 p-4 sm:p-6 border-b border-slate-200 bg-slate-50/30">
            <h3 className="text-sm font-semibold text-slate-900">Edit invitation</h3>
            <button
              type="button"
              onClick={handleSaveInvitation}
              disabled={savingConfig}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 min-h-[44px]"
            >
              {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savingConfig ? "Saving…" : "Save changes"}
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-4 sm:p-6 max-h-[50vh] lg:max-h-[70vh] overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200">
              <EventConfigForm config={invitationConfig} onChange={setInvitationConfig} eventSlug={eventSlug ?? undefined} />
            </div>
            <div className="p-4 sm:p-6 bg-slate-50/50 flex flex-col items-center">
              <div className="flex items-center justify-between gap-2 mb-2 w-full max-w-[375px]">
                <p className="text-xs font-medium text-slate-500">Real invitation (save to update)</p>
                <button
                  type="button"
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium shrink-0"
                >
                  Refresh
                </button>
              </div>
              <div className="flex justify-center w-full overflow-x-auto">
                <div className="relative rounded-[2rem] border-[8px] sm:border-[10px] border-slate-800 bg-slate-800 shadow-xl overflow-hidden shrink-0 w-full max-w-[375px]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-5 sm:h-6 bg-slate-800 rounded-b-2xl z-10" aria-hidden />
                  <div className="bg-white rounded-[1.25rem] overflow-hidden" style={{ minHeight: 500 }}>
                    <iframe
                      key={previewKey}
                      title="Invitation preview"
                      src={`${baseUrl}e/${eventSlug}?preview=1`}
                      className="w-full border-0 block"
                      style={{ height: "70vh", minHeight: 500 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
