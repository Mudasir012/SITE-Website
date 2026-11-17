// ---------------------------------------------------------------------------
// Competition lineup for CITE 2026. Society names are intentionally omitted —
// each entry is the event name only, grouped under its published category.
// ---------------------------------------------------------------------------
export const competitionCategories = [
  {
    code: 'A',
    title: 'Computer Science Competitions',
    events: [
      'AI ML',
      'On-Spot Programming',
      'Web Development',
      'Mobile Application Development',
      'UI/UX Design',
      'Poster Designing',
      'Tech Quiz',
      'Idea Pitching',
      'Reel Making',
    ],
  },
  {
    code: 'B',
    title: 'Fun, E-Gaming and Other Competitions',
    events: [
      'GTA 6',
      'Baby Shark',
      'Mafia Wars',
      'English Debate',
      'Mind over Matter',
      'New Event',
      'PUBG',
      'Tekken 8',
      'FC (FIFA)',
      'Auto Show',
    ],
  },
];

export const events = competitionCategories.flatMap(({ code, title, events: categoryEvents }) =>
  categoryEvents.map((name) => ({ name, category: title, code }))
);
