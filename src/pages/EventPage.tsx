import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { recordGuestOpened, getAdminUser } from "../api/client";
import { getThemeStyleTag, getThemeFontsUrl } from "../utils/theme";
import CardViewer from "../components/CardViewer";
import RSVPFlow from "../components/RSVPFlow";
import ScrollReveal from "../components/ScrollReveal.tsx";
import SpotifyPlaylist from "../components/SpotifyPlaylist";
import WeddingInfo from "../components/WeddingInfo";
import WelcomeSection from "../components/WelcomeSection";
import { useEvent } from "../hooks/useEvent";
import { useEventGuest } from "../hooks/useEventGuest";
import { useMetaTags } from "../hooks/useMetaTags";
import { getPageTitle, getBaseUrl } from "../utils/app";
import type { EventConfig } from "../types/event";
import type { Guest } from "../types/event";

const ScrollIndicator: React.FC = () => {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const handleScroll = () => {
      const rsvpSection = document.getElementById("rsvp-section");
      if (rsvpSection) {
        const rect = rsvpSection.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        if (rect.top < windowHeight - 120 && rect.bottom > 80) setShow(false);
        else if (rect.top < windowHeight && rect.bottom < windowHeight + 120) setShow(false);
        else setShow(true);
      } else setShow(true);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30 md:hidden animate-fade-in pointer-events-none">
      <div className="flex flex-col items-center text-black/70">
        <svg className="w-7 h-7 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
        <span className="mt-1 text-xs font-medium">Scroll to continue</span>
      </div>
    </div>
  );
};

