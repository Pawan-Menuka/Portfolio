# Portfolio Content Consumption and Seed Format

## Current content architecture

The current frontend is still connected to the MongoDB-backed API. It does not import standalone Markdown files as its primary content source.

| Content | Current source |
| --- | --- |
| Project collection and project detail pages | MongoDB through `GET /projects` and `GET /projects/:slug` |
| Name, headline, biographies, location, social links, availability, avatar, and resume | MongoDB through `GET /profile` |
| Skills | MongoDB through `GET /skills` |
| Certifications | MongoDB through `GET /certifications` |
| Contact submissions | Saved through `POST /messages` |
| CV experience, education, and statistics | Currently hardcoded in the frontend |
| About-page descent timeline | Currently hardcoded in the frontend |
| Landing hero copy and iceberg checkpoint labels | Currently hardcoded in the frontend |
| General page headings and thematic copy | Currently hardcoded in the frontend |

The frontend API calls are defined in `frontend/src/lib/api.js`. The complete backend contract is documented in `API-CONTRACT.md`.

## Project schema

Projects now use `section` instead of the older `category` property.

```json
{
  "title": "Project name",
  "slug": "project-name",
  "section": "full-stack",
  "summary": "Short description shown in the project collection.",
  "description": "## Case study\n\nLonger content written as Markdown.",
  "tags": ["React", "Node.js", "MongoDB"],
  "coverImage": {
    "url": "https://...",
    "publicId": "portfolio/project-cover"
  },
  "gallery": [],
  "models3d": [],
  "links": {
    "github": "https://github.com/...",
    "live": "https://...",
    "demo": ""
  },
  "meta": {},
  "featured": true,
  "order": 1,
  "status": "published"
}
```

Valid project sections are:

```text
full-stack
blockchain
systems
hardware
creative
```

Public project pages only return records whose `status` is `published`.

## How Markdown is used

Markdown may be stored inside API fields such as:

- `project.description`
- `profile.bio`

The Markdown remains a string inside the JSON document stored in MongoDB. The frontend renders it safely with `react-markdown` and `rehype-sanitize` through `frontend/src/components/Markdown.jsx`.

Separate `.md` files are therefore unnecessary for individual project descriptions or the profile biography.

## Recommended real-content files

Provide the API-managed content as structured JSON:

1. `profile.seed.json`
2. `projects.seed.json`
3. `skills.seed.json`
4. `certifications.seed.json`

Also provide:

- The real CV as a PDF.
- Project images and 3D model assets, or their hosted URLs.
- One document containing the content that is currently owned by the frontend:
  - Experience and education entries.
  - CV statistics.
  - About-page descent timeline.
  - Landing-page wording.
  - Iceberg checkpoint names and descriptions.

That final document may be JSON or Markdown because its contents must currently be translated into frontend configuration rather than inserted into an existing backend model.

## Profile seed shape

```json
{
  "name": "Pawan Menuka",
  "headline": "Software Engineering Undergraduate · Full-stack · SLIIT '27",
  "shortBio": "A concise introduction for cards and the CV page.",
  "bio": "## About me\n\nA longer biography written as Markdown.",
  "roles": ["Full-stack Developer", "Software Engineering Undergraduate"],
  "location": "Sri Lanka",
  "avatar": {
    "url": "https://...",
    "publicId": "portfolio/avatar"
  },
  "socials": {
    "github": "https://github.com/...",
    "linkedin": "https://linkedin.com/in/...",
    "email": "name@example.com",
    "website": "https://..."
  },
  "availability": {
    "available": true,
    "text": "Open to internship opportunities"
  },
  "seo": {
    "title": "Pawan Menuka · Portfolio",
    "description": "Portfolio description",
    "ogImage": {
      "url": "https://...",
      "publicId": "portfolio/og-image"
    }
  }
}
```

The resume is uploaded separately through the profile resume endpoint and should not be included in a profile update body.

## Skill seed shape

```json
{
  "name": "React",
  "category": "software",
  "level": 4,
  "icon": "",
  "yearsOfExperience": 2,
  "description": "Building accessible, responsive React applications.",
  "order": 1
}
```

Valid skill categories are:

```text
software
blockchain
engineering
creative
```

## Certification seed shape

```json
{
  "name": "Certification name",
  "issuer": "Issuer name",
  "category": "software",
  "issueDate": "2026-01-15T00:00:00.000Z",
  "expiryDate": null,
  "credentialId": "CREDENTIAL-ID",
  "verifyUrl": "https://...",
  "badgeImage": {
    "url": "https://...",
    "publicId": "portfolio/certification-badge"
  },
  "featured": true,
  "order": 1
}
```

Valid certification categories are:

```text
software
blockchain
engineering
other
```

## Recommended import workflow

After the real content is supplied:

1. Validate every JSON file against the backend schemas.
2. Upload or verify referenced media assets.
3. Add an idempotent seed/import script so rerunning it does not create duplicates.
4. Import the profile, projects, skills, and certifications into MongoDB.
5. Upload the CV PDF through the dedicated resume endpoint.
6. Replace the remaining frontend placeholder content.
7. Verify the landing, Projects, project detail, About, CV, and Contact pages with the real data.

## Decision

Use seed JSON for profile, projects, skills, and certifications. Use Markdown only inside supported JSON string fields such as `description` and `bio`. Standalone prose Markdown files should not be used as the primary source for API-managed content.
