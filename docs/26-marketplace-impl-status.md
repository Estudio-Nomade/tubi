# Marketplace implementation status

**Branch:** `feat/unified-identity-capabilities`  
**Worktree:** `.worktrees/feat-unified-identity`

## Done

Fases 0–7 + **0044 security hardening** (self-review CRITICAL fixes).

### 0044 fixes (additive — safe with `migration up`)
- GRANTs on kyc/chat/outbox/detective/commission tables  
- Capability columns protected (trigger); KYC via `set_driver_kyc_pending` / `apply_driver_kyc_result`  
- Seña only if `request_status` null|accepted + deposit timeout  
- `crear_reserva` rejects peer (`USE_SOLICITAR_ASIENTO`); occupancy = accepted/legacy only  
- `enqueue_notification` self-only; trip RPCs notify via internal helper  
- Commission opens on **completar_viaje** (abordada); waived on cancel/no-show  
- `vencer_solicitudes` + cron route; accept rejects leftover when full  
- Manual KYC blocked in production unless `ALLOW_MANUAL_KYC=true`  
- `requireProfile(["conductor"])` = `canDrive` only  

## Preserve existing users (NO db reset)

Users live on stack **Tubi :54322** (not worktree 54422).

```bash
# Backup
pg_dump "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  --schema=auth -f /tmp/tubi_auth.sql
pg_dump "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  --schema=public -f /tmp/tubi_public.sql

# Forward only (0036…0044)
cd .worktrees/feat-unified-identity
npx supabase migration up \
  --db-url "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# App .env.local → API http://127.0.0.1:54321 (same stack)
```

Post-0037 conductores quedan `unverified` hasta KYC (o demo UPDATE).

## Cron jobs

```bash
curl -X POST http://localhost:3000/api/jobs/vencer-solicitudes \
  -H "Authorization: Bearer $CRON_SECRET"
curl -X POST http://localhost:3000/api/jobs/push-outbox \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Still polish
- Liquidación UX conductor  
- Push client subscribe  
- Chat Realtime  
- Detective side-effects (pause account)
