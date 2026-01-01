import type { Guest } from "../hooks/useGuest";

interface RSVPSubmissionData {
  guestId: string;
  guestName: string;
  partnerName?: string;
  attendance: "yes" | "no";
  extraGuests: number;
  favoriteSongs: [string, string];
  reaction: string;
  message: string;
  submissionTime: string;
}

const GOOGLE_SHEETS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbymSaAQ5zYTJqRNpOuBsvmgPvImqIlU4An1AFiRHyPv2Q3GB22YmRUGc8VOIRe5vT51/exec";

export const submitRSVPToSheets = async (
  data: RSVPSubmissionData
): Promise<boolean> => {
  try {
    console.log("Submitting RSVP data:", data);
    console.log("Sending to URL:", GOOGLE_SHEETS_ENDPOINT);

    // Use a simple POST request without custom headers to avoid CORS preflight
    const response = await fetch(GOOGLE_SHEETS_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(data),
      // Remove mode: 'no-cors' to see actual response
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (response.ok) {
      const result = await response.json();
      console.log("Response data:", result);
      return result.success === true;
    } else {
      console.error("Response not ok:", response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error("Error submitting RSVP to sheets:", error);
    return false;
  }
};

export const checkRSVPStatus = async (guestId: string): Promise<boolean> => {
  try {
    const url = new URL(GOOGLE_SHEETS_ENDPOINT);
    url.searchParams.append("action", "checkRSVP");
    url.searchParams.append("guestId", guestId);

    console.log("Checking RSVP status for guestId:", guestId);
    console.log("Request URL:", url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
    });

    if (response.ok) {
      const result = await response.json();
      console.log("RSVP status check result:", result);
      return result.found === true;
    } else {
      console.error(
        "RSVP status check failed:",
        response.status,
        response.statusText
      );
      return false; // Assume not found if there's an error
    }
  } catch (error) {
    console.error("Error checking RSVP status:", error);
    return false; // Assume not found on network error
  }
};

// Alternative: Download as CSV (client-side only)
export const downloadRSVPAsCSV = (data: RSVPSubmissionData): void => {
  const csvContent = [
    [
      "Guest ID",
      "Guest Name",
      "Partner Name",
      "Attendance",
      "Extra Guests",
      "Song 1",
      "Song 2",
      "Reaction",
      "Message",
      "Submission Time",
    ],
    [
      data.guestId,
      data.guestName,
      data.partnerName || "",
      data.attendance,
      data.extraGuests.toString(),
      data.favoriteSongs[0],
      data.favoriteSongs[1],
      data.reaction,
      data.message,
      data.submissionTime,
    ],
  ]
    .map((row) => row.map((field) => `"${field}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `rsvp_${data.guestId}_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Fetch guests from Google Sheets (Guests tab)
export const fetchGuestsFromSheet = async (): Promise<
  Record<string, Guest>
> => {
  // Sheet info
  const SHEET_ID = "1UuwhhJeyvbaOIzRCXYVmzlre16dS8BwVukXyjaQQr6U";
  const TAB_NAME = "Guests";
  // Use Google Visualization API for public sheets
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${TAB_NAME}`;

  try {
    const response = await fetch(url);
    const text = await response.text();
    // Remove the leading junk from the response
    const json = JSON.parse(text.substring(47, text.length - 2));
    const cols: string[] = json.table.cols.map(
      (col: { label: string }) => col.label
    );
    const rows: { c: { v: string | number | null }[] }[] = json.table.rows;
    const guests: Record<string, Guest> = {};
    for (const row of rows) {
      const values = row.c;
      // Map columns to values
      const guest: Record<string, string | number | null | undefined> = {};
      for (let i = 0; i < cols.length; i++) {
        guest[cols[i]] = values[i] ? values[i].v : undefined;
      }
      // Use a unique guestId column or fallback to name-partnerName
      const guestId =
        (guest["guestId"] as string) ||
        (guest["name"] && guest["partnerName"]
          ? `${String(guest["name"])
              .toLowerCase()
              .replace(/\s+/g, "-")}-${String(guest["partnerName"])
              .toLowerCase()
              .replace(/\s+/g, "-")}`
          : String(guest["name"]).toLowerCase().replace(/\s+/g, "-"));
      if (!guestId) continue;
      guests[guestId] = {
        name: guest["name"] ? String(guest["name"]) : "",
        partnerName: guest["partnerName"] ? String(guest["partnerName"]) : null,
        maxExtraGuests:
          guest["maxExtraGuests"] !== undefined &&
          guest["maxExtraGuests"] !== null &&
          guest["maxExtraGuests"] !== ""
            ? Number(guest["maxExtraGuests"])
            : undefined,
      };
    }
    return guests;
  } catch (error) {
    console.error("Error fetching guests from sheet:", error);
    return {};
  }
};
