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

### Fase 3 — solicitud → aceptación + seña %
- Settings `deposit.pct`, timeouts + columnas `request_*`
- `compute_sena_monto(precio)`
- Migration `0040` + **`0042_solicitar_aceptar_asiento.sql`**
- RPCs: `solicitar_asiento`, `aceptar_solicitud`, `rechazar_solicitud`
- `asientos_libres_viaje` no cuenta bare `requested` (solo accepted/legacy)
- UI pasajero: peer → **Solicitar asiento** + `/pasajero/reservas/[id]/solicitud`
- UI conductor: `/conductor/solicitudes` (aceptar/rechazar) + link en home
- Notifs outbox via `enqueue_notification` (security definer)

### Fase 4 foundation — waterfall
- Pure function `computePeerWaterfall` + tests (settlement S vs C)

### Fase 6 — chat post-seña
- Tables + bypass filter (0041)
- RPCs `ensure_chat_thread`, `enviar_mensaje_chat` (flag → detective)
- UI `/pasajero/reservas/[id]/chat` y `/conductor/reservas/[id]/chat`
- (Realtime still optional polish)

### Fase 7 foundation — notifs + detective
- VAPID helpers + outbox enqueue
- detective_signal table + RLS operator
- Push send worker + detective UI still pending

## Still open

| Area | Gap |
|---|---|
| Push send worker | web-push send using VAPID private |
| Detective operator UI | List open signals |
| Places A→B | Catalog matching beyond current ruta strings |
| Commission ledger | `CommissionObligation` table + liquidación UX |
| Chat Realtime | Optional live refresh |

## Verify locally

```bash
cd .worktrees/feat-unified-identity
supabase db reset   # or migration up (0040–0042)

cd apps/web
bun test src/domain
bun run type-check

# Peer smoke: marketplace.enabled=true → publicar → solicitar → aceptar → seña → chat
```

## Self-review (2026-10-15 cont.)

- type-check: green
- domain tests: 90 pass
- Peer book path wired; Tubi instant book unchanged
- No MapLibre / GPS
- Chat is sole contact channel post-seña
