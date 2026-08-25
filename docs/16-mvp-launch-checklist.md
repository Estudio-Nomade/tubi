# MVP launch checklist

Checklist go/no-go antes de demo o staging operable. Marcar en local y en el entorno de demo.

## DB

- [ ] Migraciones `0001` → `0019` aplicadas (`supabase db reset` o migrate up)
- [ ] Seed demo solo en local/staging (no producción)
- [ ] Storage bucket `comprobantes` OK (subir seña)
- [ ] Settings de negocio legibles (seña, espera, devolución) sin hardcode en UI

## Smoke por rol (5–7 min)

### Pasajero (Ana · `pasajero.demo@tubi.local` / `demo-demo-1`)

- [ ] Login → home con viaje / reservas
- [ ] Buscar → reservar (viaje catálogo) → seña (opcional si ya hay pendiente)
- [ ] **Mis reservas** → reserva `confirmada` → **Ver QR**
- [ ] Pase vacío (si no hay confirmada) muestra CTA a reservas / buscar

### Conductor (Luis · `conductor.demo@tubi.local` / `demo-demo-1`)

- [ ] Home: viaje de hoy (07:00) programado con 3 confirmadas
- [ ] **Empezar recogida** → hub C5 con timer
- [ ] Escanear QR (o Plan B token) → cobrar saldo → abordada
- [ ] **No llegó** en otro pasajero
- [ ] Viaje `en_curso` (14:00 seed) → **Finalizar viaje** → `completado`

### Operador (`operador.demo@tubi.local` / `demo-demo-1`)

- [ ] Cola con ≥1 seña pendiente (Bruno, viaje mañana seed)
- [ ] Confirmar o rechazar seña
- [ ] Editar setting (monto seña o tiempo de espera) y ver reflejo sin redeploy

## UI

- [ ] Viewport ~375px sin overflow horizontal en flujos P0
- [ ] Empty states con salida (CTA o helper)
- [ ] Errores legibles (rioplatense, sin stack ni códigos RPC crudos)
- [ ] TabBar / navegación coherente por rol

## Go / No-go

| | Criterio |
|---|---|
| **Go** | Smoke 3 roles OK; `completar_viaje` funciona; Mis reservas → Ver QR; C5 No llegó; seed 0019 deja fechas de hoy AR |
| **No-go** | Login roto; conductor sin viaje de hoy; Finalizar bloqueado con pendientes; errores crudos; migraciones incompletas |

## Referencias

- Guión: `docs/15-demo-script.md`
- Demo pack: `supabase/migrations/0014_slice7_demo_pack.sql` + `0019_demo_pack_mvp_close.sql`
- Status demo: `docs/15-demo-ready-status.md`
