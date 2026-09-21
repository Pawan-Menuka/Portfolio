// Education and the descent log are not backend resources. Keep this file to
// facts supplied with the portfolio; project work is rendered from /projects.

export const CV_GROUPS = [
  {
    label: 'Education',
    rows: [
      {
        id: 'sliit',
        role: 'BSc (Hons) Software Engineering',
        org: 'SLIIT — Sri Lanka Institute of Information Technology',
        when: '2023 — 2027',
        points: [
          'Third-year Software Engineering undergraduate, graduating in 2027.',
          'Current focus: full-stack, backend, distributed systems, and blockchain engineering.',
        ],
      },
    ],
  },
];

export const CV_STATS = [
  { value: '2027', label: 'Graduating' },
  { value: '4', label: 'Engineering areas' },
];

export const DESCENT_LOG = [
  {
    depth: '0 m',
    when: '2023',
    title: 'SLIIT, software engineering',
    body: 'Started the BSc (Hons) Software Engineering degree at the Sri Lanka Institute of Information Technology.',
  },
  {
    depth: '18 m',
    when: 'April 2026',
    title: 'Concurrency-safe appointment service',
    body: 'Owned the appointment domain in a group healthcare platform, including Redis slot holds, MongoDB transactions, and event-driven integrations.',
  },
  {
    depth: '57 m',
    when: 'June — July 2026',
    title: 'Impromptu Speech Trainer',
    body: 'Built and deployed an AI speech-coaching platform with audio capture, transcription, rubric-based scoring, and progress tracking.',
  },
  {
    depth: '84 m',
    when: 'July — September 2026',
    title: 'Escrow protocol and Aranya Ceylon',
    body: 'Completed a verified milestone escrow protocol and a dual-market commerce platform with transactional checkout and idempotent payments.',
  },
];

// Shown on About when /profile has no bio yet.
export const ABOUT_FALLBACK = {
  headline: 'I build software the way I build machines: from the frame up, until the thing moves on its own.',
  bio: [
    "I'm a software engineering undergraduate at SLIIT, graduating in 2027. Most of my time goes to full-stack work — the layer people click — but the parts I keep coming back to sit further down: consensus protocols, contract state machines, and stepper motors that don't care how elegant your abstraction is.",
    'The CNC router in my room started as a way to make enclosures for boards I had already soldered. It became the thing that taught me tolerance — that a design is only as good as the last tenth of a millimetre it survives.',
  ],
};
