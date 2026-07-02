# CMT Community Platform

A location-based community platform for people with Charcot-Marie-Tooth disease.

This repository is currently at **Phase 13**: direct user messaging.

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

## Phase 5 Globe Home Page

The home page fetches:

```text
GET /api/locations/globe
GET /api/communities
```

The globe uses aggregated city markers with city-center coordinates only. It
does not expose exact addresses or precise GPS locations.

## Phase 6 Community Chat

The backend exposes:

```text
GET  /api/communities/:id/messages
POST /api/communities/:id/messages
```

Community pages show group details, recent public messages, and a composer.
Posting requires authentication and community membership.

## Phase 7 Profile Settings And Avatar Upload

The settings page lets authenticated users update profile details and upload an
avatar image. Uploaded avatars are stored locally under `apps/backend/uploads`
and served from:

```text
POST /api/users/me/avatar
GET  /uploads/avatars/:filename
```

## Phase 8 Member Discovery And Public Profiles

The frontend now uses the profile APIs for searchable member discovery and
username-based public profile pages:

```text
GET /members
GET /profile/:username
GET /api/users/by-username/:username/profile
```

## Phase 9 Reporting And Moderation Review

Authenticated users can report public profiles or chat messages. Moderators and
admins can list submitted reports for review.

```text
POST /api/reports
GET  /api/reports
GET  /moderation
```

## Phase 10 Moderation Actions

Moderators and admins can update report status. Admins can also suspend the
reported user while resolving a report.

```text
PATCH /api/reports/:id
```

## Phase 11 User-Created Communities

Authenticated users can create city, country, or topic communities. The creator
is automatically added as the community admin.

```text
POST /api/communities
GET  /communities
```

## Phase 12 Community Membership Chat Flow

Community pages now show real membership state. Signed-in users can join or
leave a community from the page, and posting guidance points users to the
membership action instead of a generic login route.

```text
GET    /api/communities/:id/membership
POST   /api/communities/:id/join
DELETE /api/communities/:id/leave
```

## Phase 13 Direct User Messaging

Authenticated users can start direct conversations from member profiles, list
their conversations, and send one-to-one messages.

```text
POST /api/direct-messages/conversations
GET  /api/direct-messages/conversations
GET  /api/direct-messages/conversations/:id/messages
POST /api/direct-messages/conversations/:id/messages
GET  /messages
```

## Medical Disclaimer

This platform is for community support and information sharing only. It does not provide
medical advice, diagnosis, or treatment. Users should consult qualified healthcare
professionals for medical questions.
