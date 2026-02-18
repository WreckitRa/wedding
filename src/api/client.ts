const API_BASE = import.meta.env.VITE_API_URL || "";

function getToken(): string | null {
  return localStorage.getItem("admin_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const message = err.error || res.statusText;
    const e = new Error(message) as Error & { body?: Record<string, unknown> };
    e.body = err;
    throw e;
  }
  return res.json();
}

/** Public: get event by slug */
export async function getEvent(slug: string) {
  return request<{ id: string; slug: string; name: string; config: import("../types/event").EventConfig }>(
    `/api/events/${encodeURIComponent(slug)}`
  );
}

/** Public: get guest by event slug + token */
export async function getGuest(slug: string, token: string) {
  return request<import("../types/event").Guest>(
    `/api/events/${encodeURIComponent(slug)}/guest/${encodeURIComponent(token)}`
  );
}

/** Public: submit RSVP */
export async function submitRSVP(
  slug: string,
  data: {
    guestId?: string;
    guestName: string;
    partnerName?: string;
    attendance: "yes" | "no";
    extraGuests?: number;
    favoriteSongs?: [string, string];
    reaction?: string;
    message?: string;
  }
) {
  return request<{ success: boolean; id?: string }>(`/api/events/${encodeURIComponent(slug)}/rsvp`, {
    method: "POST",
    body: JSON.stringify({
      ...data,
      favoriteSongs: data.favoriteSongs || ["", ""],
    }),
  });
}

/** Public: check if already RSVP'd (by guest id or token) */
export async function checkRSVPStatus(slug: string, guestId: string) {
  const r = await request<{ found: boolean }>(
    `/api/events/${encodeURIComponent(slug)}/rsvp-status?guestId=${encodeURIComponent(guestId)}`
  );
  return r.found;
}

/** Public: record that a guest opened their invite link (idempotent, no auth) */
export async function recordGuestOpened(slug: string, token: string) {
  return request<{ ok: boolean }>(
    `/api/events/${encodeURIComponent(slug)}/guest/${encodeURIComponent(token)}/opened`,
    { method: "POST" }
  );
}

const API_BASE_PUBLIC = import.meta.env.VITE_API_URL || "";

/** Public: submit early access signup (no auth). Used by landing page "Get early access" / modal. */
export async function submitEarlyAccess(data: {
  name: string;
  email: string;
  eventType?: string;
  plan?: string;
  city?: string;
}): Promise<{ success: boolean; id?: string }> {
  const url = `${API_BASE_PUBLIC}/api/early-access`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.name.trim(),
      email: data.email.trim(),
      eventType: data.eventType?.trim() || undefined,
      plan: data.plan?.trim() || undefined,
      city: data.city?.trim() || undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Failed to submit");
  }
  return res.json();
}

/** Admin: list early access leads */
export async function adminListEarlyAccess() {
  return request<Array<{
    id: string;
    name: string;
    email: string;
    eventType: string | null;
    plan: string | null;
    city: string | null;
    createdAt: string;
  }>>("/api/admin/early-access");
}

/** Auth */
export async function login(email: string, password: string) {
  const r = await request<{ token: string; user: { id: string; email: string; role: string } }>(
    `/api/auth/login`,
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
  if (r.token) {
    localStorage.setItem("admin_token", r.token);
    localStorage.setItem("admin_user", JSON.stringify(r.user));
  }
  return r;
}

export function logout() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
}

