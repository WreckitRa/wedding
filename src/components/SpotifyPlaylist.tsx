import React from "react";
import type { EventConfig } from "../types/event";

interface SpotifyPlaylistProps {
  config: EventConfig;
}

const SpotifyPlaylist: React.FC<SpotifyPlaylistProps> = ({ config }) => {
  const spotifyId = config.spotifyId;
  if (!spotifyId) return null;
  const embedUrl = `https://open.spotify.com/embed/playlist/${spotifyId}?utm_source=generator&theme=0`;

  return (
    <section className="py-20 bg-secondary-100">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif text-black mb-4">
            Wedding Feels 💖
          </h2>
          <p className="text-lg text-black max-w-2xl mx-auto">
            Get in the vibe! Here’s a playlist full of songs that tell our
            story, and will light up the dance floor on the big day. 🎶
          </p>
        </div>

        <div className="bg-primary-200 rounded-md shadow-xl p-8 md:p-12">
          <div className="relative">
            <iframe
              src={embedUrl}
              width="100%"
              height="380"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-md shadow-lg"
              title="Wedding Playlist"
            ></iframe>
          </div>

          <div className="text-center mt-8">
            <p className="text-black mb-4">
              We can’t wait to dance with you! 💃🕺
            </p>
            <a
              href={`https://open.spotify.com/playlist/${spotifyId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Open in Spotify
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpotifyPlaylist;
