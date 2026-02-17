import { useCallback, useRef, useState } from "react";
import type { EventConfig, EventSections, EventTheme } from "../../types/event";
import { INPUT_CLASS, LABEL_CLASS_SM, SECTION_TITLE_CLASS, SECTION_TITLE_CLASS_MUTED } from "./formStyles";
import { ColorField, ThemePreviewCard, FontPreview } from "./ThemeFormParts";
import EventDatesSection from "./EventDatesSection";
import { adminGeneratePalette, adminUploadMoments, adminUploadInvitation } from "../../api/client";
import { Sparkles, Loader2, ImagePlus } from "lucide-react";
import PlaceSearchInput from "./PlaceSearchInput";

function googleMapsSearchUrl(placeName: string, address: string): string {
  const query = [placeName, address].filter(Boolean).join(", ");
  if (!query.trim()) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}

interface EventConfigFormProps {
  config: EventConfig;
  onChange: (config: EventConfig) => void;
  /** When set, Moments section shows upload (up to 5 images) in addition to URL textarea */
  eventSlug?: string;
}

const themeDefaults = {
  primaryColor: "#616161",
  secondaryColor: "#747474",
  backgroundColor: "#f2f2f2",
  textColor: "#000000",
  headingColor: "#000000",
  linkColor: "#616161",
  borderColor: "#000000",
  buttonBgColor: "#000000",
  buttonTextColor: "#ffffff",
} as const;

/** Body fonts offered in the form (suggestions only from this list). */
const BODY_FONTS = ["Cinzel", "Cormorant Garamond", "Lora", "Playfair Display", "Open Sans"] as const;

/** When AI sets a heading font, suggest a body font from BODY_FONTS. */
function suggestBodyFontForHeading(headingFont: string): string {
  const map: Record<string, string> = {
    "Pinyon Script": "Cinzel",
    "Great Vibes": "Cormorant Garamond",
    "Dancing Script": "Lora",
    Cinzel: "Lora",
    "Cormorant Garamond": "Lora",
  };
  return map[headingFont] ?? BODY_FONTS[0];
}

