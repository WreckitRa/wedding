import "./App.css";
import CardViewer from "./components/CardViewer";
import RSVPFlow from "./components/RSVPFlow";
import SpotifyPlaylist from "./components/SpotifyPlaylist";
import WeddingInfo from "./components/WeddingInfo";
import WelcomeSection from "./components/WelcomeSection";
import { useGuest } from "./hooks/useGuest";
import { getGuestIdFromUrl } from "./utils/urlParams";
import { useEffect, useState } from "react";

const ScrollIndicator: React.FC = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const rsvpSection = document.getElementById("rsvp-section");
      if (rsvpSection) {
        const rect = rsvpSection.getBoundingClientRect();
        const windowHeight =
          window.innerHeight || document.documentElement.clientHeight;
        if (rect.top < windowHeight - 120 && rect.bottom > 80) {
          setShow(false);
        } else if (
          rect.top < windowHeight &&
          rect.bottom < windowHeight + 120
        ) {
          setShow(false);
        } else {
          setShow(true);
        }
      } else {
        setShow(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!show) return null;
  return (
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
        <span className="mt-1 text-xs font-medium">Scroll to continue</span>
      </div>
    </div>
  );
};

function App() {
  const guestId = getGuestIdFromUrl();
  const { guest, loading, error } = useGuest(guestId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-black">Loading your invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">💌</div>
          <h1 className="text-2xl font-serif text-black mb-4">
            Invitation Not Found
          </h1>
          <p className="text-black mb-6">
            We couldn't find your invitation. Please check the link you received
            or contact the couple.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ScrollIndicator />
      <WelcomeSection guest={guest} />
      <CardViewer />
      <WeddingInfo />
      <SpotifyPlaylist />
      <RSVPFlow guest={guest} />
      <footer className="h-24 flex items-center justify-center">
        <p className="text-xs text-gray-500 font-medium">
          Developed by the groom! 😉
        </p>
      </footer>
    </div>
  );
}

export default App;
