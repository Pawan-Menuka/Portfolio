# Launch environment matrix

Recorded: 2026-09-12 (Asia/Colombo)

This file records intended values and ownership without storing credentials. Secret values must be provisioned in each host's secret manager and must never be committed.

## URL and topology decision

| Environment | Frontend origin | Backend API origin | Status |
| --- | --- | --- | --- |
| Local | `http://localhost:5173` | `http://localhost:5000/api/v1` | Confirmed by `.env.example` files |
| Staging | `https://staging.pawanmenuka.com` | `https://api-staging.pawanmenuka.com/api/v1` | Intended; DNS and hosting still need provisioning |
| Production | `https://pawanmenuka.com` | `https://api.pawanmenuka.com/api/v1` | Intended; frontend domain is also present in approved profile content |

Staging and production use subdomains of the same registrable site, `pawanmenuka.com`. This is compatible with the current `SameSite=Lax` authentication-cookie design. If hosting cannot provide this topology, the preferred fallback is to proxy `/api/v1` through the corresponding frontend host. A cross-site topology must not be substituted without a separate cookie and CSRF review.

## Variable matrix

| Variable | Local | Staging | Production |
| --- | --- | --- | --- |
| `VITE_API_URL` | `http://localhost:5000/api/v1` | `https://api-staging.pawanmenuka.com/api/v1` | `https://api.pawanmenuka.com/api/v1` |
| `NODE_ENV` | `development` | `production` | `production` |
| `MONGODB_URI` | Dedicated development database | Dedicated staging database | Dedicated production database |
| `JWT_SECRET` | Local-only secret | Unique staging secret | Unique production secret |
| `FRONTEND_ORIGINS` | `http://localhost:5173` | `https://staging.pawanmenuka.com` | `https://pawanmenuka.com` |
| `PREVIEW_ORIGIN_REGEX` | Empty | Empty by default; anchored project-specific regex only if rotating previews are approved | Empty |
| Cloudinary variables | Development account/folder | Isolated staging account/folder | Production account/folder |
| Resend/contact variables | Disabled or test destination | Controlled staging destination | Real notification destination |
| Admin credentials | Local admin | Unique staging admin | Unique production admin |

## Ownership and provisioning gates

- Owner for domain, DNS, hosting, databases, media, email delivery, and secret provisioning: Pawan Menuka.
- The repository defines the intended origins, but it does not contain deployment-provider configuration proving that DNS, TLS, databases, or secret-manager values have been provisioned.
- Before Phase 1 production-like integration, confirm that the two staging hostnames resolve over HTTPS and provision all staging secrets.
- Before production deployment, confirm both production hostnames, canonical redirects, TLS, exact CORS origins, and separate staging/production credentials.
