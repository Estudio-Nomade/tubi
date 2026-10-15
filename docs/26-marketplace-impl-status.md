# Marketplace implementation status

**Branch:** `feat/unified-identity-capabilities`  
**Worktree:** `.worktrees/feat-unified-identity`  
**Spec:** `docs/superpowers/specs/2026-10-14-marketplace-viajes-compartidos-design.md`  
**Plan:** `docs/superpowers/plans/2026-10-14-marketplace-viajes-compartidos.md`

## Done on this branch

### Fase 0 — Auth unificada
- Capabilities on `profiles` (`is_passenger/driver/operator`, `driver_kyc_status`)
- Migration `0037_unified_identity_capabilities.sql`
- Login único, switch **Viajar | Conducir**, guards por capability
- Cookie `tubi_ui_mode` (Next 16 Server Actions)

### Fase 1 — KYC
- Port `IdentityVerifier` + Didit adapter + manual stub
- Webhook `/api/webhooks/didit` (X-Signature-V2 / Simple)
- Funnel `/conductor/kyc` (+ callback + manual-complete)
- Migration `0038_driver_kyc_sessions.sql`
- **Envs Didit (humano):** `DIDIT_API_KEY`, `DIDIT_WORKFLOW_ID`, `DIDIT_WEBHOOK_SECRET`
- **VAPID (agente):** pública en `.env.example`; privada en `.env.local`

### Fase 2 — offer_source
- `viaje.offer_source` peer | tubi_operated
- Badge **Operado por Tubi**
- RPC `publicar_viaje_peer` + `crear_viaje` exige driver verified
- UI `/conductor/publicar`
- Migration `0039_viaje_offer_source.sql` + setting `marketplace.enabled`

### Fase 3 foundation — solicitud / seña %
- Settings `deposit.pct`, timeouts
- Columnas `request_*` en reserva
- `compute_sena_monto(precio)`
- Migration `0040_seat_request_and_deposit_pct.sql`
- Domain waterfall tests (`domain/money/commission-waterfall`)

### Fase 4 foundation — waterfall
- Pure function `computePeerWaterfall` + tests (settlement S vs C)

### Fase 6–7 foundation — chat + notifs + detective
- Tables chat_thread/message, push_subscription, notification_outbox, detective_signal
- Bypass filter domain tests
- VAPID helpers + enqueue notification
- Migration `0041_chat_and_notifications.sql`

## Not fully wired yet (next sessions on same branch)

| Area | Gap |
|---|---|
| Solicitud UI end-to-end | Replace legacy “reservar” with request→accept RPCs + screens |
| Accept/reject conductor | RPC + UI solicitudes entrantes |
| Chat UI | Thread page post-seña + Realtime |
| Push send worker | web-push send using VAPID private |
| Detective operator UI | List open signals |
| Places A→B | Catalog matching beyond current ruta strings |
| Commission ledger | `CommissionObligation` table + liquidación UX |

## Verify locally

```bash
cd .worktrees/feat-unified-identity
# apply migrations
supabase db reset   # or migration up

cd apps/web
bun test src/domain
bun run type-check

# Didit: set envs then open /conductor/kyc
# Marketplace peer: set settings marketplace.enabled = true
```

## Self-review (2026-10-15)

- type-check: green
- domain tests: green (waterfall, bypass, capabilities, KYC map, Didit sig)
- No MapLibre / GPS introduced
- Chat is the product channel (tables ready; UI pending)
- Secrets: Didit human-owned; VAPID generated; no private keys in git
- Merge: **only after human multi-pass testing** (per product owner)
