// ---------------------------------------------------------------------------
// Central event configuration for CITE Competition 2026
// ---------------------------------------------------------------------------
export const event = {
  name: 'CITE Hackathon',
  edition: '2026',
  tagline: 'Pakistan’s National Student Hackathon',
  durationLabel: 'One-Day National Hackathon',

  // ISO 8601 with timezone (+05:00 = Pakistan Standard Time).
  startDate: '2026-12-12T09:00:00+05:00',
  endDate: '2026-12-12T18:00:00+05:00',

  dateLabel: 'December 12, 2026',
  venue: 'COMSATS University Islamabad, Abbottabad Campus',
  venueShort: 'CUI Abbottabad Campus',
  city: 'Abbottabad, Pakistan',

  registrationUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSexY_oBWawkkl_VnpwFKj1serx18AtJO_a5HVt4Ex9Z-6oLpw/viewform',

  contact: {
    email: 'cite@cuiatd.edu.pk',
    phone: '+92 992 0000000',
    address: 'CUI Abbotabad, Dhamtour (SUB-CAMPUS), Abbottabad, Pakistan',
  },

  socials: [
    { label: 'Instagram', href: 'https://www.instagram.com/cite.comsats/', icon: 'Instagram' },
  ],

  stats: [
    { value: 800, suffix: '+', label: 'Participants' },
    { value: 150, suffix: '+', label: 'Teams' },
    { value: 9, suffix: ' hrs', label: 'Full-Day Competition' },
  ],

  university: {
    name: 'COMSATS University Islamabad',
    campus: 'Abbottabad Campus',
    shortName: 'CUI Abbottabad',
    established: '2001',
    department: 'Department of Computer Science',
    society: 'CITE Society',
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
        icon: 'Award',
        title: 'NCEAC-Accredited Programs',
        description: 'Computing degrees accredited by the National Computing Education Accreditation Council.',
      },
    ],
  },
};
