import { useState, useEffect } from "react";
import { getEvent } from "../api/client";
import type { Event } from "../types/event";

export function useEvent(slug: string | null) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("No event slug");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEvent(slug)
      .then((data) => {
        if (!cancelled) {
          setEvent({
            id: data.id,
            slug: data.slug,
            name: data.name,
            config: data.config,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load event");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { event, loading, error };
}
