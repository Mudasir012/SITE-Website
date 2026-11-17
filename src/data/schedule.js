// ---------------------------------------------------------------------------
// Single-day competition schedule.
// ---------------------------------------------------------------------------
export const eventSchedule = {
  day: 'Friday',
  date: 'December 18, 2026',
  timeWindow: '08:30 — 20:00 PKT',
  venue: 'Main Auditorium · CS Block Labs',
  sessions: [
    { time: '08:30', title: 'Registration & Delegate Check-in', location: 'Main Auditorium Lobby', type: 'Ceremony' },
    { time: '09:30', title: 'Opening Ceremony & Keynote Address', location: 'Main Auditorium', type: 'Ceremony' },
    { time: '10:15', title: 'Competition Rules & Problem Briefing', location: 'Main Auditorium', type: 'Ceremony' },
    { time: '10:45', title: 'Team Formation & Mentor Matching', location: 'CS Block Labs', type: 'Workshop' },
    { time: '11:15', title: 'Competitions Officially Begin', location: 'CS Block Labs', type: 'Competition' },
    { time: '12:30', title: 'Workshop: Rapid Prototyping & System Design', location: 'Lab 4', type: 'Workshop' },
    { time: '13:30', title: 'Lunch & Prayer Break', location: 'Food Court', type: 'Break' },
    { time: '14:30', title: 'Mentor Review Checkpoint', location: 'CS Block Labs', type: 'Competition' },
    { time: '15:30', title: 'Workshop: Pitch & Demo Storytelling', location: 'Lab 4', type: 'Workshop' },
    { time: '16:30', title: 'Code Freeze & Project Submission', location: 'Online Portal', type: 'Competition' },
    { time: '17:00', title: 'Preliminary Category Judging & Demo Expo', location: 'CS Block Labs', type: 'Judging' },
    { time: '18:00', title: 'Grand Finale: Top 5 Pitches & Showdown', location: 'Main Auditorium', type: 'Judging' },
    { time: '18:45', title: 'Panel Discussion: Careers in Tech & Startups', location: 'Main Auditorium', type: 'Ceremony' },
    { time: '19:30', title: 'Awards & Closing Ceremony', location: 'Main Auditorium', type: 'Ceremony' },
    { time: '20:00', title: 'Networking & Group Photography', location: 'Main Auditorium', type: 'Ceremony' },
  ],
};

export const scheduleDays = [eventSchedule];