/** For public link: no token, so we need guest name from user. We show a gate until they enter name. */
function PublicNameGate({
  onSubmit,
}: {
  onSubmit: (name: string, partnerName: string) => void;
}) {
  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-100 px-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-serif text-black mb-2">Welcome!</h2>
        <p className="text-black/80 mb-6">Enter your name to view the invitation and RSVP.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Your name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Partner / plus-one (optional)</label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Name"
            />
          </div>
          <button
            onClick={() => name.trim() && onSubmit(name.trim(), partnerName.trim())}
            disabled={!name.trim()}
            className="w-full py-3 bg-black text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

const PREVIEW_GUEST: Guest = { id: "preview", token: "preview", name: "Alex", partnerName: "Sam" };

export default function EventPage() {
  const { eventSlug, token } = useParams<{ eventSlug: string; token?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isPreviewMode = searchParams.get("preview") === "1" && !!getAdminUser();
  const { event, loading: eventLoading, error: eventError } = useEvent(eventSlug || null);
  const { guest: apiGuest, loading: guestLoading, error: guestError } = useEventGuest(eventSlug || null, token ?? null);
  const [publicGuest, setPublicGuest] = useState<Guest | null>(null);

  const isDedicated = !!token;
  const guest = isPreviewMode ? PREVIEW_GUEST : isDedicated ? apiGuest : publicGuest;
  const loading = eventLoading || (isDedicated && !isPreviewMode && guestLoading);
  const error = eventError || (isDedicated && !isPreviewMode && guestError);
  const openedRecorded = useRef(false);
  const eventTitle = event?.config?.coupleNames ?? event?.name;
  const shareMeta = event?.config?.shareMeta;
  const metaTitle = shareMeta?.title?.trim() || eventTitle;
  const metaDescription = shareMeta?.description?.trim() || "You're invited — view your invitation and RSVP.";
  const metaUrl =
    typeof window !== "undefined" ? window.location.href : undefined;
  let metaImage = shareMeta?.image?.trim() || undefined;
  // Crawlers (WhatsApp, Twitter, etc.) require og:image to be an absolute URL
  if (metaImage && !/^https?:\/\//i.test(metaImage)) {
    const base = getBaseUrl().replace(/\/$/, "");
    metaImage = base + (metaImage.startsWith("/") ? metaImage : "/" + metaImage);
  }
  useMetaTags(
    metaTitle ? getPageTitle(metaTitle) : "",
    metaTitle ? metaDescription : "",
    { url: metaUrl, image: metaImage }
  );
  useEffect(() => {
    if (isPreviewMode) return;
    if (eventSlug && token && apiGuest && !openedRecorded.current) {
      openedRecorded.current = true;
      recordGuestOpened(eventSlug, token).catch(() => {});
    }
  }, [eventSlug, token, apiGuest, isPreviewMode]);
  useEffect(() => {
    if (eventSlug && !token && !isPreviewMode) {
      const legacyId = new URLSearchParams(window.location.search).get("id");
      if (legacyId) {
        navigate(`/e/${eventSlug}/invite/${legacyId}`, { replace: true });
      }
    }
  }, [eventSlug, token, navigate, isPreviewMode]);

  const config = event?.config as EventConfig | undefined;
  const sec = config?.sections ?? {};
  const show = (key: keyof typeof sec) => sec[key] !== false;
  const fontsUrl = getThemeFontsUrl(config?.theme);

  useEffect(() => {
    if (!fontsUrl) return;
    const id = "event-invitation-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = fontsUrl;
      document.head.appendChild(link);
    } else link.href = fontsUrl;
    return () => { link?.remove(); };
  }, [fontsUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-black">Loading your invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">💌</div>
          <h1 className="text-2xl font-serif text-black mb-4">Invitation Not Found</h1>
          <p className="text-black mb-6">
            We couldn't find your invitation. Please check the link you received or contact the hosts.
          </p>
        </div>
      </div>
    );
  }

  if (!isPreviewMode && isDedicated && !apiGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">💌</div>
          <h1 className="text-2xl font-serif text-black mb-4">Invitation Not Found</h1>
          <p className="text-black">This invite link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (!isPreviewMode && !isDedicated && !publicGuest) {
    return (
      <PublicNameGate
        onSubmit={(name, partnerName) =>
          setPublicGuest({
            id: "",
            token: "",
            name,
            partnerName: partnerName || null,
          })
        }
      />
    );
  }

  const safeConfig = config ?? ({} as EventConfig);
  return (
    <div className="min-h-screen event-invitation">
      <style dangerouslySetInnerHTML={{ __html: getThemeStyleTag(safeConfig.theme) }} />
      <ScrollIndicator />
      {show("welcome") && (
        <ScrollReveal>
          <WelcomeSection config={safeConfig} guest={guest!} />
        </ScrollReveal>
      )}
      {show("cardViewer") && (
        <ScrollReveal>
          <CardViewer config={safeConfig} />
        </ScrollReveal>
      )}
      {show("weddingInfo") && (
        <ScrollReveal>
          <WeddingInfo config={safeConfig} />
        </ScrollReveal>
      )}
      {safeConfig.customParagraph?.trim() && (
        <ScrollReveal>
          <section className="py-16 px-6 bg-primary-100">
            <div className="max-w-2xl mx-auto">
              <div className="rounded-md bg-white px-8 py-10 shadow-lg text-left">
                <p className="text-base md:text-lg text-black/90 leading-loose whitespace-pre-line font-serif max-w-xl mx-auto" style={{ textIndent: "2em" }}>
                  {safeConfig.customParagraph.trim()}
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}
      {show("spotify") && (
        <ScrollReveal>
          <SpotifyPlaylist config={safeConfig} />
        </ScrollReveal>
      )}
      {show("rsvp") && (
        <ScrollReveal>
          <RSVPFlow
            eventSlug={event!.slug}
            config={safeConfig}
            guest={guest!}
            isPublic={!isDedicated}
          />
        </ScrollReveal>
      )}
      <ScrollReveal>
        <footer className="py-8 flex flex-col items-center justify-center gap-1 border-t border-black/10 bg-white/50">
          {safeConfig.footerText?.trim() ? (
            <p className="text-xs text-slate-500 text-center whitespace-pre-line">{safeConfig.footerText.trim()}</p>
          ) : (
            <>
              <a
                href="https://dearguest.link"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors tracking-wide"
              >
                Powered by dearguest.link
              </a>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase">Invitations</span>
            </>
          )}
        </footer>
      </ScrollReveal>
    </div>
  );
}
