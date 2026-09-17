export const journeyLabels = Object.freeze([
  { id: 'full-stack', title: 'Full-stack', t: 0.14, description: 'Explore full-stack projects.', href: '/projects?section=full-stack' },
  { id: 'blockchain', title: 'Blockchain', t: 0.39, description: 'Explore blockchain projects.', href: '/projects?section=blockchain' },
  { id: 'systems', title: 'Distributed Systems', t: 0.53, description: 'Explore distributed systems projects.', href: '/projects?section=systems' },
  { id: 'hardware', title: 'Hardware / CNC', t: 0.67, description: 'Explore hardware and CNC projects.', href: '/projects?section=hardware' },
  { id: 'creative', title: 'Music', t: 0.81, description: 'Explore music projects.', href: '/projects?section=creative' },
  { id: 'contact', title: 'Contact', t: 1, description: 'Start a conversation.', href: '/contact' },
].map(Object.freeze));

export function labelOpacity(progress, stop) {
  // Ease in before arrival and linger after departure, with separate windows
  // so the previous label is fully gone before the next begins.
  const distance = Math.abs(progress - stop);
  const fade = Math.max(0, Math.min(1, (.055 - distance) / .035));
  return fade * fade * (3 - 2 * fade);
}
