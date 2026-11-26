// ---------------------------------------------------------------------------
// Competition lineup for CITE 2026. Society names are intentionally omitted —
// each entry includes its slug, category, overview, breakdown, and rules.
// ---------------------------------------------------------------------------
const photo = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop`;

const sharedInfo = {
  status: 'Registrations Opening Soon',
  fee: 'To be announced',
  prize: 'To be announced',
  winnerPrize: 'To be announced',
  runnerUpPrize: 'To be announced',
  venue: 'CUI Abbottabad (Room TBA)',
  timings: 'December 12, 2026 · 9:00 AM — 6:00 PM',
  duration: '1 Day',
  format: 'On-site judging',
  eligibility: 'Degree students',
  contactEmail: 'cite@cuiatd.edu.pk',
};

const csBreakdown = [
  { phase: 'Morning', title: 'Briefing & Problem Release' },
  { phase: 'Midday', title: 'Designing & Building' },
  { phase: 'Afternoon', title: 'Submission & Code Freeze' },
  { phase: 'Evening', title: 'Judging & Live Demos' },
];

const gamingBreakdown = [
  { phase: 'Morning', title: 'Check-in & Bracket Draw' },
  { phase: 'Midday', title: 'Qualifier & Group Rounds' },
  { phase: 'Afternoon', title: 'Knockout Semi-Finals' },
  { phase: 'Evening', title: 'Grand Finals & Awards' },
];

export const competitionCategories = [
  {
    code: 'A',
    title: 'Computer Science Competitions',
    events: [
      {
        slug: 'ai-ml',
        name: 'AI ML',
        image: photo(8294605),
        teamSize: '1 – 3 members',
        roles: ['ML Engineer', 'Data Scientist', 'Presenter'],
        description:
          'Build, train, and evaluate machine learning or AI solutions against a real-world dataset released on spot. Teams are judged on model accuracy, feature engineering, interpretability, and practical deployment.',
        breakdown: csBreakdown,
        rules: [
          'Participants must bring their own laptops with Python, Jupyter, or preferred ML environments pre-installed.',
          'Dataset and evaluation metrics will be revealed at the start of the competition.',
          'Pre-trained open-source foundation models may be used only as permitted in the problem statement.',
          'All training pipelines, notebooks, and inference scripts must be written during the competition hours.',
          'Teams must submit their final predictions and source code before the deadline.',
          'Judges will evaluate both quantitative metrics and a live technical walkthrough.',
        ],
      },
      {
        slug: 'on-spot-programming',
        name: 'On-Spot Programming',
        image: photo(34803985),
        teamSize: '1 – 3 members',
        roles: ['Algorithmist', 'Coder', 'Debugger'],
        description:
          'A high-pressure competitive programming showdown testing algorithmic thinking, data structures, and speed. Solve a curated set of multi-difficulty problems before the clock runs out.',
        breakdown: csBreakdown,
        rules: [
          'Supported languages include C, C++, Java, and Python.',
          'Participants may not use AI code-generation tools or external pre-written templates.',
          'Solutions are evaluated on correctness, edge-case handling, and time/space complexity.',
          'Internet access is restricted to the official judging platform.',
          'Ties are broken by total penalty time based on submission timestamps and wrong attempts.',
          'Any form of plagiarism or code sharing between teams results in immediate disqualification.',
        ],
      },
      {
        slug: 'web-development',
        name: 'Web Development',
        image: photo(326514),
        teamSize: '1 – 3 members',
        roles: ['Frontend Developer', 'Backend Developer', 'UI Designer'],
        description:
          'Design and ship a responsive, functional web application around the announced competition theme. Clean architecture, accessibility, responsiveness, and working features matter most.',
        breakdown: csBreakdown,
        rules: [
          'Participants must bring their own laptops with Node.js, editors, and preferred frameworks pre-configured.',
          'Any modern web stack (React, Next.js, Vue, Express, Django, Laravel, etc.) is permitted.',
          'Documentation and open-source UI libraries may be referenced, but the core app must be built on-site.',
          'Pre-built full templates or cloned repositories are strictly prohibited.',
          'Teams must demonstrate a working live build to the judging panel.',
          'Be prepared to explain architecture, state management, and design choices.',
        ],
      },
      {
        slug: 'mobile-application-development',
        name: 'Mobile Application Development',
        image: photo(3471423),
        teamSize: '1 – 3 members',
        roles: ['Designer', 'Mobile Developer'],
        description:
          'The ultimate battleground for mobile builders. Participants design, develop, and present a functional Android or cross-platform mobile application tailored to the given theme.',
        breakdown: csBreakdown,
        rules: [
          'Participants must bring their own laptops with Flutter, React Native, or native Android/iOS SDKs pre-configured.',
          'Applications may be built using Flutter, React Native, Kotlin, Java, or Swift.',
          'Documentation, official guides, and AI tools may be used for problem-solving, but all app code must be written during the event.',
          'Pre-built applications or copied repositories will lead to immediate disqualification.',
          'At the end of the build window, teams must demonstrate working app flows on an emulator or physical device.',
          'Teams must be ready to answer technical and UX questions from the judging panel.',
        ],
      },
      {
        slug: 'ui-ux-design',
        name: 'UI/UX Design',
        image: photo(196646),
        teamSize: '1 – 2 members',
        roles: ['UX Researcher', 'UI Designer'],
        description:
          'Craft intuitive user flows, wireframes, and high-fidelity interactive prototypes for a real product brief revealed on event day. Clarity, usability, and visual polish take center stage.',
        breakdown: csBreakdown,
        rules: [
          'Participants must bring their own laptops with Figma, Adobe XD, or preferred design tools ready.',
          'Design prompts will be revealed at the briefing session.',
          'Submissions must include user flow, wireframes, and an interactive clickable prototype.',
          'Using pre-made full UI kits as the final submission without original layout work is not allowed.',
          'Teams will present their design rationale and user journey to the judges.',
        ],
      },
      {
        slug: 'poster-designing',
        name: 'Poster Designing',
        image: photo(6620960),
        teamSize: '1 – 2 members',
        roles: ['Graphic Designer', 'Visual Storyteller'],
        description:
          'Translate a technical or social theme into a striking, print-ready visual poster within the competition window. Evaluated on typography, composition, originality, and message clarity.',
        breakdown: csBreakdown,
        rules: [
          'Participants must bring their own laptops with Photoshop, Illustrator, Figma, or CorelDRAW installed.',
          'The poster theme and required dimensions will be announced on-site.',
          'All artwork must be created during the event; stock elements must be properly credited if used.',
          'Final deliverables must be exported in high-resolution PDF and PNG formats.',
          'Judges may ask participants to walk through their layer files to verify original work.',
        ],
      },
      {
        slug: 'tech-quiz',
        name: 'Tech Quiz',
        image: photo(5428833),
        teamSize: '1 – 2 members',
        roles: ['Quizzer', 'CS Generalist'],
        description:
          'A fast-paced multi-round trivia and logic challenge covering computer science fundamentals, programming, cybersecurity, tech history, and emerging industry trends.',
        breakdown: [
          { phase: 'Morning', title: 'Check-in & Written Screening' },
          { phase: 'Midday', title: 'Buzzer & Rapid-Fire Rounds' },
          { phase: 'Afternoon', title: 'Visual & Code-Output Round' },
          { phase: 'Evening', title: 'Final Tie-Breaker & Awards' },
        ],
        rules: [
          'No phones, smartwatches, or external reference materials are allowed during quiz rounds.',
          'Preliminary screening narrows participants to the stage buzzer rounds.',
          'The quizmaster’s decision on timing and scoring is final.',
          'Negative marking rules (if applicable) will be briefed before each round.',
        ],
      },
      {
        slug: 'idea-pitching',
        name: 'Idea Pitching',
        image: photo(7653999),
        teamSize: '1 – 4 members',
        roles: ['Product Lead', 'Business Strategist', 'Tech Architect'],
        description:
          'Pitch a tech-driven startup or social innovation idea to a panel of industry mentors and faculty judges. Prove the problem, market fit, technical feasibility, and execution roadmap.',
        breakdown: [
          { phase: 'Morning', title: 'Deck Check & Pitch Order' },
          { phase: 'Midday', title: 'Preliminary Pitch Sessions' },
          { phase: 'Afternoon', title: 'Mentor Feedback & Refinement' },
          { phase: 'Evening', title: 'Finalist Stage Pitches' },
        ],
        rules: [
          'Each team gets a fixed pitch slot followed by Q&A from the judges.',
          'Pitch decks must be submitted in PDF or PowerPoint format before the session starts.',
          'Working prototypes or mockups earn bonus credibility during evaluation.',
          'Strictly adhere to the allotted pitch timer.',
        ],
      },
      {
        slug: 'reel-making',
        name: 'Reel Making',
        image: photo(29043650),
        teamSize: '1 – 3 members',
        roles: ['Director', 'Videographer', 'Editor'],
        description:
          'Capture the energy, stories, and behind-the-scenes moments of CITE 2026 in a crisp vertical short-form video edited and delivered before the closing showcase.',
        breakdown: [
          { phase: 'Morning', title: 'Theme & Prompt Briefing' },
          { phase: 'Midday', title: 'On-Campus Filming' },
          { phase: 'Afternoon', title: 'Editing & Color Grading' },
          { phase: 'Evening', title: 'Submission & Screening' },
        ],
        rules: [
          'All footage must be shot on campus during CITE 2026.',
          'Participants must bring their own phones, cameras, and editing setups.',
          'Final reel duration must be between 30 and 60 seconds in 9:16 vertical format.',
          'Use only copyright-free audio or licensed tracks.',
          'Respect participant privacy and campus guidelines while filming.',
        ],
      },
    ],
  },
  {
    code: 'B',
    title: 'Fun, E-Gaming and Other Competitions',
    events: [
      {
        slug: 'gta-6',
        name: 'GTA 6',
        image: photo(15393003),
        teamSize: 'Solo',
        roles: ['Player'],
        description:
          'Step into high-octane challenge runs and custom arcade trials in this crowd-favorite gaming showcase. Precision, speed, and composure under pressure decide the winner.',
        breakdown: gamingBreakdown,
        rules: [
          'Matches are played on organizer-provided setups with standardized settings.',
          'Participants must report to the gaming zone 15 minutes before their scheduled slot.',
          'No external controllers with macro/turbo scripts are permitted.',
          'Referee decisions on restarts or disputes are final.',
        ],
      },
      {
        slug: 'baby-shark',
        name: 'Baby Shark',
        image: photo(32370584),
        teamSize: '2 – 4 members',
        roles: ['Team Player', 'Strategist'],
        description:
          'A high-energy campus fun-arena challenge packed with quick reflexes, team coordination, and surprise mini-games designed to keep the crowd cheering.',
        breakdown: gamingBreakdown,
        rules: [
          'All challenge props and rules for each round are explained on-site.',
          'Teams must complete each stage within the referee’s countdown.',
          'Good sportsmanship and fair play are mandatory at all times.',
        ],
      },
      {
        slug: 'mafia-wars',
        name: 'Mafia Wars',
        image: photo(4691567),
        teamSize: 'Solo',
        roles: ['Detective', 'Strategist', 'Bluffer'],
        description:
          'Outwit, persuade, and survive in CITE’s live social-deduction arena. Read the room, form alliances, and uncover the hidden Mafia before your team is eliminated.',
        breakdown: gamingBreakdown,
        rules: [
          'Players are assigned secret roles at the start of each table round.',
          'No side-channel communication or revealing cards outside moderator rules.',
          'Eliminated players must remain silent until the round concludes.',
          'Moderator rulings on night/day actions are final.',
        ],
      },
      {
        slug: 'english-debate',
        name: 'English Debate',
        image: photo(6950207),
        teamSize: '1 – 2 members',
        roles: ['Speaker', 'Rebuttalist'],
        description:
          'Articulate compelling arguments on technology, ethics, and society in structured parliamentary-style rounds judged on logic, delivery, rebuttal strength, and poise.',
        breakdown: [
          { phase: 'Morning', title: 'Motion Announcement & Prep' },
          { phase: 'Midday', title: 'Preliminary Debate Rounds' },
          { phase: 'Afternoon', title: 'Semi-Finals' },
          { phase: 'Evening', title: 'Grand Final Debate' },
        ],
        rules: [
          'Topics and side assignments (Proposition / Opposition) are announced prior to prep time.',
          'Strict adherence to speaking time limits is enforced by the timekeeper.',
          'Personal attacks or unparliamentary language result in point deductions.',
          'Judges score on content, structure, rebuttal, and delivery.',
        ],
      },
      {
        slug: 'mind-over-matter',
        name: 'Mind over Matter',
        image: photo(6599554),
        teamSize: '1 – 2 members',
        roles: ['Puzzle Solver', 'Lateral Thinker'],
        description:
          'A brain-bending gauntlet of logic puzzles, riddles, pattern recognition, and lateral-thinking challenges that reward sharp observation and calm problem solving.',
        breakdown: gamingBreakdown,
        rules: [
          'Electronic devices and calculators are not allowed unless explicitly permitted for a round.',
          'Teams must solve and submit puzzle sheets before each stage timer expires.',
          'Sharing answers across teams results in disqualification.',
        ],
      },
      {
        slug: 'pubg',
        name: 'PUBG',
        image: photo(4526481),
        teamSize: 'Squad (4 members)',
        roles: ['IGL', 'Assaulter', 'Sniper', 'Support'],
        description:
          'Drop into custom tournament lobbies and battle top student squads across Erangel and Miramar. Placement points and eliminations determine who takes the chicken dinner.',
        breakdown: gamingBreakdown,
        rules: [
          'Matches are played on mobile devices only; emulators and triggers are strictly banned.',
          'Players must bring their own fully charged devices and earphones.',
          'Custom room IDs and passwords are shared 10 minutes before match start.',
          'Any third-party hacks, teaming, or stream-sniping results in permanent squad disqualification.',
          'Official tournament point system (placement + kills) determines standings.',
        ],
      },
      {
        slug: 'tekken-8',
        name: 'Tekken 8',
        image: photo(30512715),
        teamSize: 'Solo',
        roles: ['Fighter'],
        description:
          '1v1 double-elimination fighting game brackets on stage. Lock in your main, read your opponent’s frames, and claim the King of Iron Fist title at CITE 2026.',
        breakdown: gamingBreakdown,
        rules: [
          'Standard 3-round matches (60 seconds per round), Best-of-3 sets (Best-of-5 for Finals).',
          'Standard controllers are provided; players may bring their own compatible controllers.',
          'Stage selection is random for Game 1; loser may counter-pick character or stage.',
          'Pausing mid-round forfeits the current round unless approved by a referee.',
        ],
      },
      {
        slug: 'fc-fifa',
        name: 'FC (FIFA)',
        image: photo(1174746),
        teamSize: 'Solo',
        roles: ['Manager / Player'],
        description:
          'Knockout football action on the pitch. Pick your club, dial in your tactics, and outscore rivals in head-to-head matches leading to the CITE championship final.',
        breakdown: gamingBreakdown,
        rules: [
          'Half-length is 4 minutes (5 minutes for Semi-Finals and Finals); Tactical Defending is mandatory.',
          'Custom edited squads or boosted player stats are strictly prohibited.',
          'Extra time and penalties apply in knockout rounds if tied after 90 minutes.',
          'Referees oversee all controller setups and match restarts.',
        ],
      },
      {
        slug: 'auto-show',
        name: 'Auto Show',
        image: photo(40206185),
        teamSize: 'Vehicle Entry',
        roles: ['Owner / Exhibitor'],
        description:
          'Showcase custom builds, classic rides, and standout bikes on campus. Judged on aesthetics, detailing, audio/modifications, and crowd appeal.',
        breakdown: [
          { phase: 'Morning', title: 'Vehicle Staging & Inspection' },
          { phase: 'Midday', title: 'Public Exhibition & Photos' },
          { phase: 'Afternoon', title: 'Category Judging' },
          { phase: 'Evening', title: 'Best-in-Show Awards' },
        ],
        rules: [
          'All participating vehicles must be parked in designated campus zones before staging closes.',
          'Revving engines excessively, drifting, or burnouts on campus are strictly prohibited.',
          'Owners must follow campus security and organizer marshaling instructions at all times.',
          'Entry passes are required for vehicle admission onto campus.',
        ],
      },
    ],
  },
];

export const events = competitionCategories.flatMap(({ code, title, events: categoryEvents }) =>
  categoryEvents.map((item, idx) => ({
    ...sharedInfo,
    ...item,
    category: title,
    code,
    eventCode: `CITE-${code}${String(idx + 1).padStart(2, '0')}`,
  }))
);

export function getEventBySlug(slug) {
  return events.find((item) => item.slug === slug) || null;
}
