// The Project model's `section` enum, mapped to the dive metaphor the pages
// are built on. Order here is the order strata appear on Projects and CV.
export const SECTIONS = [
  { key: 'full-stack', label: 'Full-stack', depth: 0 },
  { key: 'blockchain', label: 'Blockchain', depth: 18 },
  { key: 'systems', label: 'Distributed Systems', depth: 34 },
  { key: 'hardware', label: 'Hardware / CNC', depth: 50 },
  { key: 'creative', label: 'Music', depth: 66 },
];

export const SECTION_BY_KEY = Object.fromEntries(SECTIONS.map((s) => [s.key, s]));

export function sectionLabel(key) {
  return SECTION_BY_KEY[key]?.label ?? key;
}

export function sectionDepth(key) {
  const depth = SECTION_BY_KEY[key]?.depth;
  return depth === undefined ? '' : `${depth} m`;
}

// Skill.category enum → the About page's instrument panel headings.
export const SKILL_CATEGORIES = [
  { key: 'software', label: 'Software' },
  { key: 'blockchain', label: 'Blockchain' },
  { key: 'engineering', label: 'Engineering' },
  { key: 'creative', label: 'Creative' },
];
