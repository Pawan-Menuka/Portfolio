export const sections = [
  ['full-stack', 'Full-stack'], ['blockchain', 'Blockchain'], ['systems', 'Distributed systems'],
  ['hardware', 'Hardware / CNC'], ['creative', 'Creative'],
];
export const sectionLabel = value => sections.find(([id]) => id === value)?.[1] || '';
export const textValue = value => typeof value === 'string' ? value.trim() : '';

export function projectQuery(search) {
  const params = new URLSearchParams(search);
  const section = params.get('section') || '';
  const rawPage = params.get('page') || '1';
  const page = /^\d+$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) && Number(rawPage) > 0 ? Number(rawPage) : 1;
  const invalid = (section !== '' && !sectionLabel(section)) || String(page) !== rawPage;
  const query = new URLSearchParams({ page: String(page), limit: '12' });
  if (sectionLabel(section)) query.set('section', section);
  return { page, section, invalid, query: query.toString() };
}

export function validateProject(project) {
  if (!project || typeof project !== 'object' || !textValue(project.title) || !textValue(project.slug)) throw new Error('Project details are temporarily unavailable.');
  return project;
}
export function validateProjectList(result) {
  if (!Array.isArray(result?.data) || !result.meta || !Number.isInteger(result.meta.total) || result.meta.total < 0 || !Number.isInteger(result.meta.limit) || result.meta.limit < 1 || !Number.isInteger(result.meta.page) || result.meta.page < 1) throw new Error('The project collection returned an unexpected response.');
  result.data.forEach(validateProject);
  return { ...result, meta: { ...result.meta, pages: Math.ceil(result.meta.total / result.meta.limit) } };
}
export function validateMessage(values) {
  const message = { name: values.name.trim(), email: values.email.trim(), subject: values.subject.trim(), body: values.body.trim(), website: values.website || '' };
  const errors = {};
  if (!message.name || message.name.length > 100) errors.name = 'Enter your name (up to 100 characters).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.email)) errors.email = 'Enter a valid email address.';
  if (message.subject.length > 200) errors.subject = 'Keep the subject to 200 characters or fewer.';
  if (message.body.length < 10 || message.body.length > 3000) errors.body = 'Write a message between 10 and 3,000 characters.';
  if (!message.subject) delete message.subject;
  return { message, errors };
}
