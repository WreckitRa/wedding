import React, { useState } from "react";
import wedding from "../data/wedding.json";

const images = [
  {
    src: `${import.meta.env.BASE_URL}${wedding.images.invitation.envelope}`,
    label: "Envelope",
  },
  {
    src: `${import.meta.env.BASE_URL}${wedding.images.invitation.front}`,
    label: "Front",
  },
  {
    src: `${import.meta.env.BASE_URL}${wedding.images.invitation.back}`,
    label: "Back",
  },
];

type Stage = 0 | 1 | 2;

type Animation = null | "slide-left" | "slide-right" | "flip";

const CardViewer: React.FC = () => {
  const [stage, setStage] = useState<Stage>(0);
  const [animating, setAnimating] = useState<Animation>(null);
  const [nextStage, setNextStage] = useState<Stage>(0);

  const handleCardTap = () => {
    if (animating) return;
    if (stage === 0) {
      setNextStage(1);
      setAnimating("slide-left");
      setTimeout(() => {
        setStage(1);
        setAnimating(null);
      }, 400);
    } else if (stage === 1) {
      setNextStage(2);
      setAnimating("flip");
      setTimeout(() => {
        setStage(2);
        setAnimating(null);
      }, 500);
    } else if (stage === 2) {
      setNextStage(0);
      setAnimating("slide-right");
      setTimeout(() => {
        setStage(0);
        setAnimating(null);
      }, 400);
    }
  };

  const getCardClass = (idx: Stage) => {
    if (animating === null)
      return idx === stage
        ? "z-10 opacity-100"
        : "z-0 opacity-0 pointer-events-none";
    if (stage === 0 && nextStage === 1) {
      if (idx === 0) return "z-20 animate-slideOutLeft";
      if (idx === 1) return "z-10 animate-slideInRight";
      return "z-0 opacity-0 pointer-events-none";
    }
    if (stage === 1 && nextStage === 2) {
      if (idx === 1) return "z-20 flip-card flip-front flipping";
      if (idx === 2) return "z-10 flip-card flip-back flipping";
      return "z-0 opacity-0 pointer-events-none";
    }

    if (stage === 2 && nextStage === 0) {
      if (idx === 2) return "z-20 animate-slideOutRight";
      if (idx === 0) return "z-10 animate-slideInLeft";
      return "z-0 opacity-0 pointer-events-none";
    }
    return idx === stage
      ? "z-10 opacity-100"
      : "z-0 opacity-0 pointer-events-none";
  };

  return (
    <section
      id="card-viewer"
      className="bg-secondary-100 min-h-screen py-20 flex flex-col items-center justify-center"
    >
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif text-black mb-4">
            Your Invitation
          </h2>
          <p className="text-lg text-black max-w-2xl mx-auto uppercase">
            Tap or click the card to flip
          </p>
        </div>

        <style>{`
        .card-viewer-container {
          position: relative;
          perspective: 1200px;
          
          /* --- Responsive Scaling --- */
          /* Default (Portrait) */
          width: 85vw;
          aspect-ratio: 332 / 469;
          max-width: 469px; /* Cap size on large portrait screens */
        }

        @media (orientation: landscape) {
          .card-viewer-container {

            width: auto;
            height: 80vh;
            max-width: none; /* Unset portrait max-width */
            max-height: 500px; /* Cap size on large landscape screens */
          }
        }

        .card-img {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 1rem;
          box-shadow: 0 4px 24px 0 rgba(0,0,0,0.10);
          background: white;
          cursor: pointer;
          transition: opacity 0.2s;
          transform: translateZ(0);
        }
        .animate-slideOutLeft {
          animation: slideOutLeft 0.4s forwards;
        }
        .animate-slideInRight {
          animation: slideInRight 0.4s forwards;
        }
        .animate-slideOutRight {
          animation: slideOutRight 0.4s forwards;
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.4s forwards;
        }
        @keyframes slideOutLeft {
          to { transform: translateX(-100%) scale(0.95); opacity: 0; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%) scale(0.95); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes slideOutRight {
          to { transform: translateX(100%) scale(0.95); opacity: 0; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%) scale(0.95); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        .flip-card {
          transform-style: preserve-3d;
        }
        .flip-front, .flip-back {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0; left: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transition: none !important;
        }
        .flip-front.flipping {
          animation: flipFront 0.5s forwards;
        }
        .flip-back.flipping {
          animation: flipBack 0.5s forwards;
        }
        @keyframes flipFront {
          to { transform: rotateY(180deg) scale(1); }
        }
        @keyframes flipBack {
          from { transform: rotateY(-180deg) scale(1); }
          to { transform: rotateY(0deg) scale(1); }
        }
      `}</style>
        <div>
          <div className="card-viewer-container mx-auto">
            {images.map((img, idx) => (
              <img
                key={img.label}
                src={img.src}
                alt={img.label}
                className={`card-img ${getCardClass(idx as Stage)}`}
                onClick={handleCardTap}
                draggable={false}
                style={{ userSelect: "none" }}
              />
            ))}
          </div>
          <div className="text-center mt-4 text-sm text-gray-500">
            {images[animating ? nextStage : stage].label} (
            {(animating ? nextStage : stage) + 1}/{images.length}) &mdash; Tap
            card to continue
          </div>
          <div className="flex justify-center mt-1 gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`inline-block w-2 h-2 rounded-full ${
                  i === (animating ? nextStage : stage)
                    ? "bg-primary-500"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CardViewer;
