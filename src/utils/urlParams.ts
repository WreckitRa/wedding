import wedding from "../data/wedding.json";

export const getGuestIdFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
};

export const getWeddingDate = (): Date => {
  return new Date(wedding.date);
};

export const generateCalendarLink = () => {
  const startDate = new Date(wedding.startDate);
  const endDate = new Date(wedding.endDate);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const title = encodeURIComponent(`${wedding.coupleNames} Wedding`);
  const details = encodeURIComponent(
    `Ceremony: ${wedding.ceremonyTime} at ${wedding.churchName}\n` +
      `Reception: ${wedding.receptionTime} at ${wedding.venueName}\n\n` +
      `Join us for our special day! 💍✨`
  );
  const location = encodeURIComponent(
    `${wedding.churchName}, ${wedding.churchAddress}`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(
    startDate
  )}/${formatDate(endDate)}&details=${details}&location=${location}`;
};
