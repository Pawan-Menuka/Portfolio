import { createApiClient } from './api-client.js';
const client = createApiClient(import.meta.env.VITE_API_URL);
export const getProfile = (options) => client.request('/profile', options);
export const checkReady = (options) => client.ready(options);
export const getProjects = (query, options) => client.request(`/projects?${query}`, options);
export const getProject = (slug, options) => client.request(`/projects/${encodeURIComponent(slug)}`, options);
export const getSkills = (params = {}, options) => {
  const query = new URLSearchParams(params).toString();
  return client.request(`/skills${query ? `?${query}` : ''}`, options);
};
export const getCertifications = (options) => client.request('/certifications', options);
export const sendMessage = (message, options) => client.request('/messages', { ...options, method: 'POST', body: JSON.stringify(message) });
