import { useEffect } from "react";
import type { EventConfig, Guest } from "../../types/event";
import { getThemeStyleTag, getThemeFontsUrl } from "../../utils/theme";
import WelcomeSection from "../WelcomeSection";
import CardViewer from "../CardViewer";
import WeddingInfo from "../WeddingInfo";

const PREVIEW_GUEST: Guest = { id: "preview", token: "preview", name: "Alex", partnerName: "Sam" };

interface InvitationPreviewProps {
  config: EventConfig;
}

/** Renders the invitation as guests see it (welcome, card, wedding info, custom paragraph, footer). Used alongside edit form. */
export default function InvitationPreview({ config }: InvitationPreviewProps) {
  const fontsUrl = getThemeFontsUrl(config.theme);
  const sec = config.sections ?? {};
  const show = (key: keyof typeof sec) => sec[key] !== false;

  useEffect(() => {
    if (!fontsUrl) return;
    const id = "invitation-preview-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = fontsUrl;
      document.head.appendChild(link);
    } else link.href = fontsUrl;
    return () => {
      link?.remove();
    };
  }, [fontsUrl]);

  return (
    <div className="flex justify-center">
      <div className="relative rounded-[2rem] border-[10px] border-slate-800 bg-slate-800 shadow-xl overflow-hidden" style={{ width: 375 }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-10" aria-hidden />
        <div className="bg-white rounded-[1.25rem] overflow-hidden" style={{ minHeight: 600 }}>
          <div className="event-invitation w-[375px] min-h-[600px] max-h-[70vh] overflow-y-auto overscroll-contain">
            <style dangerouslySetInnerHTML={{ __html: getThemeStyleTag(config.theme) }} />
            {show("welcome") && <WelcomeSection config={config} guest={PREVIEW_GUEST} />}
            {show("cardViewer") && <CardViewer config={config} />}
            {show("weddingInfo") && <WeddingInfo config={config} />}
            {config.customParagraph?.trim() && (
              <section className="py-12 px-6 bg-primary-100">
                <div className="max-w-2xl mx-auto">
                  <div className="rounded-md bg-white px-6 py-8 shadow-lg text-left">
                    <p className="text-sm md:text-base text-black/90 leading-loose whitespace-pre-line font-serif" style={{ textIndent: "2em" }}>
                      {config.customParagraph.trim()}
                    </p>
                  </div>
                </div>
              </section>
            )}
            <footer className="py-6 flex flex-col items-center justify-center gap-0.5 border-t border-black/10 bg-white/50">
              <a
                href="https://dearguest.link"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-slate-700 tracking-wide"
              >
                Powered by dearguest.link
              </a>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase">Invitations</span>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
