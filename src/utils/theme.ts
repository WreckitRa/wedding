import type { EventTheme } from "../types/event";

const DEFAULT_PRIMARY = "#616161";
const DEFAULT_SECONDARY = "#747474";
const DEFAULT_BG = "#f2f2f2";

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace(/^#/, "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0")).join("");
}

/** Lighten or darken hex by amount (0–1). */
function adjustLightness(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb.map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }
  l = Math.max(0, Math.min(1, l + amount));
  if (s === 0) {
    const c = Math.round(l * 255);
    return rgbToHex(c, c, c);
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return rgbToHex(
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
  );
}

/** Build CSS variable overrides for the event invitation wrapper. */
export function getThemeStyle(theme?: EventTheme | null): Record<string, string> {
  const primary = theme?.primaryColor || DEFAULT_PRIMARY;
  const secondary = theme?.secondaryColor || DEFAULT_SECONDARY;
  const bg = theme?.backgroundColor || DEFAULT_BG;
  const primaryLight = adjustLightness(primary, 0.35);
  const primaryDark = adjustLightness(primary, -0.2);
  const secondaryLight = adjustLightness(secondary, 0.25);
  return {
    ["--ev-primary" as string]: primary,
    ["--ev-primary-light" as string]: primaryLight,
    ["--ev-primary-dark" as string]: primaryDark,
    ["--ev-secondary" as string]: secondary,
    ["--ev-secondary-light" as string]: secondaryLight,
    ["--ev-bg" as string]: bg,
  };
}

const DEFAULT_TEXT = "#000000";
const DEFAULT_HEADING = "#000000";
const DEFAULT_LINK = "#616161";
const DEFAULT_BUTTON_BG = "#000000";
const DEFAULT_BUTTON_TEXT = "#ffffff";
const DEFAULT_BORDER = "#000000";
const DEFAULT_FONT_HEADING = "Pinyon Script";
const DEFAULT_FONT_BODY = "Cinzel";

/** Google Fonts URL for given family names (e.g. "Pinyon Script", "Cinzel"). */
export function getThemeFontsUrl(theme?: EventTheme | null): string | null {
  const heading = (theme?.fontHeading || DEFAULT_FONT_HEADING).trim();
  const body = (theme?.fontBody || DEFAULT_FONT_BODY).trim();
  const families = [...new Set([heading, body].filter(Boolean))];
  if (families.length === 0) return null;
  const params = families.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}`).join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/** Inline style block so Tailwind theme vars and typography map to event theme inside .event-invitation */
export function getThemeStyleTag(theme?: EventTheme | null): string {
  const primary = theme?.primaryColor || DEFAULT_PRIMARY;
  const secondary = theme?.secondaryColor || DEFAULT_SECONDARY;
  const bg = theme?.backgroundColor || DEFAULT_BG;
  const primaryLight = adjustLightness(primary, 0.35);
  const primaryDark = adjustLightness(primary, -0.2);
  const secondaryLight = adjustLightness(secondary, 0.25);
  const text = theme?.textColor || DEFAULT_TEXT;
  const heading = theme?.headingColor ?? DEFAULT_HEADING;
  const link = theme?.linkColor ?? DEFAULT_LINK;
  const buttonBg = theme?.buttonBgColor ?? DEFAULT_BUTTON_BG;
  const buttonText = theme?.buttonTextColor ?? DEFAULT_BUTTON_TEXT;
  const border = theme?.borderColor ?? DEFAULT_BORDER;
  const fontH = theme?.fontHeading ? `"${theme.fontHeading}", cursive` : `"${DEFAULT_FONT_HEADING}", cursive`;
  const fontB = theme?.fontBody ? `"${theme.fontBody}", serif` : `"${DEFAULT_FONT_BODY}", serif`;
  const fsBase = theme?.fontSizeBase || "1rem";
  const fsHeading = theme?.fontSizeHeading || "4rem";

  return `
.event-invitation { --color-primary-50: #fff; --color-primary-100: ${bg}; --color-primary-200: ${primaryLight}; --color-primary-300: ${primaryLight}; --color-primary-400: ${primary}; --color-primary-500: ${primary}; --color-primary-600: ${primary}; --color-primary-700: ${primaryDark}; --color-primary-800: ${primaryDark}; --color-primary-900: #000; --color-secondary-100: ${secondaryLight}; --color-secondary-200: ${secondaryLight}; --color-secondary-500: ${secondary}; --color-secondary-700: ${secondary}; --ev-text: ${text}; --ev-heading: ${heading}; --ev-link: ${link}; --ev-button-bg: ${buttonBg}; --ev-button-text: ${buttonText}; --ev-border: ${border}; --ev-font-heading: ${fontH}; --ev-font-body: ${fontB}; --ev-fs-base: ${fsBase}; --ev-fs-heading: ${fsHeading}; }
.event-invitation .bg-primary-100 { background-color: var(--color-primary-100); }
.event-invitation .bg-secondary-100 { background-color: var(--color-secondary-100); }
.event-invitation, .event-invitation p, .event-invitation span { color: var(--ev-text); font-family: var(--ev-font-body); font-size: var(--ev-fs-base); }
.event-invitation h1, .event-invitation h2, .event-invitation .font-pinyon { font-family: var(--ev-font-heading); color: var(--ev-heading); font-size: var(--ev-fs-heading); }
.event-invitation a { color: var(--ev-link); }
.event-invitation button.bg-black, .event-invitation .bg-black { background-color: var(--ev-button-bg) !important; color: var(--ev-button-text) !important; }
.event-invitation .border-black, .event-invitation .border-primary-200 { border-color: var(--ev-border); }
.event-invitation .bg-black\\/70 { color: var(--ev-text); }
.event-invitation .text-primary-700 { color: var(--ev-link); }
.event-invitation .text-black { color: var(--ev-text); }
.event-invitation input:focus, .event-invitation textarea:focus { --tw-ring-color: var(--ev-link); border-color: var(--ev-link); }
`.trim();
}
