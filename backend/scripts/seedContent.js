import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { Profile } from '../src/models/Profile.js';
import { Project } from '../src/models/Project.js';
import { Skill } from '../src/models/Skill.js';
import { updateProfileSchema } from '../src/validators/profile.validator.js';
import { createProjectSchema } from '../src/validators/project.validator.js';
import { createSkillSchema } from '../src/validators/skill.validator.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(scriptDir, '../data');

async function readJson(name) {
  return JSON.parse(await readFile(path.join(dataDir, name), 'utf8'));
}

function validImage(image) {
  if (!image || typeof image !== 'object') return undefined;
  if (!image.url?.trim() || !image.publicId?.trim()) return undefined;
  return image;
}

function normalizeProfile(input) {
  const { legalName: _legalName, ...profile } = input;
  const avatar = validImage(profile.avatar);
  const ogImage = validImage(profile.seo?.ogImage);

  if (avatar) profile.avatar = avatar;
  else delete profile.avatar;

  if (profile.seo) {
    profile.seo = { ...profile.seo };
    if (ogImage) profile.seo.ogImage = ogImage;
    else delete profile.seo.ogImage;
  }

  return updateProfileSchema.parse(profile);
}

function normalizeProject(input) {
  const project = { ...input };
  const coverImage = validImage(project.coverImage);
  if (coverImage) project.coverImage = coverImage;
  else delete project.coverImage;
  project.gallery = (project.gallery ?? []).map(validImage).filter(Boolean);
  project.models3d = (project.models3d ?? []).map(validImage).filter(Boolean);
  return createProjectSchema.parse(project);
}

async function upsertDocument(Model, filter, data) {
  const existing = await Model.findOne(filter);
  if (existing) {
    existing.set(data);
    await existing.save();
    return 'updated';
  }
  await Model.create(data);
  return 'created';
}

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');

  const [profileInput, projectInputs, skillInputs] = await Promise.all([
    readJson('profile.seed.json'),
    readJson('projects.seed.json'),
    readJson('skills.seed.json'),
  ]);

  const profile = normalizeProfile(profileInput);
  const projects = projectInputs.map(normalizeProject);
  const skills = skillInputs.map((skill) => createSkillSchema.parse(skill));

  await mongoose.connect(process.env.MONGODB_URI);

  const profileResult = await upsertDocument(Profile, { singleton: 'main' }, { singleton: 'main', ...profile });
  const projectResults = { created: 0, updated: 0 };
  for (const project of projects) {
    projectResults[await upsertDocument(Project, { slug: project.slug }, project)] += 1;
  }

  const skillResults = { created: 0, updated: 0 };
  for (const skill of skills) {
    skillResults[await upsertDocument(Skill, { name: skill.name, category: skill.category }, skill)] += 1;
  }

  console.log(`Profile: ${profileResult}`);
  console.log(`Projects: ${projectResults.created} created, ${projectResults.updated} updated`);
  console.log(`Skills: ${skillResults.created} created, ${skillResults.updated} updated`);
  console.log('Note: legalName is retained in the seed file but is not imported because the current Profile schema has no legalName field.');
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
