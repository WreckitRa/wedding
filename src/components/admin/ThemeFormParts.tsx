import { useEffect } from "react";
import type { EventTheme } from "../../types/event";
import { INPUT_CLASS, LABEL_CLASS_SM } from "./formStyles";
import { getThemeFontsUrl } from "../../utils/theme";

/** Normalize to #RRGGBB for color inputs */
export function normalizeHex(value: string): string {
  const v = value.replace(/^#/, "").trim();
  if (/^[0-9a-fA-F]{6}$/.test(v)) return `#${v}`;
  if (/^[0-9a-fA-F]{3}$/.test(v)) return `#${v[0]}${v[0]}${v[1]}${v[1]}${v[2]}${v[2]}`;
  return value || "";
}

interface ColorFieldProps {
  label: string;
  value?: string;
  defaultValue: string;
  onChange: (value: string) => void;
}

export function ColorField({ label, value, defaultValue, onChange }: ColorFieldProps) {
  const raw = (value ?? "").trim() || defaultValue;
  const hex = normalizeHex(raw) || defaultValue;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    if (!v) {
      onChange(defaultValue);
      return;
    }
    onChange(normalizeHex(v) || v);
  };

  return (
    <div>
      <label className={LABEL_CLASS_SM}>{label}</label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded border border-slate-200 p-0.5 bg-white"
          aria-label={label}
        />
        <input
          type="text"
          value={value ?? ""}
          onChange={handleTextChange}
          placeholder={defaultValue}
          className={`${INPUT_CLASS} flex-1 min-w-0 font-mono text-xs`}
        />
        <span
          className="shrink-0 w-8 h-8 rounded-lg border border-slate-200"
          style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : defaultValue }}
          aria-hidden
        />
      </div>
    </div>
  );
}

/** Load Google Fonts and show sample text in that font */
export function FontPreview({ fontName, sampleText = "Sample text", className = "" }: { fontName: string; sampleText?: string; className?: string }) {
  const font = fontName?.trim() || "Inter";
  const linkId = `font-preview-${font.replace(/\s/g, "-")}`;
  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, "+")}&display=swap`;

  useEffect(() => {
    if (!font) return;
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    } else {
      link.href = href;
    }
    return () => {
      const l = document.getElementById(linkId);
      if (l) l.remove();
    };
  }, [font, href, linkId]);

  return (
    <p
      className={`text-sm text-slate-600 truncate ${className}`}
      style={{ fontFamily: font ? `"${font}", sans-serif` : "inherit" }}
      title={font}
    >
      {sampleText}
    </p>
  );
}

/** Mini invitation preview using current theme (colors + fonts) */
export function ThemePreviewCard({ theme, coupleNames = "Couple Names" }: { theme?: EventTheme | null; coupleNames?: string }) {
  const bg = theme?.backgroundColor || "#f2f2f2";
  const headingColor = theme?.headingColor || "#000000";
  const textColor = theme?.textColor || "#000000";
  const buttonBg = theme?.buttonBgColor || "#000000";
  const buttonText = theme?.buttonTextColor || "#ffffff";
  const fontHeading = theme?.fontHeading?.trim() || "Pinyon Script";
  const fontBody = theme?.fontBody?.trim() || "Cinzel";
  const fontSizeHeading = theme?.fontSizeHeading || "2rem";
  const fontSizeBase = theme?.fontSizeBase || "0.875rem";

  const fontsUrl = getThemeFontsUrl(theme);
  const linkId = "theme-preview-fonts";

  useEffect(() => {
    if (!fontsUrl) return;
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = fontsUrl;
  }, [fontsUrl]);

  return (
    <div
      className="rounded-xl border-2 border-slate-200 overflow-hidden shadow-inner"
      style={{ backgroundColor: bg, minHeight: "140px" }}
    >
      <div className="p-4 space-y-2">
        <p
          className="font-medium truncate"
          style={{
            color: headingColor,
            fontFamily: `"${fontHeading}", cursive`,
            fontSize: fontSizeHeading,
            lineHeight: 1.1,
          }}
        >
          {coupleNames || "Couple Names"}
        </p>
        <p
          className="text-xs opacity-90 truncate"
          style={{ color: textColor, fontFamily: `"${fontBody}", serif`, fontSize: fontSizeBase }}
        >
          We’re getting married
        </p>
        <div className="pt-2">
          <span
            className="inline-block px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: buttonBg, color: buttonText }}
          >
            RSVP
          </span>
        </div>
      </div>
    </div>
  );
}
