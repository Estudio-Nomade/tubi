# AGENTS.md — Convenciones de trabajo

Guía para agentes (IA y humanos) que trabajan en este repo. Leer antes de tocar nada.

## Contexto del proyecto

Plataforma de viajes compartidos interurbanos programados (tramo principal Tandil ↔ Buenos Aires, con paradas intermedias). Etapa temprana de conceptualización.

- **Fuente de verdad de producto:** `docs/01-prd.md`
- **Orden de trabajo:** `docs/00-roadmap.md`
- El producto se llama **Tubi**. Paleta, dominio y logo se definen en la fase 8.

## Idioma

Responder y documentar en **español argentino**, formal pero claro, concreto y sin relleno.

## Reglas de producto (no negociables)

- Web app mobile-first (375px), no apps nativas.
- Seña de compromiso al reservar (por transferencia); saldo al subir (efectivo o transferencia).
- Identificación del pasajero por QR escaneado por el conductor.
- Estados del viaje: programado → recogida → en curso → completado / cancelado.
- Seguimiento GPS en vivo con cola offline para tramos sin cobertura.
- Política de espera en recogida (default 5 min) y recogida secuencial tipo Uber.
- Registro mínimo de pasajero: nombre + DNI + contacto.
- Registro de conductor: nombre + apellido + teléfono.
- Vehículo: patente, marca, modelo, color, capacidad.
- Viajes programados todos los días, incluso con un solo pasajero al inicio.

## Configuración (transversal, aplicar en TODO el código)

- **Dos capas, nunca mezclar:**
  - `.env` → secretos e infraestructura (URL de Supabase, API key de mapas, JWT).
  - **Tabla de `settings` en DB** → parámetros de negocio editables por el operador sin redeploy (tarifa base, comisión, monto de seña, tiempo de espera, política de devolución, feature flags).
- **Nunca hardcodear valores de negocio**: siempre leerlos de settings.
- Proveedores siempre detrás de interfaces: `PaymentProvider` (pagos en efectivo y transferencia, confirmación manual), `MapsProvider` (Google Maps), `IdentityVerifier` (DNI manual fase 1). No acoplar la lógica de negocio a un proveedor.
- `.env` está ignorado y **nunca se commitea**; no leer, imprimir ni guardar secretos.

## Metodología

- Definir primero (arquitectura, datos), después diseñar (UX, marca), recién después construir.
- La IA es **herramienta de implementación**, no reemplaza el criterio técnico ni las decisiones.
- Una fase a la vez: terminar el entregable y validar antes de pasar a la siguiente.

## Git

Estándar BMAD (Whiteport). Aplicar siempre:

- **Conventional Commits:** `<type>(<scope>): <descripción corta>` en imperativo ("add", no "added").
  - Tipos: `feat`, `fix`, `bump`, `docs`, `chore`, `refactor`.
- **Branches:** `<agent>/<descripción-corta>` (ej. `codex/refactor-storefront`). Lowercase, solo guiones, de vida corta. No commitear directo a `main` nada no trivial.
- **Un cambio lógico por commit.** Commitear tras cada cambio discreto completo, no al final de la sesión.
- **Nunca:** `git add .` / `git add -A` (stagear archivos específicos), `--no-verify`, force-push a `main`, amend de commits publicados.
- Cuando un agente de IA escribe o co-escribe un commit, agregar `Co-Authored-By` con el nombre real del modelo.

## Fuentes externas

- **LIFTY** (`~/Documentos/LIfty`) es un proyecto **aparte** del mismo rubro. Solo puede consultarse por herramientas/flujos reutilizables, y **siempre pidiendo confirmación explícita** antes de tomar algo de ahí.
- **BMAD** (framework de metodología) vive en `~/Documentos/Estudio Nomade/Tumo/_bmad`. Sus fases y estándares de git son referencia; no es una dependencia del proyecto.