export function getAdminUser(): { id: string; email: string; role: string } | null {
  try {
    const raw = localStorage.getItem("admin_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Admin: list events */
export async function adminListEvents() {
  return request<Array<{ id: string; slug: string; name: string; created_at: string }>>(
    "/api/admin/events"
  );
}

/** Admin: create event */
export async function adminCreateEvent(data: {
  slug: string;
  name: string;
  config?: import("../types/event").EventConfig;
  ownerEmail?: string;
  ownerPassword?: string;
  ownerId?: string;
}) {
  return request<{ id: string; slug: string; name: string; ownerId?: string; createdOwner?: { id: string; email: string } }>("/api/admin/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Admin: get event detail. main_admin also receives ownerId, ownerEmail. */
export async function adminGetEvent(eventSlug: string) {
  return request<{
    id: string;
    slug: string;
    name: string;
    config: import("../types/event").EventConfig;
    guestCount: number;
    rsvpCount: number;
    ownerId?: string;
    ownerEmail?: string;
  }>(`/api/admin/events/${encodeURIComponent(eventSlug)}`);
}

/** Admin: update event (slug change with guests/RSVPs requires confirmRemoveGuestsAndRsvps: true) */
export async function adminUpdateEvent(
  eventSlug: string,
  data: {
    name?: string;
    config?: import("../types/event").EventConfig;
    slug?: string;
    confirmRemoveGuestsAndRsvps?: boolean;
  }
) {
  return request<{ ok: boolean; slug?: string }>(`/api/admin/events/${encodeURIComponent(eventSlug)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** Admin: update event owner login (main_admin only). Provide email and/or newPassword. */
export async function adminUpdateEventOwner(
  eventSlug: string,
  data: { email?: string; newPassword?: string }
) {
  return request<{ ok: boolean }>(`/api/admin/events/${encodeURIComponent(eventSlug)}/owner`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** Admin: delete event (main_admin only) */
export async function adminDeleteEvent(eventSlug: string) {
  return request<{ ok: boolean }>(`/api/admin/events/${encodeURIComponent(eventSlug)}`, {
    method: "DELETE",
  });
}

/** Admin: generate color palette from theme words (e.g. "gold and rose"). Requires server OPENAI_API_KEY. */
export async function adminGeneratePalette(theme: string) {
  return request<{ palette: import("../types/event").EventTheme }>("/api/admin/palette", {
    method: "POST",
    body: JSON.stringify({ theme: theme.trim() }),
  });
}

/** Admin: list guests (includes firstOpenedAt, hasRsvp) */
export async function adminListGuests(eventSlug: string) {
  return request<Array<
    import("../types/event").Guest & {
      createdAt?: string;
      firstOpenedAt?: string | null;
      hasRsvp: boolean;
    }
  >>(`/api/admin/events/${encodeURIComponent(eventSlug)}/guests`);
}

/** Admin: update guest */
export async function adminUpdateGuest(
  eventSlug: string,
  guestId: string,
  data: { name?: string; partnerName?: string | null; maxExtraGuests?: number | null }
) {
  return request<{ ok: boolean }>(
    `/api/admin/events/${encodeURIComponent(eventSlug)}/guests/${encodeURIComponent(guestId)}`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

/** Admin: add guest */
export async function adminAddGuest(
  eventSlug: string,
  data: { name: string; partnerName?: string; maxExtraGuests?: number }
) {
  return request<{
    id: string;
    token: string;
    name: string;
    partnerName: string | null;
    maxExtraGuests: number | null;
    inviteUrl: string;
  }>(`/api/admin/events/${encodeURIComponent(eventSlug)}/guests`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Admin: delete guest */
export async function adminDeleteGuest(eventSlug: string, guestId: string) {
  return request<{ ok: boolean }>(
    `/api/admin/events/${encodeURIComponent(eventSlug)}/guests/${encodeURIComponent(guestId)}`,
    { method: "DELETE" }
  );
}

/** Admin: upload up to 5 moment images; returns URLs to add to config.images.moments */
export async function adminUploadMoments(eventSlug: string, files: File[]): Promise<{ urls: string[] }> {
  const API_BASE = import.meta.env.VITE_API_URL || "";
  const token = localStorage.getItem("admin_token");
  const form = new FormData();
  files.forEach((f) => form.append("images", f));
  const res = await fetch(`${API_BASE}/api/admin/events/${encodeURIComponent(eventSlug)}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

/** Admin: upload card invitation images (front, back, envelope). Omit a key to skip. Returns URLs for each uploaded. */
export async function adminUploadInvitation(
  eventSlug: string,
  files: { front?: File; back?: File; envelope?: File }
): Promise<{ front?: string; back?: string; envelope?: string }> {
  const API_BASE = import.meta.env.VITE_API_URL || "";
  const token = localStorage.getItem("admin_token");
  const form = new FormData();
  if (files.front) form.append("front", files.front);
  if (files.back) form.append("back", files.back);
  if (files.envelope) form.append("envelope", files.envelope);
  const res = await fetch(`${API_BASE}/api/admin/events/${encodeURIComponent(eventSlug)}/upload-invitation`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

/** Admin: list RSVPs */
export async function adminListRSVPs(eventSlug: string) {
  return request<Array<{
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
  }>>(`/api/admin/events/${encodeURIComponent(eventSlug)}/rsvps`);
}
