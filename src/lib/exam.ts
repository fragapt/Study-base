// Client-safe exam shape returned by /api/calendar.
export interface ExamDTO {
  id: string;
  title: string;
  start: string; // ISO date or dateTime
  allDay: boolean;
  location?: string;
  description?: string;
}
