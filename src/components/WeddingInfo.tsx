import React from "react";
import { generateCalendarLink } from "../utils/urlParams";
import wedding from "../data/wedding.json";
import { Calendar, MapPin } from "lucide-react";

const WeddingInfo: React.FC = () => {
  const handleAddToCalendar = () => {
    const calendarUrl = generateCalendarLink();
    window.open(calendarUrl, "_blank");
  };

  const handleOpenMaps = (address: string) => {
    window.open(address, "_blank");
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
                <p className="text-gray-600">{wedding.weddingDate}</p>
                <p className="text-gray-600">{wedding.ceremonyTime}</p>
              </div>

              <div>
                <h4 className="font-medium text-black mb-1">Location</h4>
                <p className="text-gray-600">{wedding.churchName}</p>
                <p className="text-sm text-gray-500">{wedding.churchAddress}</p>
                <button
                  onClick={() => handleOpenMaps(wedding.churchMap)}
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-md text-sm font-medium hover:bg-primary-100 transition-colors"
                >
                  <MapPin size={16} />
                  Get Directions
                </button>
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
                <p className="text-gray-600">{wedding.weddingDate}</p>
                <p className="text-gray-600">{wedding.receptionTime}</p>
              </div>

              <div>
                <h4 className="font-medium text-black mb-1">Location</h4>
                <p className="text-gray-600">{wedding.venueName}</p>
                <p className="text-sm text-gray-500">{wedding.venueAddress}</p>
                <button
                  onClick={() => handleOpenMaps(wedding.venueMap)}
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-md text-sm font-medium hover:bg-primary-100 transition-colors"
                >
                  <MapPin size={16} />
                  Get Directions
                </button>
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
            <div>
              <div className="text-2xl mb-2">🪩</div>
              <h4 className="font-medium text-black mb-1">Get Ready</h4>
              <p>
                We're partying under the stars, come ready to dance till late!
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">🚗</div>
              <h4 className="font-medium text-black mb-1">Parking</h4>
              <p>Free parking available at the church and venue</p>
            </div>
            <div>
              <div className="text-2xl mb-2">📱</div>
              <h4 className="font-medium text-black mb-1">Contact</h4>
              <p>
                Questions? Call{" "}
                <a
                  href={`tel:+${wedding.groomPhoneNumber}`}
                  className="text-primary-600 hover:text-primary-800 underline"
                >
                  {wedding.groomPhoneNumber}
                </a>{" "}
                or{" "}
                <a
                  href={`tel:+${wedding.bridePhoneNumber}`}
                  className="text-primary-600 hover:text-primary-800 underline"
                >
                  {wedding.bridePhoneNumber}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeddingInfo;
