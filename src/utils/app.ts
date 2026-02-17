/** Base URL for the app (origin + base path). Always ends with / so links like `${baseUrl}e/slug` are valid. */
export function getBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "";
  const path = base ? `${base}/` : "/";
  return `${window.location.origin}${path}`;
}

const SITE_TITLE = "Guestlist";

/** Full page title for document.title */
export function getPageTitle(subtitle: string | undefined): string {
  return subtitle ? `${subtitle} — ${SITE_TITLE}` : SITE_TITLE;
}

export { SITE_TITLE };
