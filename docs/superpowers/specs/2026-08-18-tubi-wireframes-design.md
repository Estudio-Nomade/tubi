# Tubi — Wireframes P0 (fase 6)

**Producto:** Tubi, viajes compartidos interurbanos Tandil ↔ Buenos Aires.
**Fecha:** 2026-08-18
**Estado:** aprobado para implementación
**Entregable:** `design-artifacts/tubi-wireframes.pen`

## Decisiones cerradas

- Nombre de producto: **Tubi**. Dominio, paleta final, tipografía y logo quedan en fase 8.
- Herramienta: Pencil (pen.dev CLI). Un solo archivo `.pen`.
- Viewport: **375 × 812** (mobile-first). Operador también en 375 para la demo.
- Paleta de wireframe (no es marca final):
  - Superficie `#F4F4F5`
  - Tinta `#18181B`
  - Muted `#71717A`
  - Borde `#D4D4D8`
  - Tarjeta `#FFFFFF`
  - Acento turquesa `#0D9488`
  - Error `#B91C1C`
- Copy en español argentino. Valores de negocio como labels (`seña`, `espera`), no montos hardcodeados salvo ejemplos claramente de demo (`$5.000` con nota “según settings”).
- Corte P0: 15 pantallas. Fuera: historial pasajero, incidentes, dashboard/gestión operador, verificación DNI.

## Inventario

| # | Frame | Actor | Contenido |
|---|---|---|---|
| 1 | `1 · Pasajero · Registro` | Pasajero | nombre, DNI, contacto, CTA crear cuenta / ya tengo cuenta |
| 2 | `2 · Pasajero · Búsqueda` | Pasajero | origen, destino, fecha, horario, CTA buscar |
| 3 | `3 · Pasajero · Resultados` | Pasajero | lista de viajes (hora, asientos, precio) |
| 4 | `4 · Pasajero · Detalle` | Pasajero | conductor, vehículo, ruta/paradas, horario, precio, CTA reservar |
| 5 | `5 · Pasajero · Checkout seña` | Pasajero | alias/CBU demo, monto seña, subir comprobante, CTA enviar |
| 6 | `6 · Pasajero · QR` | Pasajero | estado reserva, QR grande, cancelar con política |
| 7 | `7 · Pasajero · Seguimiento` | Pasajero | mapa, posición, ETA; sin controles extra |
| 8 | `8 · Conductor · Registro` | Conductor | nombre, apellido, teléfono |
| 9 | `9 · Conductor · Viajes del día` | Conductor | lista de viajes programados + ocupación |
| 10 | `10 · Conductor · Recogida` | Conductor | secuencia de paradas, timer 5 min, no-show |
| 11 | `11 · Conductor · Escanear QR` | Conductor | visor de cámara, resultado válido/rechazado |
| 12 | `12 · Conductor · Saldo` | Conductor | monto saldo, efectivo / transferencia, marcar abordado |
| 13 | `13 · Conductor · En ruta` | Conductor | estado del viaje, GPS activo, sin incidentes |
| 14 | `14 · Operador · Confirmar seña` | Operador | comprobante + confirmar / rechazar |
| 15 | `15 · Operador · Settings` | Operador | tarifa, comisión, seña, espera, devoluciones |

## Layout común (375px)

- Una columna. Header 56px: wordmark “Tubi” a la izquierda, rol a la derecha.
- Acento turquesa solo en: wordmark, CTA primario, foco de input, chip de estado activo, marco del QR.
- CTA primario full-width, 48px de alto, abajo del contenido (alcance del pulgar).
- Tipografía sans genérica. Sin ilustraciones. Iconos simples (caja o círculo).
- Estados anotados como chips o banners, no como pantallas extra, salvo QR inválido (banner en frame 11).

## Copy y reglas visibles

- Recogida: “Espera máxima 5 min. Si no llega, no-show y seguís.”
- QR: “Mostralo al conductor. No compartas esta pantalla.”
- Checkout: “Transferí la seña y subí el comprobante. Te confirmamos a mano.”
- Settings: cada fila es `clave` + valor editable. No hardcodear lógica.

## Fuera de este entregable

- Design system / componentes (fase 7)
- Marca completa (fase 8)
- Código (fase 9)
- Pantallas P1
