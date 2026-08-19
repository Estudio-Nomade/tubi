# Flujos de Usuario — Plataforma de Viajes Compartidos Interurbanos

**Producto:** plataforma de viajes compartidos interurbanos (tramo principal Tandil ↔ Buenos Aires).
**Documento:** 03-flujos-de-usuario.md · Diagramas de flujo por actor.
**Rol:** puente entre la arquitectura (`02-arquitectura.md`) y los wireframes (fase 6): cada flujo define las pantallas que habrá que dibujar en Pencil.

Los estados que aparecen en los flujos son los de **AD-12** (máquina de estados de viaje y reserva). Los valores de negocio (seña, espera, devoluciones) salen de **settings** (AD-5), nunca hardcodeados.

---

## 1. Ciclo de vida del viaje (los tres actores convergen)

```mermaid
flowchart LR
    subgraph Planificacion["Planificación"]
        OP1["Operador crea viaje"] --> OP2["Viaje programado"]
    end
    subgraph Reserva["Reserva"]
        PA1["Pasajero busca"] --> PA2["Reserva + seña"] --> PA3["QR generado"]
    end
    subgraph Ejecucion["Ejecución"]
        CO1["Conductor recoge (QR)"] --> CO2["En curso (GPS)"] --> CO3["Completado"]
    end
    OP2 --> PA1
    PA3 --> CO1
    CO3 --> OP3["Operador: trazabilidad"]
```

---

## 2. Flujo del pasajero

### 2.1 Registro, búsqueda y reserva

```mermaid
flowchart TD
    A["Ingresa a la plataforma"] --> B{"¿Tiene cuenta?"}
    B -- "No" --> C["Registro: nombre + DNI + contacto"]
    C --> D["Login"]
    B -- "Sí" --> D
    D --> E["Buscar viaje: origen, destino, fecha, horario"]
    E --> F["Ver opciones disponibles"]
    F --> G["Ver detalle: conductor, vehículo, ruta, paradas, horario, precio"]
    G --> H["Seleccionar viaje y asiento"]
    H --> I["Pagar seña vía MercadoPago"]
    I --> J{"¿Pago confirmado?"}
    J -- "No" --> I
    J -- "Sí" --> K["Reserva confirmada + QR generado"]
    K --> L["Recibe notificaciones del viaje"]
```

### 2.2 Subida al vehículo, seguimiento y cancelación

```mermaid
flowchart TD
    A["Reserva confirmada"] --> B{"¿Cancelar antes de viajar?"}
    B -- "Sí" --> C["Cancelar reserva"]
    C --> D["Devolución de seña según antelación (settings)"]
    B -- "No" --> E["Esperar en la parada"]
    E --> F["Mostrar QR al conductor"]
    F --> G["Conductor escanea y verifica"]
    G --> H{"¿QR válido?"}
    H -- "No" --> X["Rechazado: no sube"]
    H -- "Sí" --> I["Pagar saldo al subir"]
    I --> J["Abordar"]
    J --> K["Seguir vehículo en vivo en el mapa"]
    K --> L["Llegada a destino"]
```

---

## 3. Flujo del conductor

```mermaid
flowchart TD
    A["Login conductor"] --> B["Ver viajes programados del día"]
    B --> C["Ver secuencia ordenada de paradas de recogida"]
    C --> D["Iniciar recogida y transmitir GPS"]
    D --> E["Llegar a la parada"]
    E --> F{"¿Pasajero presente?"}
    F -- "No" --> G["Esperar hasta el tiempo máximo (5 min)"]
    G --> H{"¿Apareció?"}
    H -- "No" --> I["Marcar no-show y continuar"]
    H -- "Sí" --> J["Escanear QR"]
    F -- "Sí" --> J
    J --> K{"¿Reserva válida?"}
    K -- "No" --> L["Rechazar: no sube"]
    K -- "Sí" --> M["Registrar pago del saldo"]
    M --> N["Marcar abordado"]
    N --> O{"¿Más paradas?"}
    I --> O
    L --> O
    O -- "Sí" --> E
    O -- "No" --> P["Estado: en curso"]
    P --> Q["Conducir a destino con GPS en vivo"]
    Q --> R{"¿Incidente en ruta?"}
    R -- "Sí" --> S["Reportar incidente y notificar pasajeros"]
    R -- "No" --> T["Llegar a destino"]
    S --> T
    T --> U["Estado: completado"]
```

---

## 4. Flujo del operador

```mermaid
flowchart TD
    A["Login operador"] --> B["Panel de operación"]

    subgraph Config["Configuración"]
        C["Settings: tarifa, comisión, seña, espera, devoluciones"]
    end

    subgraph Catalogo["Catálogo"]
        D["Conductores y vehículos"]
        E["Rutas y paradas"]
        F["Viajes programados"]
    end

    subgraph Operacion["Operación"]
        G["Verificación de identidad (DNI)"]
        H["Monitoreo en vivo (estados + GPS)"]
        I["Reservas, pagos y cancelaciones"]
        J["Incidentes"]
    end

    B --> C
    B --> D
    B --> E
    B --> F
    B --> G
    B --> H
    B --> I
    B --> J
```

---

## 5. Mapa flujo → pantallas (alimenta los wireframes de Pencil)

Cada fila es una pantalla que habrá que wireframear en la fase 6. Todas mobile-first (375px); las del operador son web responsive.

| Actor | Pantalla | Flujo que cubre |
|---|---|---|
| Pasajero | Búsqueda de viajes | origen, destino, fecha, horario |
| Pasajero | Resultados de búsqueda | opciones disponibles |
| Pasajero | Detalle de viaje | conductor, vehículo, ruta, paradas, horario, precio |
| Pasajero | Checkout de seña | pago MercadoPago |
| Pasajero | Confirmación + QR | reserva confirmada, QR para mostrar |
| Pasajero | Mis reservas / historial | listado, cancelación |
| Pasajero | Seguimiento en vivo | mapa, posición, ETA |
| Conductor | Viajes del día | viajes programados |
| Conductor | Recogida / navegación | secuencia de paradas ordenadas |
| Conductor | Escaneo de QR | verificación de reserva |
| Conductor | Abordado / saldo | registrar pago, marcar abordado |
| Conductor | En ruta | GPS, estados, reportar incidente |
| Operador | Dashboard | viajes del día, estados, tracking |
| Operador | Gestión | conductores, vehículos, rutas, paradas |
| Operador | Settings | parámetros de negocio |
| Operador | Verificación de identidad | DNI manual fase 1 |

---

## Notas para la fase de wireframes

- Los flujos asumen la **web app mobile-first**: una sola columna, acciones primarias al alcance del pulgar.
- El **QR** y el **escáner** son los dos momentos críticos de verificación (pasajero muestra / conductor escanea); ambos deben quedar en pantallas de alta legibilidad (poco texto, alto contraste).
- El **seguimiento en vivo** es una pantalla "pasiva" para el pasajero (no requiere interacción, solo ver).
- La **política de espera y no-show** (5 min) debe comunicarse con claridad visual en la pantalla de recogida del conductor.