export default function EventConfigForm({ config, onChange, eventSlug }: EventConfigFormProps) {
  const configRef = useRef(config);
  configRef.current = config;

  const setTop = useCallback(
    (key: keyof EventConfig, value: string | undefined) => {
      onChange({ ...config, [key]: value || undefined });
    },
    [config, onChange]
  );

  /** Updates name/address without overwriting other fields (e.g. map link set async). Use for onPlaceSelect. */
  const setPlaceDetails = useCallback(
    (updates: Partial<Pick<EventConfig, "churchName" | "churchAddress" | "venueName" | "venueAddress">>) => {
      onChange({ ...configRef.current, ...updates });
    },
    [onChange]
  );

  const setTheme = useCallback(
    (key: keyof EventTheme, value: string) => {
      onChange({
        ...config,
        theme: { ...config.theme, [key]: value || undefined },
      });
    },
    [config, onChange]
  );

  const setSection = useCallback(
    (key: keyof EventSections, value: boolean) => {
      onChange({
        ...config,
        sections: { ...config.sections, [key]: value },
      });
    },
    [config, onChange]
  );

  const setImages = useCallback(
    (key: "front" | "back" | "envelope", value: string) => {
      onChange({
        ...config,
        images: {
          ...config.images,
          invitation: { ...config.images?.invitation, [key]: value || undefined },
        },
      });
    },
    [config, onChange]
  );

  const setImportantNote = useCallback(
    (index: number, field: "emoji" | "title" | "subtitle" | "href", value: string) => {
      const list = [...(config.importantNotes ?? [{}, {}, {}])];
      while (list.length < 3) list.push({});
      list[index] = { ...list[index], [field]: value || undefined };
      onChange({ ...config, importantNotes: list });
    },
    [config, onChange]
  );

  const setMoments = useCallback(
    (value: string) => {
      const list = value
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      onChange({
        ...config,
        images: { ...config.images, moments: list.length ? list : undefined },
      });
    },
    [config, onChange]
  );

  const appendMomentsUrls = useCallback(
    (urls: string[]) => {
      const current = config.images?.moments ?? [];
      onChange({
        ...config,
        images: { ...config.images, moments: [...current, ...urls] },
      });
    },
    [config, onChange]
  );

  const handleInvitationUpload = useCallback(
    async (field: "envelope" | "front" | "back", file: File) => {
      if (!eventSlug) return;
      setInvitationUploadError(null);
      setInvitationUploading(field);
      try {
        const payload = { [field]: file } as { front?: File; back?: File; envelope?: File };
        const urls = await adminUploadInvitation(eventSlug, payload);
        const url = urls[field];
        if (url) setImages(field, url);
      } catch (err) {
        setInvitationUploadError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setInvitationUploading(null);
      }
    },
    [eventSlug, setImages]
  );

  const [themeWords, setThemeWords] = useState("");
  const [paletteLoading, setPaletteLoading] = useState(false);
  const [paletteError, setPaletteError] = useState<string | null>(null);
  const [momentsUploading, setMomentsUploading] = useState(false);
  const [momentsUploadError, setMomentsUploadError] = useState<string | null>(null);
  const momentsFileInputRef = useRef<HTMLInputElement>(null);
  const [invitationUploading, setInvitationUploading] = useState<"envelope" | "front" | "back" | null>(null);
  const [invitationUploadError, setInvitationUploadError] = useState<string | null>(null);
  const invitationEnvelopeRef = useRef<HTMLInputElement>(null);
  const invitationFrontRef = useRef<HTMLInputElement>(null);
  const invitationBackRef = useRef<HTMLInputElement>(null);

  const sections = config.sections ?? {};
  const section = (k: keyof EventSections, label: string) => (
    <label key={k} className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={sections[k] !== false}
        onChange={(e) => setSection(k, e.target.checked)}
        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );

  const showWeddingInfo = sections.weddingInfo !== false;
  const showSpotify = sections.spotify !== false;
  const showCardViewer = sections.cardViewer !== false;

  return (
    <div className="space-y-6">
      <section>
        <h4 className={SECTION_TITLE_CLASS}>Basics</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS_SM}>Couple names</label>
            <input
              className={INPUT_CLASS}
              value={config.coupleNames ?? ""}
              onChange={(e) => setTop("coupleNames", e.target.value)}
              placeholder="Raphael & Christine"
            />
          </div>
        </div>
      </section>

      <section>
        <h4 className={SECTION_TITLE_CLASS}>Sections to show</h4>
        <p className={SECTION_TITLE_CLASS_MUTED}>Choose which parts of the invitation to display. You only need to fill in details for the sections you enable.</p>
        <div className="flex flex-wrap gap-4">
          {section("welcome", "Welcome")}
          {section("cardViewer", "Card viewer")}
          {section("weddingInfo", "Wedding info")}
          {section("spotify", "Spotify playlist")}
          {section("rsvp", "RSVP")}
        </div>
      </section>

      <EventDatesSection config={config} onChange={onChange} />

      {showWeddingInfo && (
      <>
      <section>
        <h4 className={SECTION_TITLE_CLASS}>Ceremony</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <PlaceSearchInput
              value={config.churchMap ?? ""}
              onChange={(url) => setTop("churchMap", url)}
              onPlaceSelect={(name, address) => {
                setPlaceDetails({ churchName: name || undefined, churchAddress: address || undefined });
              }}
              searchPlaceholder="Search ceremony venue (e.g. St. Maroun's Church, Beirut)"
              fallbackSearchUrl={googleMapsSearchUrl(config.churchName ?? "", config.churchAddress ?? "")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS_SM}>Church / venue name</label>
            <input
              className={INPUT_CLASS}
              value={config.churchName ?? ""}
              onChange={(e) => setTop("churchName", e.target.value)}
              placeholder="St. Maroun's Church (editable; auto-filled when you search above)"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS_SM}>Address</label>
            <input
              className={INPUT_CLASS}
              value={config.churchAddress ?? ""}
              onChange={(e) => setTop("churchAddress", e.target.value)}
              placeholder="Gemmayze, Beirut (editable; auto-filled when you search above)"
            />
          </div>
        </div>
      </section>

      <section>
        <h4 className={SECTION_TITLE_CLASS}>Reception</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <PlaceSearchInput
              value={config.venueMap ?? ""}
              onChange={(url) => setTop("venueMap", url)}
              onPlaceSelect={(name, address) => {
                setPlaceDetails({ venueName: name || undefined, venueAddress: address || undefined });
              }}
              searchPlaceholder="Search reception venue (e.g. Country Lodge)"
              fallbackSearchUrl={googleMapsSearchUrl(config.venueName ?? "", config.venueAddress ?? "")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS_SM}>Venue name</label>
            <input
              className={INPUT_CLASS}
              value={config.venueName ?? ""}
              onChange={(e) => setTop("venueName", e.target.value)}
              placeholder="Country Lodge (editable; auto-filled when you search above)"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS_SM}>Address</label>
            <input
              className={INPUT_CLASS}
              value={config.venueAddress ?? ""}
              onChange={(e) => setTop("venueAddress", e.target.value)}
              placeholder="Editable; auto-filled when you search above"
            />
          </div>
        </div>
      </section>

      <section>
        <h4 className={SECTION_TITLE_CLASS}>Parents & names</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLASS_SM}>Groom father</label>
            <input className={INPUT_CLASS} value={config.groomFatherName ?? ""} onChange={(e) => setTop("groomFatherName", e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLASS_SM}>Groom mother</label>
            <input className={INPUT_CLASS} value={config.groomMotherName ?? ""} onChange={(e) => setTop("groomMotherName", e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLASS_SM}>Groom last name</label>
            <input className={INPUT_CLASS} value={config.groomLastName ?? ""} onChange={(e) => setTop("groomLastName", e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLASS_SM}>Bride father</label>
            <input className={INPUT_CLASS} value={config.brideFatherName ?? ""} onChange={(e) => setTop("brideFatherName", e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLASS_SM}>Bride mother</label>
            <input className={INPUT_CLASS} value={config.brideMotherName ?? ""} onChange={(e) => setTop("brideMotherName", e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLASS_SM}>Bride last name</label>
            <input className={INPUT_CLASS} value={config.brideLastName ?? ""} onChange={(e) => setTop("brideLastName", e.target.value)} />
          </div>
        </div>
      </section>

      <section>
        <h4 className={SECTION_TITLE_CLASS}>Contact</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLASS_SM}>Groom phone</label>
            <input className={INPUT_CLASS} value={config.groomPhoneNumber ?? ""} onChange={(e) => setTop("groomPhoneNumber", e.target.value)} placeholder="9613412428" />
          </div>
          <div>
            <label className={LABEL_CLASS_SM}>Bride phone</label>
            <input className={INPUT_CLASS} value={config.bridePhoneNumber ?? ""} onChange={(e) => setTop("bridePhoneNumber", e.target.value)} placeholder="96176512968" />
          </div>
        </div>
      </section>

      <section>
        <h4 className={SECTION_TITLE_CLASS}>Important notes (3 boxes)</h4>
        <p className={SECTION_TITLE_CLASS_MUTED}>Customize emoji, title, and subtitle for each box. Add a link URL to make the subtitle clickable.</p>
        <div className="grid gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className={LABEL_CLASS_SM}>Box {i + 1} — Emoji</label>
              <input
                className={INPUT_CLASS}
                value={config.importantNotes?.[i]?.emoji ?? ""}
                onChange={(e) => setImportantNote(i, "emoji", e.target.value)}
                placeholder={i === 0 ? "🪩" : i === 1 ? "🚗" : "📱"}
              />
              <label className={LABEL_CLASS_SM}>Title</label>
              <input
                className={INPUT_CLASS}
                value={config.importantNotes?.[i]?.title ?? ""}
                onChange={(e) => setImportantNote(i, "title", e.target.value)}
                placeholder={i === 0 ? "Get Ready" : i === 1 ? "Parking" : "Contact"}
              />
              <label className={LABEL_CLASS_SM}>Subtitle</label>
              <input
                className={INPUT_CLASS}
                value={config.importantNotes?.[i]?.subtitle ?? ""}
                onChange={(e) => setImportantNote(i, "subtitle", e.target.value)}
                placeholder={i === 0 ? "Come ready to dance!" : i === 1 ? "Free parking at venue" : "Questions? Call us"}
              />
              <label className={LABEL_CLASS_SM}>Link URL (optional)</label>
              <input
                type="url"
                className={INPUT_CLASS}
                value={config.importantNotes?.[i]?.href ?? ""}
                onChange={(e) => setImportantNote(i, "href", e.target.value)}
                placeholder="https://..."
              />
            </div>
          ))}
        </div>
      </section>
      </>
      )}

      {(showSpotify || showCardViewer) && (
      <section>
        <h4 className={SECTION_TITLE_CLASS}>Media</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {showSpotify && (
          <div>
            <label className={LABEL_CLASS_SM}>Spotify playlist ID</label>
            <input className={INPUT_CLASS} value={config.spotifyId ?? ""} onChange={(e) => setTop("spotifyId", e.target.value)} placeholder="7iAcEvZJNEY6y4HvVtqfpD" />
          </div>
          )}
          {showCardViewer && (
          <>
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS_SM}>Invitation images (URLs or upload)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["envelope", "front", "back"] as const).map((field) => (
                <div key={field}>
                  <div className="flex gap-2 items-center">
                    <input
                      className={INPUT_CLASS + " flex-1 min-w-0"}
                      value={config.images?.invitation?.[field] ?? ""}
                      onChange={(e) => setImages(field, e.target.value)}
                      placeholder={field === "envelope" ? "Envelope URL" : field === "front" ? "Front URL" : "Back URL"}
                    />
                    {eventSlug && (
                      <>
                        <input
                          ref={field === "envelope" ? invitationEnvelopeRef : field === "front" ? invitationFrontRef : invitationBackRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) await handleInvitationUpload(field, file);
                          }}
                        />
                        <button
                          type="button"
                          disabled={!!invitationUploading}
                          onClick={() => (field === "envelope" ? invitationEnvelopeRef : field === "front" ? invitationFrontRef : invitationBackRef).current?.click()}
                          className="shrink-0 inline-flex items-center gap-1 px-2 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                          title={`Upload ${field}`}
                        >
                          {invitationUploading === field ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {invitationUploadError && (
              <p className="mt-1 text-sm text-red-600">{invitationUploadError}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS_SM}>Moments (one URL per line, or upload up to 5 images)</label>
            <textarea
              className={INPUT_CLASS}
              rows={3}
              value={(config.images?.moments ?? []).join("\n")}
              onChange={(e) => setMoments(e.target.value)}
              placeholder="/moments/photo1.jpg"
            />
            {eventSlug && (
              <div className="mt-2">
                <input
                  ref={momentsFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []).slice(0, 5);
                    e.target.value = "";
                    if (files.length === 0) return;
                    setMomentsUploadError(null);
                    setMomentsUploading(true);
                    try {
                      const { urls } = await adminUploadMoments(eventSlug, files);
                      appendMomentsUrls(urls);
                    } catch (err) {
                      setMomentsUploadError(err instanceof Error ? err.message : "Upload failed");
                    } finally {
                      setMomentsUploading(false);
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={momentsUploading}
                  onClick={() => momentsFileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {momentsUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImagePlus className="w-4 h-4" />
                  )}
                  {momentsUploading ? "Uploading…" : "Upload up to 5 images"}
                </button>
                {momentsUploadError && (
                  <p className="mt-1 text-sm text-red-600">{momentsUploadError}</p>
                )}
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </section>
      )}

      <section>
        <h4 className={SECTION_TITLE_CLASS}>Theme & appearance</h4>
        <p className={SECTION_TITLE_CLASS_MUTED}>Preview updates as you change colors and fonts.</p>

        <div className="mb-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <label className={LABEL_CLASS_SM}>Generate palette from words</label>
          <p className="text-xs text-slate-500 mb-2">Describe your theme (e.g. &quot;gold and rose&quot;, &quot;forest green and ivory&quot;) and we&apos;ll suggest a full color palette.</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              className={INPUT_CLASS + " flex-1 min-w-[200px]"}
              value={themeWords}
              onChange={(e) => { setThemeWords(e.target.value); setPaletteError(null); }}
              placeholder="e.g. gold and rose"
              disabled={paletteLoading}
            />
            <button
              type="button"
              disabled={paletteLoading || !themeWords.trim()}
              onClick={async () => {
                setPaletteError(null);
                setPaletteLoading(true);
                try {
                  const { palette } = await adminGeneratePalette(themeWords);
                  const themePatch = { ...palette };
                  if (themePatch.fontHeading) {
                    themePatch.fontBody = suggestBodyFontForHeading(themePatch.fontHeading);
                  }
                  onChange({
                    ...config,
                    theme: { ...config.theme, ...themePatch },
                  });
                } catch (e) {
                  setPaletteError(e instanceof Error ? e.message : "Failed to generate palette");
                } finally {
                  setPaletteLoading(false);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none"
            >
              {paletteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {paletteLoading ? "Generating…" : "Generate palette"}
            </button>
          </div>
          {paletteError && (
            <p className="mt-2 text-sm text-red-600">{paletteError}</p>
          )}
        </div>

        <div className="mb-4">
          <ThemePreviewCard theme={config.theme} coupleNames={config.coupleNames || "Couple Names"} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ColorField label="Primary" value={config.theme?.primaryColor} defaultValue={themeDefaults.primaryColor} onChange={(v) => setTheme("primaryColor", v)} />
          <ColorField label="Secondary" value={config.theme?.secondaryColor} defaultValue={themeDefaults.secondaryColor} onChange={(v) => setTheme("secondaryColor", v)} />
          <ColorField label="Background" value={config.theme?.backgroundColor} defaultValue={themeDefaults.backgroundColor} onChange={(v) => setTheme("backgroundColor", v)} />
          <ColorField label="Body text" value={config.theme?.textColor} defaultValue={themeDefaults.textColor} onChange={(v) => setTheme("textColor", v)} />
          <ColorField label="Heading" value={config.theme?.headingColor} defaultValue={themeDefaults.headingColor} onChange={(v) => setTheme("headingColor", v)} />
          <ColorField label="Links" value={config.theme?.linkColor} defaultValue={themeDefaults.linkColor} onChange={(v) => setTheme("linkColor", v)} />
          <ColorField label="Border" value={config.theme?.borderColor} defaultValue={themeDefaults.borderColor} onChange={(v) => setTheme("borderColor", v)} />
          <ColorField label="Button bg" value={config.theme?.buttonBgColor} defaultValue={themeDefaults.buttonBgColor} onChange={(v) => setTheme("buttonBgColor", v)} />
          <ColorField label="Button text" value={config.theme?.buttonTextColor} defaultValue={themeDefaults.buttonTextColor} onChange={(v) => setTheme("buttonTextColor", v)} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLASS_SM}>Heading font</label>
            <input className={INPUT_CLASS} value={config.theme?.fontHeading ?? ""} onChange={(e) => setTheme("fontHeading", e.target.value)} placeholder="Pinyon Script" list="font-heading" />
            <FontPreview fontName={config.theme?.fontHeading ?? "Pinyon Script"} sampleText="Couple Names" className="mt-1" />
            <datalist id="font-heading">
              <option value="Pinyon Script" /><option value="Great Vibes" /><option value="Dancing Script" /><option value="Cinzel" /><option value="Cormorant Garamond" />
            </datalist>
          </div>
          <div>
            <label className={LABEL_CLASS_SM}>Body font</label>
            <input className={INPUT_CLASS} value={config.theme?.fontBody ?? ""} onChange={(e) => setTheme("fontBody", e.target.value)} placeholder="Cinzel" list="font-body" />
            <FontPreview fontName={config.theme?.fontBody ?? "Cinzel"} sampleText="We're getting married" className="mt-1" />
            <datalist id="font-body">
              <option value="Cinzel" /><option value="Cormorant Garamond" /><option value="Lora" /><option value="Playfair Display" /><option value="Open Sans" />
            </datalist>
          </div>
          <div>
            <label className={LABEL_CLASS_SM}>Base font size</label>
            <input className={INPUT_CLASS} value={config.theme?.fontSizeBase ?? ""} onChange={(e) => setTheme("fontSizeBase", e.target.value)} placeholder="1rem" />
          </div>
          <div>
            <label className={LABEL_CLASS_SM}>Heading font size</label>
            <input className={INPUT_CLASS} value={config.theme?.fontSizeHeading ?? ""} onChange={(e) => setTheme("fontSizeHeading", e.target.value)} placeholder="4rem" />
          </div>
        </div>
      </section>

      <section>
        <h4 className={SECTION_TITLE_CLASS}>Custom copy</h4>
        <div className="grid gap-2 sm:grid-cols-1">
          <div>
            <label className={LABEL_CLASS_SM}>Welcome tagline (under couple name)</label>
            <input className={INPUT_CLASS} value={config.welcomeTagline ?? ""} onChange={(e) => setTop("welcomeTagline", e.target.value)} placeholder="We're getting married!" />
          </div>
          <div>
            <label className={LABEL_CLASS_SM}>Custom paragraph (optional)</label>
            <p className="text-xs text-slate-500 mb-1">Free-form text with emojis, shown on the invitation. Use new lines as you like. Long messages are supported.</p>
            <textarea
              className={INPUT_CLASS}
              rows={6}
              value={config.customParagraph ?? ""}
              onChange={(e) => setTop("customParagraph", e.target.value)}
              placeholder="e.g. We can't wait to celebrate with you! ✨💒"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
