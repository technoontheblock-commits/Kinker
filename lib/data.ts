export interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  endTime?: string;
  description: string;
  fullDescription: string;
  lineup: string[];
  image: string;
  ticketUrl: string;
  type: 'clubnight' | 'festival' | 'special';
  price: string;
  timetable?: { time: string; artist: string }[];
}

export const events: Event[] = [
  {
    id: 'techno-tuesday-001',
    name: 'TECHNO TUESDAY',
    date: '2026-04-07',
    time: '23:00',
    endTime: '06:00',
    description: 'Weekly underground techno session with local and international DJs.',
    fullDescription: 'Join us every Tuesday for the darkest techno night in Basel. Our residents and guest DJs deliver uncompromising hard techno in an intimate warehouse setting. No commercial nonsense, just pure underground energy.',
    lineup: ['Marco Bailey', 'Basel Underground Collective', 'KINKER Residents'],
    image: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?q=80&w=2070&auto=format&fit=crop',
    ticketUrl: '#tickets',
    type: 'clubnight',
    price: 'CHF 25',
    timetable: [
      { time: '23:00', artist: 'KINKER Residents' },
      { time: '01:00', artist: 'Basel Underground Collective' },
      { time: '03:00', artist: 'Marco Bailey' },
      { time: '05:00', artist: 'B2B Closing' },
    ],
  },
  {
    id: 'hard-sessions-042',
    name: 'HARD SESSIONS #42',
    date: '2026-04-12',
    time: '22:00',
    endTime: '08:00',
    description: 'Industrial hard techno all night long. Bring your energy.',
    fullDescription: 'Hard Sessions returns for its 42nd edition. We are bringing the hardest industrial techno to Basel\'s most iconic underground venue. Expect distorted kicks, relentless energy, and a crowd that knows how to rave.',
    lineup: ['SNTS', 'Somniac One', 'Nico Moreno', 'KOR'], 
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop',
    ticketUrl: '#tickets',
    type: 'special',
    price: 'CHF 35',
    timetable: [
      { time: '22:00', artist: 'KOR' },
      { time: '00:00', artist: 'Somniac One' },
      { time: '02:00', artist: 'Nico Moreno' },
      { time: '04:00', artist: 'SNTS' },
      { time: '06:30', artist: 'Closing Set' },
    ],
  },
  {
    id: 'basement-rave-003',
    name: 'BASEMENT RAVE',
    date: '2026-04-18',
    time: '23:59',
    endTime: '10:00',
    description: 'Illegal vibes in a legal space. Raw, unfiltered techno.',
    fullDescription: 'Basement Rave captures the spirit of the 90s illegal warehouse parties. Low ceilings, massive sound, strobe lights, and a crowd united by the love of hard techno. Limited capacity - get your tickets early.',
    lineup: ['DAX J', '999999999', 'I Hate Models', 'KINKER Residents'],
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop',
    ticketUrl: '#tickets',
    type: 'special',
    price: 'CHF 40',
    timetable: [
      { time: '23:59', artist: 'KINKER Residents' },
      { time: '01:30', artist: '999999999' },
      { time: '03:30', artist: 'I Hate Models' },
      { time: '05:30', artist: 'DAX J' },
      { time: '08:00', artist: 'Afterhours' },
    ],
  },
  {
    id: 'schwarz-nacht-015',
    name: 'SCHWARZ NACHT',
    date: '2026-04-25',
    time: '23:00',
    endTime: '07:00',
    description: 'Dark techno and EBM fusion night. Dress in black.',
    fullDescription: 'Schwarz Nacht blends the hardest techno with EBM and darkwave influences. A night for those who like their music dark, aggressive, and unrelenting. All-black dress code encouraged but not required.',
    lineup: ['Ancient Methods', 'Phase Fatale', 'Schwefelgelb', 'Blush Response'],
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop',
    ticketUrl: '#tickets',
    type: 'clubnight',
    price: 'CHF 30',
    timetable: [
      { time: '23:00', artist: 'Blush Response' },
      { time: '01:00', artist: 'Schwefelgelb' },
      { time: '03:00', artist: 'Phase Fatale' },
      { time: '05:00', artist: 'Ancient Methods' },
    ],
  },
  {
    id: 'kinker-festival-2026',
    name: 'KINKER FESTIVAL 2026',
    date: '2026-05-15',
    time: '14:00',
    endTime: '12:00',
    description: 'Our annual outdoor festival. 3 stages, 24 hours of techno.',
    fullDescription: 'The biggest event of the year. KINKER Festival transforms an industrial outdoor location into techno heaven. Three stages, world-class lineup, and 24 hours of non-stop dancing. Camping available.',
    lineup: ['Amelie Lens', 'Charlotte de Witte', 'Nina Kraviz', 'Adam Beyer', 'Enrico Sangiuliano', 'Josef K', 'and many more...'],
    image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=2070&auto=format&fit=crop',
    ticketUrl: '#tickets',
    type: 'festival',
    price: 'CHF 85',
  },
  {
    id: 'acid-madness-007',
    name: 'ACID MADNESS',
    date: '2026-05-02',
    time: '23:00',
    endTime: '08:00',
    description: '303 overload. Acid techno from the underground.',
    fullDescription: 'A night dedicated to the Roland TB-303 and all things acid. From classic Chicago acid to modern hard acid techno, this night will make your teeth rattle and your mind expand.',
    lineup: ['Hardfloor', 'Plastikman', 'Regal', 'Boston 168'],
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=2070&auto=format&fit=crop',
    ticketUrl: '#tickets',
    type: 'clubnight',
    price: 'CHF 28',
  },
];

