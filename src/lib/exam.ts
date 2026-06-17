// Client-safe exam shape returned by /api/calendar.
export interface ExamDTO {
  id: string;
  title: string;
  start: string; // ISO date or dateTime
  allDay: boolean;
  location?: string;
  description?: string;
}

// Editable calendar event returned by /api/calendar/events (the user's own
// Google calendar, via OAuth). `editable` distinguishes these from the
// read-only exam feed when both are shown together.
export interface CalendarEventDTO {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  location?: string;
  description?: string;
  tags: string[];
  editable: boolean;
}
