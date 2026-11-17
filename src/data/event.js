// ---------------------------------------------------------------------------
// Central event configuration for CITE Competition 2026
// ---------------------------------------------------------------------------
export const event = {
  name: 'CITE Hackathon',
  edition: '2026',
  tagline: 'Pakistan’s National Student Hackathon',
  durationLabel: 'One-Day National Hackathon',

  // ISO 8601 with timezone (+05:00 = Pakistan Standard Time).
  startDate: '2026-12-18T09:00:00+05:00',
  endDate: '2026-12-18T20:00:00+05:00',

  dateLabel: 'December 18, 2026',
  venue: 'COMSATS University Islamabad, Abbottabad Campus',
  venueShort: 'CUI Abbottabad Campus',
  city: 'Abbottabad, Pakistan',

  registrationUrl: 'https://forms.gle/replace-with-your-form',

  contact: {
    email: 'cite.competition@cuiatd.edu.pk',
    phone: '+92 992 0000000',
    address: 'University Road, Tobe Camp, Abbottabad 22060, KP, Pakistan',
  },

  socials: [
    { label: 'Facebook', href: 'https://facebook.com/', icon: 'Facebook' },
    { label: 'Instagram', href: 'https://instagram.com/', icon: 'Instagram' },
    { label: 'LinkedIn', href: 'https://linkedin.com/', icon: 'Linkedin' },
    { label: 'X (Twitter)', href: 'https://x.com/', icon: 'Twitter' },
    { label: 'GitHub', href: 'https://github.com/', icon: 'Github' },
  ],

  stats: [
    { value: 800, suffix: '+', label: 'Participants' },
    { value: 150, suffix: '+', label: 'Teams' },
    { value: 11, suffix: ' hrs', label: 'Full-Day Competition' },
    { value: 600, prefix: 'PKR ', suffix: 'K+', label: 'Prize Pool' },
  ],

  university: {
    name: 'COMSATS University Islamabad',
    campus: 'Abbottabad Campus',
    shortName: 'CUI Abbottabad',
    established: '2001',
    department: 'Department of Computer Science',
    society: 'CITE Society',
    badges: ['HEC Recognized', 'NCEAC Accredited', 'Dept. of Computer Science', '40+ Universities'],
    facts: [
      {
        icon: 'GraduationCap',
        title: 'Department of Computer Science',
        description: 'Home of the CITE Society and one of the campus’s largest computing cohorts.',
      },
      {
        icon: 'Landmark',
        title: 'Established 2001',
        description: 'A HEC-recognized COMSATS campus nestled in the mountain foothills of Abbottabad.',
      },
      {
        icon: 'FlaskConical',
        title: 'CS Labs & Gigabit Network',
        description: 'Dedicated workstation labs, power backup, and dual-redundant campus Wi-Fi.',
      },
      {
        icon: 'Building2',
        title: 'Auditorium, Dining & Campus Support',
        description: 'A 500-seat auditorium, prayer areas, dining facilities, and secure rest areas across campus.',
      },
      {
        icon: 'Award',
        title: 'NCEAC-Accredited Programs',
        description: 'Computing degrees accredited by the National Computing Education Accreditation Council.',
      },
      {
        icon: 'Network',
        title: 'CUI ORIC Innovation Ecosystem',
        description: 'Incubation, IP support, and industry linkage through the campus ORIC office.',
      },
    ],
  },
};