export const clubInfo = {
  name: 'KINKER BASEL',
  tagline: 'HARD TECHNO IN BASEL',
  address: 'Barcelona-Strasse 4',
  city: '4142 Münchenstein',
  country: 'Switzerland',
  coordinates: { lat: 47.5653, lng: 7.5853 },
  openingHours: {
    friday: '23:00 - 07:00',
    saturday: '23:00 - 07:00',
  },
  entryRules: [
    'Age 20+',
    'Valid ID required',
    'No photo/video policy',
    'Respect the space & each other',
    'Zero tolerance for discrimination',
  ],
  faq: [
    {
      question: 'What is the age limit?',
      answer: 'You must be 20 years or older to enter. Valid ID (passport, ID card, or driver\'s license) is required at the door.',
    },
    {
      question: 'Can I take photos or videos?',
      answer: 'No. We have a strict no-photo and no-video policy to protect the privacy and freedom of our guests. Phones must be kept in your pocket.',
    },
    {
      question: 'Is there a dress code?',
      answer: 'No formal dress code, but we encourage dark, expressive styles that fit the techno culture. Wear what makes you comfortable for dancing all night.',
    },
    {
      question: 'Do you have a cloakroom?',
      answer: 'Yes, we have a supervised cloakroom. Price is CHF 5 per item.',
    },
    {
      question: 'Can I pay by card?',
      answer: 'Yes, we accept both cash and cards at the bar and entrance.',
    },
    {
      question: 'Is the venue wheelchair accessible?',
      answer: 'Unfortunately, due to the building\'s industrial heritage, the venue is not fully wheelchair accessible. Please contact us in advance for assistance.',
    },
  ],
  values: [
    {
      title: 'SAFE SPACE',
      description: 'We are committed to providing a safe environment for everyone. Harassment of any kind is not tolerated.',
    },
    {
      title: 'NO DISCRIMINATION',
      description: 'Everyone is welcome regardless of race, gender, sexual orientation, religion, or background.',
    },
    {
      title: 'RESPECT & CONSENT',
      description: 'Respect personal boundaries. Consent is mandatory. Look out for each other.',
    },
    {
      title: 'UNDERGROUND CULTURE',
      description: 'We preserve the spirit of underground techno - authentic, raw, and community-driven.',
    },
  ],
};
