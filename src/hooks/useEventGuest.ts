import { useState, useEffect } from "react";
import { getGuest } from "../api/client";
import type { Guest } from "../types/event";

/**
 * Load guest by event slug + token. Returns null guest when token is null (public link).
 */
export function useEventGuest(eventSlug: string | null, token: string | null) {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventSlug) {
      setError("No event");
      setLoading(false);
      return;
    }
    if (!token) {
      setGuest(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getGuest(eventSlug, token)
      .then((data) => {
        if (!cancelled) {
          setGuest({
            id: data.id,
            token: data.token,
            name: data.name,
            partnerName: data.partnerName ?? null,
            maxExtraGuests: data.maxExtraGuests,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Guest not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventSlug, token]);

  return { guest, loading, error };
}
