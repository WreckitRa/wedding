import React from "react";
import { generateCalendarLink } from "../utils/calendar";
import type { EventConfig } from "../types/event";
import { Calendar, MapPin } from "lucide-react";

interface WeddingInfoProps {
  config: EventConfig;
}

/** Extract place_id from a saved map URL (place_id:xxx, q=place_id:xxx, or query_place_id=xxx) */
function getPlaceIdFromMapUrl(url: string): string | null {
  if (!url?.trim()) return null;
  try {
    const decoded = decodeURIComponent(url);
    const placeIdMatch =
      decoded.match(/query_place_id=([^&\s]+)/i) ||
      decoded.match(/[?&]q=place_id:([^&\s]+)/i) ||
      decoded.match(/place_id:([^&\s/]+)/i);
    return placeIdMatch ? placeIdMatch[1].trim() : null;
  } catch {
    return null;
  }
}

/** Build Google Maps directions URL. Prefers address (reliable); falls back to place_id or raw map URL. */
function getDirectionsUrl(storedMapUrl: string, address?: string | null): string {
  const trimmedAddr = address?.trim();
  if (trimmedAddr) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trimmedAddr)}`;
  }
  const placeId = getPlaceIdFromMapUrl(storedMapUrl);
  if (placeId) {
    return `https://www.google.com/maps/dir/?api=1&destination=place_id:${encodeURIComponent(placeId)}`;
  }
  return storedMapUrl;
}

const WeddingInfo: React.FC<WeddingInfoProps> = ({ config }) => {
  const handleAddToCalendar = () => {
    const calendarUrl = generateCalendarLink(config);
    window.open(calendarUrl, "_blank");
  };

  const handleOpenMaps = (mapUrl: string, address?: string | null) => {
    window.open(getDirectionsUrl(mapUrl, address), "_blank");
  };

  return (
    <section className="py-20 bg-primary-100">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif text-black mb-4">
            Wedding Details
          </h2>
          <div className="w-24 h-0.5 bg-black mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Ceremony Details */}
          <div className="bg-white rounded-md p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-white">💒</span>
              </div>
              <h3 className="text-2xl font-serif text-black mb-2">Ceremony</h3>
            </div>

            <div className="space-y-4 text-center">
              <div>
                <h4 className="font-medium text-black mb-1">Date & Time</h4>
                <p className="text-gray-600">{config.weddingDate}</p>
                <p className="text-gray-600">{config.ceremonyTime}</p>
              </div>

              <div>
                <h4 className="font-medium text-black mb-1">Location</h4>
                <p className="text-gray-600">{config.churchName}</p>
                <p className="text-sm text-gray-500">{config.churchAddress}</p>
                {config.churchMap && (
                  <button
                    onClick={() => handleOpenMaps(config.churchMap!, config.churchAddress ?? config.churchName)}
                    className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-md text-sm font-medium hover:bg-primary-100 transition-colors"
                  >
                    <MapPin size={16} />
                    Get Directions
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Reception Details */}
          <div className="bg-white rounded-md p-8 shadow-lg ">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-md flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-white">🎉</span>
              </div>
              <h3 className="text-2xl font-serif text-black mb-2">Reception</h3>
            </div>

            <div className="space-y-4 text-center">
              <div>
                <h4 className="font-medium text-black mb-1">Time</h4>
                <p className="text-gray-600">{config.weddingDate}</p>
                <p className="text-gray-600">{config.receptionTime}</p>
              </div>

              <div>
                <h4 className="font-medium text-black mb-1">Location</h4>
                <p className="text-gray-600">{config.venueName}</p>
                <p className="text-sm text-gray-500">{config.venueAddress}</p>
                {config.venueMap && (
                  <button
                    onClick={() => handleOpenMaps(config.venueMap!, config.venueAddress ?? config.venueName)}
                    className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-md text-sm font-medium hover:bg-primary-100 transition-colors"
                  >
                    <MapPin size={16} />
                    Get Directions
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add to Calendar Button */}
        <div className="text-center mt-12">
          <button
            onClick={handleAddToCalendar}
            className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white rounded-md font-medium  hover:bg-primary-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Calendar size={20} />
            Add to Calendar
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-16 bg-white rounded-md p-8 text-center">
          <h3 className="text-2xl font-serif text-black mb-4">
            Important Notes
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
            {[
              {
                emoji: "🪩",
                title: "Get Ready",
                subtitle: "We're partying under the stars, come ready to dance till late!",
                href: undefined,
              },
              {
                emoji: "🚗",
                title: "Parking",
                subtitle: "Free parking available at the church and venue",
                href: undefined,
              },
              {
                emoji: "📱",
                title: "Contact",
                subtitle: config.groomPhoneNumber && config.bridePhoneNumber
                  ? `Questions? Call ${config.groomPhoneNumber} or ${config.bridePhoneNumber}`
                  : config.groomPhoneNumber
                    ? `Questions? Call ${config.groomPhoneNumber}`
                    : config.bridePhoneNumber
                      ? `Questions? Call ${config.bridePhoneNumber}`
                      : "Questions? Reach out to the couple",
                href: undefined,
              },
            ].map((defaults, i) => {
              const note = config.importantNotes?.[i];
              const emoji = (note?.emoji ?? defaults.emoji) || "";
              const title = (note?.title ?? defaults.title) || "";
              const subtitle = (note?.subtitle ?? defaults.subtitle) || "";
              const href = note?.href?.trim();
              if (!emoji && !title && !subtitle) return null;
              return (
                <div key={i}>
                  {emoji && <div className="text-2xl mb-2">{emoji}</div>}
                  {title && <h4 className="font-medium text-black mb-1">{title}</h4>}
                  {subtitle && (
                    <p>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 underline"
                        >
                          {subtitle}
                        </a>
                      ) : (
                        subtitle
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeddingInfo;
