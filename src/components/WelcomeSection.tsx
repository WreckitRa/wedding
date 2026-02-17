import React from "react";
import type { Guest } from "../types/event";
import type { EventConfig } from "../types/event";
import FloatingCountdown from "./FloatingCountdown";

interface WelcomeSectionProps {
  config: EventConfig;
  guest: Guest;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ config, guest }) => {
  const weddingDate = config.weddingDate || config.date || "";
  const getGreeting = () => {
    if (guest.partnerName) {
      return `Hey ${guest.name}! We'd love for you and ${guest.partnerName} to join us as we say "I do" on ${weddingDate}! 💍✨`;
    }
    return `Hey ${guest.name}! We'd love for you to join us as we say "I do" on ${weddingDate}! 💍✨`;
  };

  const groomParents = [config.groomFatherName, config.groomMotherName].filter(Boolean).map((s) => (s ?? "").trim()).filter(Boolean);
  const brideParents = [config.brideFatherName, config.brideMotherName].filter(Boolean).map((s) => (s ?? "").trim()).filter(Boolean);
  const groomLine = groomParents.length > 0 ? `son of ${groomParents.length >= 2 ? `${groomParents[0]} and ${groomParents[1]}` : groomParents[0]} ${(config.groomLastName ?? "").trim()}`.trim() : (config.groomLastName ?? "").trim();
  const brideLine = brideParents.length > 0 ? `daughter of ${brideParents.length >= 2 ? `${brideParents[0]} and ${brideParents[1]}` : brideParents[0]} ${(config.brideLastName ?? "").trim()}`.trim() : (config.brideLastName ?? "").trim();
  const showParentLines = groomLine || brideLine;

  return (
    <section className="min-h-screen flex items-center justify-center bg-primary-100 overflow-hidden relative">
      <div className="z-10 text-center max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl text-black bg-clip-text mb-2">
            {config.coupleNames}
          </h1>
          {config.welcomeTagline && (
            <p className="text-lg md:text-xl text-black/80 mb-4">{config.welcomeTagline}</p>
          )}

          {showParentLines && (
            <>
              <div className="flex justify-between uppercase mb-4">
                {groomLine && <div>{groomLine}</div>}
                {groomLine && brideLine && <div className="flex-1" />}
                {brideLine && <div>{brideLine}</div>}
              </div>
              <div className="w-24 h-0.5 bg-gradient-to-r bg-black mx-auto mb-8"></div>
            </>
          )}
          {!showParentLines && <div className="w-24 h-0.5 bg-gradient-to-r bg-black mx-auto mb-8"></div>}
        </div>

        <div className=" p-8 md:p-12">
          <p className="text-xl md:text-2xl text-black font-light">
            {getGreeting()}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <FloatingCountdown config={config} />
            {/* <button
              onClick={() =>
                document
                  .getElementById("card-viewer")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-8 py-3 bg-black text-white rounded-md font-medium hover:bg-primary-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              View Invitation
            </button> */}
            {/* <button
              onClick={() =>
                document
                  .getElementById("rsvp-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-8 py-3 bg-white text-black rounded-md font-medium border-2 border-black hover:border-primary-700  transform hover:text-primary-700 hover:scale-105 transition-all duration-300"
            >
              RSVP Now
            </button> */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
