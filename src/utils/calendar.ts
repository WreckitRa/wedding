import type { EventConfig } from "../types/event";

export function getEventDate(config: EventConfig): Date {
  const d = config.date || config.startDate;
  if (!d) return new Date();
  return new Date(d);
}

export function generateCalendarLink(config: EventConfig): string {
  const startDate = config.startDate ? new Date(config.startDate) : new Date(config.date || "");
  const endDate = config.endDate ? new Date(config.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const formatDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const title = encodeURIComponent(`${config.coupleNames || "Event"} Wedding`);
  const details = encodeURIComponent(
    `Ceremony: ${config.ceremonyTime || ""} at ${config.churchName || ""}\n` +
      `Reception: ${config.receptionTime || ""} at ${config.venueName || ""}\n\n` +
      `Join us for our special day! 💍✨`
  );
  const location = encodeURIComponent(
    `${config.churchName || ""}, ${config.churchAddress || ""}`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${details}&location=${location}`;
}
