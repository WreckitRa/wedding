import React, { useState, useEffect, useMemo } from "react";
import type { Guest } from "../types/event";
import type { EventConfig } from "../types/event";
import { submitRSVP, checkRSVPStatus } from "../api/client";
import { Loader2 } from "lucide-react";

interface RSVPFlowProps {
  eventSlug: string;
  config: EventConfig;
  guest: Guest;
  isPublic?: boolean;
}

interface RSVPData {
  attendance: "yes" | "no" | "";
  extraGuests: number;
  favoriteSongs: [string, string];
  reaction: string;
  message: string;
}

const RSVPFlow: React.FC<RSVPFlowProps> = ({ eventSlug, config, guest, isPublic }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [rsvpData, setRsvpData] = useState<RSVPData>({
    attendance: "",
    extraGuests: 0,
    favoriteSongs: ["", ""],
    reaction: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAlreadyRSVPd, setHasAlreadyRSVPd] = useState<boolean | null>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<
    Array<{ id: number; emoji: string; left: number }>
  >([]);
  const [emojiIdCounter, setEmojiIdCounter] = useState(0);
  const [isNoSubmitting, setIsNoSubmitting] = useState(false);
  const nextButtonRef = React.useRef<HTMLButtonElement>(null);
  const [showRSVPScrollIndicator, setShowRSVPScrollIndicator] = useState(true);
  const [atRSVPBottom, setAtRSVPBottom] = useState(false);
  const rsvpSectionRef = React.useRef<HTMLDivElement>(null);

  const guestId = guest.id || null;

  useEffect(() => {
    if (isPublic || !guestId) {
      setHasAlreadyRSVPd(false);
      return;
    }
    checkRSVPStatus(eventSlug, guestId).then(setHasAlreadyRSVPd);
  }, [eventSlug, guestId, isPublic]);

  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (path.startsWith("/")) return path;
    const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "";
    return base ? `${base}/${path.replace(/^\//, "")}` : `/${path.replace(/^\//, "")}`;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reactions = ["❤️", "🥳", "🎉", "🥰", "😍", "🤵", "👰", "💐"];

  // Floating emoji animation
  const handleEmojiClick = (emoji: string) => {
    setRsvpData((prev) => ({ ...prev, reaction: emoji }));

    const newEmojis = Array.from({ length: 5 }, (_, i) => ({
      id: emojiIdCounter + i,
      emoji: emoji,
      left: Math.random() * 80 + 10,
    }));

    setEmojiIdCounter((prev) => prev + 5);
    setFloatingEmojis((prev) => [...prev, ...newEmojis]);

    setTimeout(() => {
      setFloatingEmojis((prev) =>
        prev.filter((e) => !newEmojis.find((ne) => ne.id === e.id))
      );
    }, 3000);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRsvpData((prev) => ({ ...prev, message: e.target.value }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      if (currentStep === 1 && rsvpData.attendance === "no") {
        setIsNoSubmitting(true);
        handleSubmit().finally(() => setIsNoSubmitting(false));
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitRSVP(eventSlug, {
        guestId: guestId || undefined,
        guestName: guest.name,
        partnerName: guest.partnerName || undefined,
        attendance: rsvpData.attendance as "yes" | "no",
        extraGuests: rsvpData.extraGuests,
        favoriteSongs: rsvpData.favoriteSongs,
        reaction: rsvpData.reaction,
        message: rsvpData.message,
      });
      setIsSubmitted(true);
    } catch {
      // could show toast
    } finally {
      setIsSubmitting(false);
    }
  };

  // Scroll to center the card when thank you message appears
  useEffect(() => {
    if (isSubmitted) {
      const rsvpSection = document.getElementById("rsvp-section");
      if (rsvpSection) {
        rsvpSection.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [isSubmitted]);

  useEffect(() => {
    const handleScroll = () => {
      if (!rsvpSectionRef.current) return;
      const rect = rsvpSectionRef.current.getBoundingClientRect();
      const windowHeight =
        window.innerHeight || document.documentElement.clientHeight;
      // Show indicator if top of RSVP section is visible and not at bottom
      setShowRSVPScrollIndicator(
        rect.top < windowHeight - 80 && rect.bottom - 40 > windowHeight
      );
      // At bottom if bottom of RSVP section is in view
      setAtRSVPBottom(rect.bottom <= windowHeight + 10);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // initial
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              step === currentStep
                ? "bg-primary-500 text-white"
                : step < currentStep
                ? "bg-green-500 text-white"
                : "bg-primary-200 text-primary-600"
            }`}
          >
            {step < currentStep ? "✓" : step}
          </div>
          {step < 3 && (
            <div
              className={`w-16 h-0.5 ${
                step < currentStep ? "bg-green-500" : "bg-gray-200"
              }`}
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const Step1 = () => (
    <div className="space-y-6">
      <h3 className="text-2xl text-center text-black mb-6">
        Will you be celebrating with us? 🎉
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => {
            setRsvpData({ ...rsvpData, attendance: "yes" });
            setTimeout(() => {
              nextButtonRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }, 100);
          }}
          className={`p-6 rounded-md border-2 transition-all group ${
            rsvpData.attendance === "yes"
              ? "border-green-500 bg-green-50 text-green-700"
              : "border-gray-200 hover:border-green-300"
          }`}
        >
          <div className="text-3xl mb-2 group-hover:hidden">✅</div>
          <div className="text-3xl mb-2 hidden group-hover:block">😃</div>
          <div className="font-medium">Yes, wouldn't miss it! 😍</div>
        </button>

        <button
          onClick={() => {
            setRsvpData({ ...rsvpData, attendance: "no" });
            setTimeout(() => {
              nextButtonRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }, 100);
          }}
          className={`p-6 rounded-md border-2 transition-all group ${
            rsvpData.attendance === "no"
              ? "border-red-500 bg-red-50 text-red-700"
              : "border-gray-200 hover:border-red-300"
          }`}
        >
          <div className="text-3xl mb-2 group-hover:hidden">❌</div>
          <div className="text-3xl mb-2 hidden group-hover:block">😢</div>
          <div className="font-medium">Ahh no, can't make it 💔</div>
        </button>
      </div>

      {rsvpData.attendance && (
        <div className="flex flex-col items-center mt-4 animate-fade-in">
          <span className="text-primary-700 font-medium flex items-center gap-2">
            Click <span className="font-bold">Next</span> to continue
            <svg
              className="w-5 h-5 animate-bounce"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 13l-5 5m0 0l-5-5m5 5V6"
              />
            </svg>
          </span>
        </div>
      )}

      {rsvpData.attendance === "yes" && (guest.maxExtraGuests || 0) > 0 && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-black mb-2">
            Total attendees (1 + ?)
          </label>
          <select
            value={rsvpData.extraGuests}
            onChange={(e) =>
              setRsvpData({
                ...rsvpData,
                extraGuests: parseInt(e.target.value),
              })
            }
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            {Array.from({ length: (guest.maxExtraGuests || 0) + 1 }, (_, i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  const Step2 = useMemo(() => {
    const handleFirstSongChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setRsvpData((prev) => ({
        ...prev,
        favoriteSongs: [e.target.value, prev.favoriteSongs[1]],
      }));
    };

    const handleSecondSongChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setRsvpData((prev) => ({
        ...prev,
        favoriteSongs: [prev.favoriteSongs[0], e.target.value],
      }));
    };

    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-serif text-center text-black mb-2">
          Help us set the vibe! 🎧
        </h3>
        <p className="text-center text-sm text-gray-500 mb-6">(Optional)</p>
        <p className="text-center text-blackmb-6">
          Drop 2 songs you need to dance to!
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              First Jam 🎵
            </label>
            <input
              type="text"
              placeholder="Artist - Song Title"
              value={rsvpData.favoriteSongs[0]}
              onChange={handleFirstSongChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Second Bop 🎶
            </label>
            <input
              type="text"
              placeholder="Artist - Song Title"
              value={rsvpData.favoriteSongs[1]}
              onChange={handleSecondSongChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>
    );
  }, [rsvpData.favoriteSongs]);

  const Step3 = useMemo(() => {
    const FloatingEmojis = () => (
      <div className="absolute bottom-full left-0 right-0 h-32 pointer-events-none overflow-hidden">
        {floatingEmojis.map(({ id, emoji, left }) => (
          <div
            key={id}
            className="floating-emoji absolute bottom-0"
            style={{ left: `${left}%` }}
          >
            {emoji}
          </div>
        ))}
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl text-black mb-2">
            A little note from {config.coupleNames} 💌
          </h3>
          <p className="text-primary-700 italic">
            "We can't wait to dance, laugh, and celebrate with you, thanks for
            being part of our love story!"
          </p>
        </div>

        {/* Photo Gallery */}
        {config.images?.moments && config.images.moments.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-black mb-3">
            Moments we adore 💫
          </h4>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {config.images.moments.map((photo, index) => (
              <img
                key={index}
                src={getImageUrl(photo)}
                alt={`Couple photo ${index + 1}`}
                className="w-32 h-24 object-cover rounded-md flex-shrink-0 hover:scale-105 transition-transform cursor-pointer"
              />
            ))}
          </div>
        </div>
        )}

        {/* Reaction Bar */}
        <div className="mb-6 relative">
          <h4 className="text-lg font-medium text-black mb-3">
            How are you feeling?
          </h4>

          <FloatingEmojis />

          <div className="flex flex-wrap gap-2">
            {reactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className={`text-2xl p-3 rounded-md transition-all ${
                  rsvpData.reaction === emoji
                    ? "bg-primary-100 scale-125"
                    : "hover:bg-gray-100 hover:scale-110"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Message Area */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Leave us a little love note (optional) 💬
          </label>
          <textarea
            value={rsvpData.message}
            onChange={handleMessageChange}
            placeholder="Share your excitement, memories, or well wishes..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        </div>
      </div>
    );
  }, [
    reactions,
    rsvpData.message,
    rsvpData.reaction,
    handleEmojiClick,
    floatingEmojis,
  ]);

  return (
    <section
      id="rsvp-section"
      className="py-20 bg-primary-100 relative"
      ref={rsvpSectionRef}
    >
      {/* RSVP Scroll Indicator (mobile only) */}
      {showRSVPScrollIndicator && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30 md:hidden animate-fade-in pointer-events-none">
          <div className="flex flex-col items-center text-black/70">
            <svg
              className="w-7 h-7 animate-bounce"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 13l-5 5m0 0l-5-5m5 5V6"
              />
            </svg>
            <span className="mt-1 text-xs font-medium">Scroll for more</span>
          </div>
        </div>
      )}
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-md shadow-xl p-8 md:p-12">
          {hasAlreadyRSVPd === null ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg text-black">Checking your RSVP status...</p>
            </div>
          ) : hasAlreadyRSVPd ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-6">💌</div>
              <h2 className="text-3xl font-serif text-black mb-4">
                You've Already RSVP'd!
              </h2>
              <p className="text-lg text-black">
                Thank you for letting us know. We've got your response and can't
                wait to celebrate!
              </p>
            </div>
          ) : !isSubmitted ? (
            <>
              <StepIndicator />

              {config.rsvpDeadline && (
                <div className="text-center bg-primary-50 p-4 rounded-lg mb-8 border border-primary-200">
                  <p className="font-medium text-primary-700">
                    Kindly RSVP by {config.rsvpDeadline} so we can get a
                    headcount!
                  </p>
                </div>
              )}

              <div className="min-h-[400px]">
                {currentStep === 1 && <Step1 />}
                {currentStep === 2 && Step2}
                {currentStep === 3 && Step3}
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className={`px-6 py-3 rounded-md font-medium transition-all ${
                    currentStep === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-primary-700 text-white hover:bg-gray-300"
                  }`}
                >
                  Previous
                </button>

                {currentStep < 3 ? (
                  <button
                    ref={currentStep === 1 ? nextButtonRef : undefined}
                    onClick={handleNext}
                    disabled={
                      currentStep === 1 &&
                      (!rsvpData.attendance || isNoSubmitting)
                    }
                    className={`px-6 py-3 rounded-md font-medium transition-all flex ${
                      currentStep === 1 &&
                      (!rsvpData.attendance || isNoSubmitting)
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-black text-white hover:bg-primary-700 animate-pulse"
                    }`}
                  >
                    {isNoSubmitting ? (
                      <>
                        <Loader2 className="animate-spin mr-3" />
                        Submitting...
                      </>
                    ) : (
                      "Next"
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-black text-white rounded-md font-medium hover:bg-primary-700 transition-all disabled:bg-primary-300 disabled:cursor-not-allowed flex gap-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin mr-3" />
                        Submitting...
                      </>
                    ) : (
                      "Submit RSVP"
                    )}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl font-serif text-black mb-4">
                Thank you for your RSVP!
              </h2>

              {rsvpData.attendance === "yes" && (
                <>
                  <p className="text-lg text-black mb-6">
                    We're counting down the days to celebrate together! 💕
                  </p>
                  <p className="text-black font-medium">
                    We can't wait to hug, laugh, and party with you on{" "}
                    {config.weddingDate}! 🥂
                  </p>
                </>
              )}
              {rsvpData.attendance === "no" && (
                <p className="text-black">
                  We'll miss you for sure—but thank you for letting us know ❤️
                </p>
              )}
              {atRSVPBottom && (
                <div className="mt-8 animate-fade-in">
                  <span className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full font-semibold shadow">
                    You've reached the end! 🎊
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RSVPFlow;
