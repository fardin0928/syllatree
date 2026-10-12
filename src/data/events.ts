export type EventKind = "Exam" | "Midterm" | "Project" | "Homework";

export type CourseEvent = {
  id: string;
  title: string;
  course: string;
  kind: EventKind;
  /** ISO datetime, local time. This is the due date / start time the countdown targets. */
  at: string;
  location?: string;
  /** Extra line shown under the date, e.g. late due date or exam window. */
  note?: string;
};

export const KIND_STYLE: Record<EventKind, { dot: string; text: string; chip: string }> = {
  Midterm: { dot: "bg-rose-400", text: "text-rose-300", chip: "bg-rose-500/10 border-rose-500/30" },
  Exam: { dot: "bg-rose-400", text: "text-rose-300", chip: "bg-rose-500/10 border-rose-500/30" },
  Project: { dot: "bg-indigo-400", text: "text-indigo-300", chip: "bg-indigo-500/10 border-indigo-500/30" },
  Homework: { dot: "bg-amber-400", text: "text-amber-300", chip: "bg-amber-500/10 border-amber-500/30" },
};

const COURSE = "CSCI 335";

/**
 * Edit this list to change what the Upcoming panel shows. Past events drop off
 * automatically; only the next few are displayed.
 * Midterm times are placeholders (noon) until the exact time is announced.
 */
export const COURSE_EVENTS: CourseEvent[] = [
  { id: "hw2", title: "Homework 2", course: COURSE, kind: "Homework", at: "2026-09-22T14:15", note: "Late due Sep 25, 11:59 PM" },
  { id: "proj1", title: "Project 1 - Move Semantics", course: COURSE, kind: "Project", at: "2026-09-24T23:59", note: "Late due Sep 26, 11:59 PM" },
  { id: "hw3", title: "Homework 3", course: COURSE, kind: "Homework", at: "2026-10-01T14:15", note: "Late due Oct 5, 11:59 PM" },
  { id: "hw4", title: "Homework 4", course: COURSE, kind: "Homework", at: "2026-10-08T14:15", note: "Late due Oct 12, 11:59 PM" },
  { id: "proj2", title: "Project 2", course: COURSE, kind: "Project", at: "2026-10-15T23:59" },
  { id: "midterm1", title: "Midterm 1", course: COURSE, kind: "Midterm", at: "2026-10-22T12:00" },
  { id: "hw5", title: "Homework 5", course: COURSE, kind: "Homework", at: "2026-10-29T14:15", note: "Late due Nov 2, 11:59 PM" },
  { id: "proj3", title: "Project 3", course: COURSE, kind: "Project", at: "2026-11-12T23:59" },
  { id: "midterm2", title: "Midterm 2", course: COURSE, kind: "Midterm", at: "2026-11-19T12:00" },
  // Project 4: date TBD - add it here once announced.
  { id: "final", title: "Final Exam", course: COURSE, kind: "Exam", at: "2026-12-17T13:45", note: "1:45 - 3:45 PM" },
];
