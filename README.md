# CMT Community Platform

A location-based community platform for people with Charcot-Marie-Tooth disease.

This repository is currently at **Phase 1**: monorepo structure and configuration.

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

## Phase 1 Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
```

## Medical Disclaimer

This platform is for community support and information sharing only. It does not provide
medical advice, diagnosis, or treatment. Users should consult qualified healthcare
professionals for medical questions.
