import { useState, useEffect } from "react";
import { fetchGuestsFromSheet } from "../utils/sheets";

export interface Guest {
  name: string;
  partnerName?: string | null;
  maxExtraGuests?: number;
}

export const useGuest = (guestId: string | null) => {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGuest = async () => {
      setLoading(true);
      setError(null);

      if (!guestId) {
        setError("No guest ID provided");
        setLoading(false);
        return;
      }

      try {
        const guests = await fetchGuestsFromSheet();
        const guestData = guests[guestId];
        if (!guestData) {
          setError("Guest not found");
          setLoading(false);
          return;
        }
        setGuest(guestData);
        setLoading(false);
      } catch {
        setError("Failed to fetch guests");
        setLoading(false);
      }
    };

    loadGuest();
  }, [guestId]);

  return { guest, loading, error };
};
