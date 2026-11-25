// ---------------------------------------------------------------------------
// Single-day competition schedule.
// ---------------------------------------------------------------------------
export const eventSchedule = {
  day: 'Saturday',
  date: 'December 12, 2026',
  timeWindow: '09:00 — 18:00 PKT',
  venue: 'Main Auditorium · CS Block Labs',
  sessions: [
    { time: '09:00', title: 'Registration & Delegate Check-in', location: 'Main Auditorium Lobby', type: 'Ceremony' },
    { time: '09:30', title: 'Opening Ceremony & Keynote Address', location: 'Main Auditorium', type: 'Ceremony' },
    { time: '10:00', title: 'Competition Rules & Problem Briefing', location: 'Main Auditorium', type: 'Ceremony' },
    { time: '10:30', title: 'Team Formation Session', location: 'CS Block Labs', type: 'Workshop' },
    { time: '11:00', title: 'Competitions Officially Begin', location: 'CS Block Labs', type: 'Competition' },
    { time: '12:00', title: 'Workshop: Rapid Prototyping & System Design', location: 'Lab 4', type: 'Workshop' },
    { time: '13:00', title: 'Midday Break', location: 'Campus', type: 'Break' },
    { time: '14:00', title: 'Progress Checkpoint', location: 'CS Block Labs', type: 'Competition' },
    { time: '15:00', title: 'Workshop: Pitch & Demo Storytelling', location: 'Lab 4', type: 'Workshop' },
    { time: '15:45', title: 'Code Freeze & Project Submission', location: 'Online Portal', type: 'Competition' },
    { time: '16:15', title: 'Preliminary Category Judging & Demo Expo', location: 'CS Block Labs', type: 'Judging' },
    { time: '17:00', title: 'Grand Finale: Project Showcase', location: 'Main Auditorium', type: 'Judging' },
    { time: '17:30', title: 'Closing Ceremony & Group Photography', location: 'Main Auditorium', type: 'Ceremony' },
    { time: '18:00', title: 'Program Concludes', location: 'Main Auditorium', type: 'Ceremony' },
  ],
};

export const scheduleDays = [eventSchedule];
