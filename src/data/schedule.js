// ---------------------------------------------------------------------------
// Single-day competition schedule.
// ---------------------------------------------------------------------------
export const eventSchedule = {
  day: 'Saturday',
  date: 'December 12, 2026',
  timeWindow: '9:00 AM — 6:00 PM PKT',
  venue: 'Main Auditorium · CS Block Labs',
  sessions: [
    { time: '9:00 AM', title: 'Registration & Delegate Check-in', location: 'Main Auditorium Lobby', type: 'Ceremony' },
    { time: '9:30 AM', title: 'Opening Ceremony & Keynote Address', location: 'Main Auditorium', type: 'Ceremony' },
    { time: '10:00 AM', title: 'Competition Rules & Problem Briefing', location: 'Main Auditorium', type: 'Ceremony' },
    { time: '10:30 AM', title: 'Team Formation Session', location: 'CS Block Labs', type: 'Workshop' },
    { time: '11:00 AM', title: 'Competitions Officially Begin', location: 'CS Block Labs', type: 'Competition' },
    { time: '12:00 PM', title: 'Workshop: Rapid Prototyping & System Design', location: 'Lab 4', type: 'Workshop' },
    { time: '1:00 PM', title: 'Midday Break', location: 'Campus', type: 'Break' },
    { time: '2:00 PM', title: 'Progress Checkpoint', location: 'CS Block Labs', type: 'Competition' },
    { time: '3:00 PM', title: 'Workshop: Pitch & Demo Storytelling', location: 'Lab 4', type: 'Workshop' },
    { time: '3:45 PM', title: 'Code Freeze & Project Submission', location: 'Online Portal', type: 'Competition' },
    { time: '4:15 PM', title: 'Preliminary Category Judging & Demo Expo', location: 'CS Block Labs', type: 'Judging' },
    { time: '5:00 PM', title: 'Grand Finale: Project Showcase', location: 'Main Auditorium', type: 'Judging' },
    { time: '5:30 PM', title: 'Closing Ceremony & Group Photography', location: 'Main Auditorium', type: 'Ceremony' },
    { time: '6:00 PM', title: 'Program Concludes', location: 'Main Auditorium', type: 'Ceremony' },
  ],
};

export const scheduleDays = [eventSchedule];
