/**
 * Persist form drafts to localStorage so data survives refresh or accidental tab close.
 * Keys are prefixed to avoid collisions.
 */

const PREFIX = "wedding-draft-";

export function draftKeyForEvent(slug: string): string {
  return `${PREFIX}edit-${slug}`;
}

export const DRAFT_KEY_NEW = `${PREFIX}new`;

export interface EditDraft {
  savedAt: number;
  config: import("../types/event").EventConfig;
}

export interface NewEventDraft {
  savedAt: number;
  slug: string;
  name: string;
  config: import("../types/event").EventConfig;
}

function safeParse<T>(key: string, raw: string | null): T | null {
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadEditDraft(slug: string): EditDraft | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(draftKeyForEvent(slug));
  const d = safeParse<EditDraft>(draftKeyForEvent(slug), raw);
  return d && typeof d.savedAt === "number" && d.config && typeof d.config === "object" ? d : null;
}

export function saveEditDraft(slug: string, config: import("../types/event").EventConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      draftKeyForEvent(slug),
      JSON.stringify({ savedAt: Date.now(), config })
    );
  } catch {
    // quota or disabled
  }
}

export function clearEditDraft(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(draftKeyForEvent(slug));
  } catch {}
}

export function loadNewEventDraft(): NewEventDraft | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DRAFT_KEY_NEW);
  const d = safeParse<NewEventDraft>(DRAFT_KEY_NEW, raw);
  return d &&
    typeof d.savedAt === "number" &&
    typeof d.slug === "string" &&
    typeof d.name === "string" &&
    d.config &&
    typeof d.config === "object"
    ? d
    : null;
}

export function saveNewEventDraft(data: {
  slug: string;
  name: string;
  config: import("../types/event").EventConfig;
}): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      DRAFT_KEY_NEW,
      JSON.stringify({ savedAt: Date.now(), ...data })
    );
  } catch {
    // quota or disabled
  }
}

export function clearNewEventDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_KEY_NEW);
  } catch {}
}
