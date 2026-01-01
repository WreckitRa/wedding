import React from "react";
import type { Guest } from "../hooks/useGuest";
import wedding from "../data/wedding.json";
import FloatingCountdown from "./FloatingCountdown";

interface WelcomeSectionProps {
  guest: Guest;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ guest }) => {
  const getGreeting = () => {
    if (guest.partnerName) {
      return `Hey ${guest.name}! We'd love for you and ${guest.partnerName} to join us as we say "I do" on ${wedding.weddingDate}! 💍✨`;
    }
    return `Hey ${guest.name}! We'd love for you to join us as we say "I do" on ${wedding.weddingDate}! 💍✨`;
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-primary-100 overflow-hidden relative">
      <div className="z-10 text-center max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl text-black bg-clip-text mb-2">
            {wedding.coupleNames}
          </h1>

          <div className="flex justify-between uppercase mb-4">
            <div>
              son of {wedding.groomFatherName} and {wedding.groomMotherName}{" "}
              {wedding.groomLastName}
            </div>
            <div>
              daughter of {wedding.brideFatherName} and{" "}
              {wedding.brideMotherName} {wedding.brideLastName}
            </div>
          </div>
          <div className="w-24 h-0.5 bg-gradient-to-r bg-black mx-auto mb-8"></div>
        </div>

        <div className=" p-8 md:p-12">
          <p className="text-xl md:text-2xl text-black font-light">
            {getGreeting()}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <FloatingCountdown />
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
