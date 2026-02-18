import { useEffect, useRef, useState } from "react";
import { INPUT_CLASS, LABEL_CLASS_SM } from "./formStyles";
import { MapPin } from "lucide-react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

/**
 * Google-recommended Search URL: opens the exact place.
 * Uses query (name) + query_place_id so Maps pins the right place; query is fallback if place_id isn't found.
 * @see https://developers.google.com/maps/documentation/urls/get-started#search-action
 */
function buildPlaceSearchUrl(placeName: string, placeId: string): string {
  const query = encodeURIComponent((placeName || "Place").trim());
  const id = encodeURIComponent(placeId);
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${id}`;
}

/** Load Google Maps script with Places library */
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  const existing = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existing) {
    const g = (window as unknown as { google?: unknown }).google;
    if (g) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const check = () => {
        if ((window as unknown as { google?: unknown }).google) resolve();
        else setTimeout(check, 50);
      };
      setTimeout(() => reject(new Error("Script loaded but google not ready")), 5000);
      check();
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

interface PlaceSearchInputProps {
  value: string;
  onChange: (url: string) => void;
  /** Optional: when a place is selected, call with (name, address) to fill venue name and address (all editable below) */
  onPlaceSelect?: (name: string, address: string) => void;
  /** Placeholder for the search input */
  searchPlaceholder?: string;
  /** When true, show the fallback "Find on map" link instead of autocomplete (e.g. no API key) */
  fallbackOnly?: boolean;
  fallbackSearchUrl?: string;
}

export default function PlaceSearchInput({
  value,
  onChange,
  onPlaceSelect,
  searchPlaceholder = "Search for a place (e.g. church name or address)",
  fallbackOnly = false,
  fallbackSearchUrl = "https://www.google.com/maps",
}: PlaceSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const autocompleteRef = useRef<unknown>(null);

  useEffect(() => {
    if (fallbackOnly || !GOOGLE_MAPS_API_KEY?.trim()) return;
    let cancelled = false;
    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      .then(() => {
        if (!cancelled) setScriptReady(true);
      })
      .catch((e) => {
        if (!cancelled) setScriptError(e instanceof Error ? e.message : "Failed to load maps");
      });
    return () => { cancelled = true; };
  }, [fallbackOnly]);

  useEffect(() => {
    if (!scriptReady || !inputRef.current || !GOOGLE_MAPS_API_KEY) return;
    const win = window as unknown as {
      google?: {
        maps?: {
          places?: {
            Autocomplete: new (input: HTMLInputElement, opts?: { types?: string[] }) => {
              addListener: (event: string, fn: () => void) => void;
              getPlace: () => { place_id?: string; name?: string; formatted_address?: string };
            };
            PlacesService: new (div: HTMLDivElement) => {
              getDetails: (
                req: { placeId: string },
                cb: (result: { name?: string; formatted_address?: string } | null, status: string) => void
              ) => void;
            };
          };
        };
      };
    };
    const google = win.google;
    if (!google?.maps?.places?.Autocomplete) return;
    const { Autocomplete, PlacesService } = google.maps.places;
    const autocomplete = new Autocomplete(inputRef.current, { types: ["establishment", "geocode"] });
    autocompleteRef.current = autocomplete;
    const service = new PlacesService(document.createElement("div"));
    const listener = async () => {
      const place = autocomplete.getPlace();
      const placeId = place?.place_id;
      if (!placeId) return;
      const initialName = place.name?.trim() || "Place";
      // Prefer Google's exact map URL from our backend (Places API New); fallback to built search URL. Use same key as Maps (Places enabled).
      try {
        const base = import.meta.env.VITE_API_URL ?? "";
        const res = await fetch(`${base}/api/place-maps-url?placeId=${encodeURIComponent(placeId)}`, {
          headers: GOOGLE_MAPS_API_KEY ? { "X-Google-Api-Key": GOOGLE_MAPS_API_KEY } : undefined,
        });
        if (res.ok) {
          const data = (await res.json()) as { url?: string };
          if (data?.url) {
            onChange(data.url);
            // Still fetch name + address for the form
            const request = { placeId, fields: ["name", "formatted_address"] } as { placeId: string };
            service.getDetails(request, (result: { name?: string; formatted_address?: string } | null) => {
              const name = result?.name?.trim() ?? place.name?.trim() ?? "";
              const address = result?.formatted_address?.trim() ?? place.formatted_address?.trim() ?? "";
              if (onPlaceSelect) onPlaceSelect(name, address);
            });
            return;
          }
        }
      } catch {
        // ignore: use built URL
      }
      onChange(buildPlaceSearchUrl(initialName, placeId));
      const request = {
        placeId,
        fields: ["name", "formatted_address"],
      } as { placeId: string };
      service.getDetails(
        request,
        (
          result: {
            name?: string;
            formatted_address?: string;
          } | null
        ) => {
          const name = result?.name?.trim() ?? place.name?.trim() ?? "";
          const address = result?.formatted_address?.trim() ?? place.formatted_address?.trim() ?? "";
          if (onPlaceSelect) onPlaceSelect(name, address);
          if (name) onChange(buildPlaceSearchUrl(name, placeId));
        }
      );
    };
    autocomplete.addListener("place_changed", listener);
    return () => {
      try {
        const g = (window as unknown as { google?: { maps?: { event?: { clearInstanceListeners: (obj: unknown) => void } } } }).google;
        if (autocompleteRef.current && g?.maps?.event?.clearInstanceListeners)
          g.maps.event.clearInstanceListeners(autocompleteRef.current);
      } catch {
        // ignore
      }
    };
  }, [scriptReady, onChange, onPlaceSelect]);

  const showFallback = fallbackOnly || !GOOGLE_MAPS_API_KEY || !!scriptError;

  if (showFallback) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">Paste the map link below, then fill venue name and address manually. Or open Google Maps to find the place first.</p>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="url"
            className={INPUT_CLASS + " flex-1 min-w-0"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://www.google.com/maps/place/..."
          />
          <a
            href={fallbackSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            <MapPin className="w-4 h-4" />
            Find on map
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Search for the place to auto-fill the map link, venue name, and address below. Or paste a map link and fill name & address manually.</p>
      <div>
        <label className={LABEL_CLASS_SM}>Search for a place</label>
        <input
          ref={inputRef}
          type="text"
          className={INPUT_CLASS}
          placeholder={searchPlaceholder}
          autoComplete="off"
        />
      </div>
      <div>
        <label className={LABEL_CLASS_SM}>Map link</label>
        <input
          type="url"
          className={INPUT_CLASS}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste a Google Maps link here (or it fills when you select a place above)"
        />
      </div>
    </div>
  );
}
