// ---------------------------------------------------------------------------
// Competition lineup for CITE 2026. Society names are intentionally omitted —
// each entry is the event name only, grouped under its published category.
// ---------------------------------------------------------------------------
const photo = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop`;

// Shared published details. No prize amount is claimed; the pool is announced later.
const eventDetails = {
  prize: 'To be announced',
  format: 'On-site judging',
  eligibility: 'Degree students',
};

export const competitionCategories = [
  {
    code: 'A',
    title: 'Computer Science Competitions',
    events: [
      { name: 'AI ML', image: photo(8294605) },
      { name: 'On-Spot Programming', image: photo(34803985) },
      { name: 'Web Development', image: photo(326514) },
      { name: 'Mobile Application Development', image: photo(3471423) },
      { name: 'UI/UX Design', image: photo(196646) },
      { name: 'Poster Designing', image: photo(6620960) },
      { name: 'Tech Quiz', image: photo(5428833) },
      { name: 'Idea Pitching', image: photo(7653999) },
      { name: 'Reel Making', image: photo(29043650) },
    ],
  },
  {
    code: 'B',
    title: 'Fun, E-Gaming and Other Competitions',
    events: [
      { name: 'GTA 6', image: photo(15393003) },
      { name: 'Baby Shark', image: photo(32370584) },
      { name: 'Mafia Wars', image: photo(7594313) },
      { name: 'English Debate', image: photo(6950207) },
      { name: 'Mind over Matter', image: photo(6599554) },
      { name: 'New Event', image: photo(796606) },
      { name: 'PUBG', image: photo(4526481) },
      { name: 'Tekken 8', image: photo(30512715) },
      { name: 'FC (FIFA)', image: photo(1174746) },
      { name: 'Auto Show', image: photo(40206185) },
    ],
  },
];

export const events = competitionCategories.flatMap(({ code, title, events: categoryEvents }) =>
  categoryEvents.map((item) => ({ ...item, ...eventDetails, category: title, code }))
);
