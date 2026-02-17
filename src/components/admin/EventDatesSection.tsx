import { useCallback, useMemo } from "react";
import type { EventConfig } from "../../types/event";
import { INPUT_CLASS, LABEL_CLASS_SM, SECTION_TITLE_CLASS, SECTION_TITLE_CLASS_MUTED } from "./formStyles";

const MONTHS = "January,February,March,April,May,June,July,August,September,October,November,December".split(",");

/** Format YYYY-MM-DD to "August 16, 2025" */
export function formatDisplayDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "";
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

/** Get YYYY-MM-DD from config (date or startDate) */
function getEventDateValue(config: EventConfig): string {
  const raw = config.date || config.startDate;
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Get YYYY-MM-DD from rsvpDeadline if it looks like a date we can parse */
function getRsvpDateValue(rsvpDeadline: string | undefined): string {
  if (!rsvpDeadline) return "";
  const cleaned = rsvpDeadline.replace(/\b(\d+)(st|nd|rd|th)\b/i, "$1");
  const d = new Date(cleaned);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Parse time string "18:00" or "6:00 PM" to HH:MM (24h) for input[type=time] */
function toTimeInputValue(t: string | undefined): string {
  if (!t?.trim()) return "";
  const match = t.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = match[3]?.toLowerCase();
    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}`;
  }
  return t.slice(0, 5);
}

/** Format HH:MM to "6:00 PM" for display on invitation */
function fromTimeInputToDisplay(value: string): string {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  if (h === 12) return `12:${String(m).padStart(2, "0")} PM`;
  if (h === 0) return `12:${String(m).padStart(2, "0")} AM`;
  if (h > 12) return `${h - 12}:${String(m).padStart(2, "0")} PM`;
  return `${h}:${String(m).padStart(2, "0")} AM`;
}

interface EventDatesSectionProps {
  config: EventConfig;
  onChange: (config: EventConfig) => void;
}

export default function EventDatesSection({ config, onChange }: EventDatesSectionProps) {
  const eventDateYmd = getEventDateValue(config);
  const rsvpDateYmd = useMemo(
    () => getRsvpDateValue(config.rsvpDeadline),
    [config.rsvpDeadline]
  );
  const ceremonyTimeInput = toTimeInputValue(config.ceremonyTime);
  const receptionTimeInput = toTimeInputValue(config.receptionTime);

  const applyEventDate = useCallback(
    (dateYmd: string) => {
      if (!dateYmd) {
        onChange({
          ...config,
          date: undefined,
          startDate: undefined,
          endDate: undefined,
          weddingDate: undefined,
        });
        return;
      }
      const ceremony = ceremonyTimeInput || "18:00";
      const reception = receptionTimeInput || "19:30";
      const [ch, cm] = ceremony.split(":").map(Number);
      const [rh, rm] = reception.split(":").map(Number);
      const start = new Date(dateYmd + "T00:00:00");
      start.setHours(ch, cm ?? 0, 0, 0);
      const end = new Date(dateYmd + "T00:00:00");
      end.setHours(rh, rm ?? 0, 0, 0);
      if (end.getTime() <= start.getTime()) end.setTime(start.getTime() + 4 * 60 * 60 * 1000);
      onChange({
        ...config,
        date: start.toISOString(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        weddingDate: formatDisplayDate(dateYmd),
      });
    },
    [config, onChange, ceremonyTimeInput, receptionTimeInput]
  );

  const handleEventDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      applyEventDate(v);
    },
    [applyEventDate]
  );

  const handleRsvpDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      onChange({
        ...config,
        rsvpDeadline: v ? formatDisplayDate(v + "T12:00:00") : undefined,
      });
    },
    [config, onChange]
  );

  const handleCeremonyTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      const display = fromTimeInputToDisplay(v);
      const next = { ...config, ceremonyTime: display || undefined };
      if (eventDateYmd && v) {
        const [h, m] = v.split(":").map(Number);
        const start = new Date(eventDateYmd + "T00:00:00");
        start.setHours(h, m ?? 0, 0, 0);
        next.date = start.toISOString();
        next.startDate = start.toISOString();
        const end = config.endDate ? new Date(config.endDate) : new Date(start.getTime() + 4 * 60 * 60 * 1000);
        if (end.getTime() <= start.getTime()) end.setTime(start.getTime() + 4 * 60 * 60 * 1000);
        next.endDate = end.toISOString();
      }
      onChange(next);
    },
    [config, onChange, eventDateYmd]
  );

  const handleReceptionTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      const display = fromTimeInputToDisplay(v);
      const next = { ...config, receptionTime: display || undefined };
      if (eventDateYmd && v) {
        const [h, m] = v.split(":").map(Number);
        const end = new Date(eventDateYmd + "T00:00:00");
        end.setHours(h, m ?? 0, 0, 0);
        next.endDate = end.toISOString();
        const start = config.startDate ? new Date(config.startDate) : new Date(end.getTime() - 2 * 60 * 60 * 1000);
        if (start.getTime() >= end.getTime()) start.setTime(end.getTime() - 2 * 60 * 60 * 1000);
        next.startDate = start.toISOString();
        next.date = next.startDate;
      }
      onChange(next);
    },
    [config, onChange, eventDateYmd]
  );

  const handleWeddingDateDisplayChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...config, weddingDate: e.target.value || undefined });
    },
    [config, onChange]
  );

  return (
    <section>
      <h4 className={SECTION_TITLE_CLASS}>Date & time</h4>
      <p className={SECTION_TITLE_CLASS_MUTED}>One event date and optional times. Display text and calendar link update automatically.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS_SM}>Event date</label>
          <input
            type="date"
            className={INPUT_CLASS}
            value={eventDateYmd}
            onChange={handleEventDateChange}
            aria-label="Event date"
          />
          <p className="text-xs text-slate-500 mt-0.5">Calendar and display date use this.</p>
        </div>
        <div>
          <label className={LABEL_CLASS_SM}>RSVP by</label>
          <input
            type="date"
            className={INPUT_CLASS}
            value={rsvpDateYmd}
            onChange={handleRsvpDateChange}
            aria-label="RSVP deadline"
          />
          <p className="text-xs text-slate-500 mt-0.5">Shown as “Kindly RSVP by …”</p>
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL_CLASS_SM}>Display date (on invitation)</label>
          <input
            type="text"
            className={INPUT_CLASS}
            value={config.weddingDate ?? ""}
            onChange={handleWeddingDateDisplayChange}
            placeholder={eventDateYmd ? formatDisplayDate(eventDateYmd + "T12:00:00") : "e.g. August 16, 2025"}
          />
          <p className="text-xs text-slate-500 mt-0.5">Defaults from event date; edit if you want “Saturday, August 16” etc.</p>
        </div>
        <div>
          <label className={LABEL_CLASS_SM}>Ceremony time</label>
          <input
            type="time"
            className={INPUT_CLASS}
            value={ceremonyTimeInput}
            onChange={handleCeremonyTimeChange}
            aria-label="Ceremony time"
          />
        </div>
        <div>
          <label className={LABEL_CLASS_SM}>Reception time</label>
          <input
            type="time"
            className={INPUT_CLASS}
            value={receptionTimeInput}
            onChange={handleReceptionTimeChange}
            aria-label="Reception time"
          />
        </div>
      </div>
    </section>
  );
}
