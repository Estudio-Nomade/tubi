# Tubi Wireframes P0 Implementation Plan

> **For agentic workers:** ejecutar en esta sesión (inline). No hay tests automatizados: la verificación es abrir el `.pen` y los PNG de preview.

**Goal:** Entregar wireframes P0 de Tubi en Pencil y dejar el nombre cerrado en la documentación.

**Architecture:** Un archivo Pencil con 15 frames 375×812. Spec en `docs/superpowers/specs/2026-08-18-tubi-wireframes-design.md`. Nombre de producto actualizado en docs de convención, no en cada “la plataforma” genérica.

**Tech Stack:** Pencil CLI (`@pen.dev/cli` / `pencil`), markdown.

## Global Constraints

- Producto: Tubi. Paleta final / dominio / logo fuera de alcance.
- 375×812, gris + turquesa `#0D9488`.
- Copy en español argentino.
- Conventional Commits, archivos específicos, `Co-Authored-By: grok-4.6`.
- Nunca `git add .`.

---

### Task 1: Spec y plan

**Files:**
- Create: `docs/superpowers/specs/2026-08-18-tubi-wireframes-design.md`
- Create: `docs/superpowers/plans/2026-08-18-tubi-wireframes.md`

- [x] **Step 1:** Escribir spec y plan
- [ ] **Step 2:** Commit

```bash
git add docs/superpowers/specs/2026-08-18-tubi-wireframes-design.md docs/superpowers/plans/2026-08-18-tubi-wireframes.md
git commit -m "docs(wireframes): add spec and plan for Tubi P0 screens"
```

### Task 2: Nombre Tubi en docs de convención

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `HANDOFF.md`
- Modify: `docs/01-prd.md`
- Modify: `docs/00-roadmap.md`

- [ ] **Step 1:** Reemplazar solo las notas de placeholder / “sin nombre”
- [ ] **Step 2:** Commit

```bash
git add README.md AGENTS.md HANDOFF.md docs/01-prd.md docs/00-roadmap.md
git commit -m "docs: set product name to Tubi"
```

### Task 3: Generar wireframes Pencil

**Files:**
- Create: `design-artifacts/tubi-wireframes.pen`
- Create: `design-artifacts/previews/` (PNG por actor o uno general)

- [ ] **Step 1:** Generar frames 1–7 (pasajero) con `pencil --out`
- [ ] **Step 2:** Agregar frames 8–13 (conductor) con `pencil --in/--out`
- [ ] **Step 3:** Agregar frames 14–15 (operador)
- [ ] **Step 4:** Exportar preview PNG
- [ ] **Step 5:** Commit

```bash
git add design-artifacts/tubi-wireframes.pen design-artifacts/previews
git commit -m "feat(wireframes): add Tubi P0 Pencil screens"
```
