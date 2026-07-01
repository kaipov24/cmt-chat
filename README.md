# CMT Community Platform

A location-based community platform for people with Charcot-Marie-Tooth disease.

This repository is currently at **Phase 4**: profiles, location settings, and communities.

## Scope

The MVP will include registration, login, user profiles, location visibility settings,
aggregated city markers on an interactive globe, country and city communities, public
real-time chat, member lists, basic search, reporting, and moderation.

The platform must not collect or expose exact addresses or precise GPS coordinates.
Globe locations are represented by city-center coordinates and aggregated user counts.

## Repository Layout

```text
apps/
  frontend/       Next.js frontend
  backend/        NestJS backend
packages/
  shared-types/   Shared TypeScript contracts
infrastructure/
  docker/
  kubernetes/
  helm/
  ansible/
  terraform/
  monitoring/
```

## Common Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
```

## Phase 2 Database

The backend uses Prisma with PostgreSQL. Configure `DATABASE_URL` in
`apps/backend/.env` using `apps/backend/.env.example` as the template.

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
```

The initial schema includes users, profiles, communities, community members,
messages, and reports. Seed data uses approximate city-center coordinates only;
it does not represent exact addresses or precise GPS locations.

## Phase 3 Authentication

The backend exposes:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

Passwords are hashed with Argon2. Access and refresh JWTs are set as HTTP-only
cookies; refresh tokens are also hashed before storage in PostgreSQL. Login,
registration, and refresh endpoints are rate limited.

## Phase 4 Profiles And Communities

The backend exposes:

```text
GET    /api/users
GET    /api/users/me/profile
PATCH  /api/users/me/profile
GET    /api/users/:id/profile

GET    /api/locations/countries
GET    /api/locations/cities

GET    /api/communities
GET    /api/communities/:id
POST   /api/communities/:id/join
DELETE /api/communities/:id/leave
GET    /api/communities/:id/members
```

Public profile and member-list responses honor `locationVisibility`. Stored
latitude and longitude are not exposed by these endpoints.

## Medical Disclaimer

This platform is for community support and information sharing only. It does not provide
medical advice, diagnosis, or treatment. Users should consult qualified healthcare
professionals for medical questions.
