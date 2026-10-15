---
title: '0.4 Unified signup + login without role split'
type: 'feature'
created: '2026-10-15'
status: 'done'
route: 'one-shot'
---

# 0.4 Unified signup + login without role split

## Intent

**Problem:** Login and signup still presented role-split UX (`?rol=`, conductor self-signup, role subtitles) while identity is capability-based.

**Approach:** One login form, passenger-only public signup, post-login redirect via `primaryHomePath` + `tubi_ui_mode` cookie, with conductor vehicle onboarding when landing in drive mode.

## Suggested Review Order

1. [post-login-path.ts](../../apps/web/src/application/auth/post-login-path.ts) — cookie parse + home path
2. [actions.ts signInAction](../../apps/web/src/application/auth/actions.ts) — cookie read + redirect
3. [login-form.tsx](../../apps/web/src/components/auth/login-form.tsx) — unified UI
4. [registro/conductor/page.tsx](../../apps/web/src/app/registro/conductor/page.tsx) — redirect to `/registro`
5. [post-login-path.test.ts](../../apps/web/src/application/auth/post-login-path.test.ts) — coverage
