# SDD: Interfaz de la landing y las páginas de equipo (UI Heretics)

> **Estado:** `completado`
> **Autor:** Luis Angel
> **Fecha:** 2026-09-12
> **Última actualización:** 2026-09-12

### Restricciones

- Next.js con CSS en `app/globals.css` (Tailwind v4 importado + clases propias con design tokens en `:root`).
- Identidad visual obligatoria de Team Heretics (negro + dorado).

---

## Objetivos y límites

### Objetivos

- Landing `/` con la identidad del club y un grid de cards por competición.
- Páginas por equipo con el mismo componente compartido `TeamTracker`.
- Presencia visual clara de los logos.
- Acentos de color por juego para discriminar competiciones.
- Navegación global responsive (menú hamburguesa en móvil).

### No incluye

- Rediseños distintos por juego (cada página usa el mismo esquema con acento propio).
- Modo claro o temas configurables.
---

## Decisiones

### Tema oscuro + dorado institucional

- **Elegida:** paleta basada en negros/carbones (`--black`, `--obsidian`, `--carbon`, `--charcoal`, `--graphite`) y dorado Heretics (`--gold: #c0a565`, más `--gold-light`, `--gold-pale`, `--gold-dark`), texto crema (`--cream`, `--text`, `--muted`). Definida como tokens en `:root` de `app/globals.css`.
- **Motivo:** fidelidad con la marca y lectura cómoda en un tracker de esports.
- **Alternativas descartadas:** fondos claros o acentos de color por equipo fuera de la paleta.

### Landing como hub de cards

- **Elegida:** `/` muestra `TeamHeader` (logo del club + título) y un `competition-grid` de `CompetitionCard` por competición, cada una enlazando a su página de equipo.
- **Motivo:** reemplaza al tracker de una sola página; la home orienta antes que saturar con datos.

### Páginas de equipo compartidas

- **Elegida:** `TeamTracker(team)` con un `configs` por juego (logo, título, descripción, loader, acento). La cabecera usa `team-header` con el logo sin recuadro.
- **Motivo:** una sola implementación para cinco competiciones; el detalle vive en la config.

### Acentos por juego

- **Elegida:** azul `#60a5fa` (LoL/LEC-LES), rosa `#f472b6` (Valorant), naranja `#fb923c` (CoD), rojo `#f87171` (Brawl Stars).
- **Motivo:** discriminación visual rápida entre competiciones; se aplica a eyebrow, hover en filas, navbar y logos.
- **Revisar si:** se añade un sexto juego → asignar un color nuevo coherente con la paleta.

### Logos

- **Elegida:** los logos de cabecera (`team-mark` / `home-mark`) no tienen borde, fondo ni sombra de caja; se muestran sin recorte (`object-fit: contain`), con `overflow: visible`. Tamaños: página de equipo 132 px, home 160 px (móvil 84 px y 104 px respectivamente).
- **Motivo:** el recuadro recortaba la imagen a un "cuadradito" y reducía la presencia del logo; sin marco se ve limpio y completo.
- **Alternativas descartadas:** mantener la caja con borde/fondo y `object-fit: cover`.

### Descripción de cards bajo el título

- **Elegida:** la descripción de cada `CompetitionCard` se revela en hover/foco, anclada bajo el título (no en mitad de la card) y ocupando el ancho útil de la tarjeta (columna `copy` con `flex: 1` hasta el logo). El título ya no se desplaza al hacer hover.
- **Motivo:** posición coherente con la jerarquía título → descripción y lectura natural.
- **Revisar si:** el hover en dispositivos táctiles es inaccesible → la descripción siempre visible.

### Resultados visibles con estado

- **Elegida:** cada fila de partido muestra rival con logo, marcador, badge "Victoria"/"Derrota"/próximo y torneo y fecha.
- **Motivo:** el usuario consulta tanto próximos partidos como resultados recientes en una sola página.

### Favicon local

- icono `Team_Hereticslogo_220.ico` en `metadata.icons` con URL `/logos/Team_Hereticslogo_220.ico`.

### Navegación global

- **Elegida:** `SiteNavbar` fijo con enlaces (Home, LEC, LES, Valorant, CoD, Brawl Stars), resaltando la ruta activa, con menú hamburguesa en móvil y acento por juego al hover.
- **Motivo:** navegación consistente y accesible desde cualquier página.

---

## Diseño y estructura

### Estructura de páginas

```
app/layout.tsx                    → SiteNavbar + {children} + SiteFooter
app/template.tsx                  → PageTransition (framer-motion)
app/page.tsx                      → TeamHeader + competition-grid (cards)
app/{lol/lec,lol/les,valorant,cod,brawlstars}/page.tsx → TeamTracker(team)
```

### Componentes

| Componente | Rol |
|---|---|
| `team-header.tsx` + `team-mark`/`home-mark` | Cabecera, logo sin recuadro |
| `competition-card.tsx` | Card de competición con descripción hover |
| `team-tracker.tsx` | Página de equipo (próximos 3, recientes 10) |
| `site-navbar.tsx`, `site-footer.tsx` | Navegación global |
| `page-transition.tsx` | Transición de ruta |

### CSS clave (app/globals.css)

- Tokens de marca en `:root` (ver §3).
- `.tracker-shell`, `.team-header`, `.eyebrow`, `.team-mark` (sin marco), `.home-mark`.
- `.competition-grid`, `.competition-card*` (`__body`, `__copy`, `__logo`), revelado de descripción.
- `.match-list`, `.match-row`, `.opponent-logo`, `.result-*`, `.empty-match`.
- Media query `max-width: 600px` para grid de una columna, navbar hamburguesa y tamaños de logo reducidos.
- `prefers-reduced-motion` desactiva las transiciones de cards.

---

## Contratos y datos

Sin cambios de contrato de datos. La UI consume `TrackerMatch` y la shape de cada endpoint tal como queda definido en el SDD principal. Este SDD cubre únicamente presentación y clases CSS.

---

## Comportamiento esperado

### Caso principal

1. `/` muestra cabecera del club y las 5 cards.
2. Hover/foco en una card muestra su descripción bajo el título.
3. La card o la navbar llevan a la página de equipo.
4. La página de equipo muestra próximos y recientes con logos y estados de resultado.
5. En móvil, la navbar colapsa a menú hamburguesa.

### Casos importantes

| Escenario | Comportamiento esperado |
|---|---|
| Logo cuyo archivo es transparente | Se muestra completo, sin marco, a tamaño de presencia. |
| Logo CoD (JPG con fondo propio) | Se respeta `object-fit: contain`; el fondo del propio JPG se conserva. |
| Hover/foco en card con descripción larga | La descripción ocupa el ancho útil bajo el título, sin salirse de la card. |
| Favicon | Aparece la icono de Heretics en la pestaña. |
| Ruta activa en navbar | Se resalta con el dorado. |
| User con `prefers-reduced-motion` | Sin transiciones animadas en las cards. |

### Criterios de aceptación

- [x] La landing muestra la identidad y las cards de las 5 competiciones.
- [x] Cada card enlaza a su página de equipo y revela su descripción bajo el título en hover/foco.
- [x] Las páginas de equipo usan `TeamTracker` con cabecera, próximos (3) y recientes (10).
- [x] Los logos de cabecera se muestran sin recuadro, completos y con presencia (tamaños §3), también en móvil.
- [x] Acentos por juego coherentes en navbar, eyebrow, filas y logos.
- [x] El favicon se sirve correctamente.
- [x] `pnpm typecheck` pasa sin errores.

---

## Pendientes

- [ ] **Riesgo — pantallas táctiles:** el hover de las cards no existe en toque. **Mitigación:** aceptado por ahora; si molesta, hacer la descripción siempre visible en móvil.
- [ ] **Riesgo — logos ajenos:** los rivales fuera del mapeo de `lib/logos.ts` se muestran sin logo (nombre solo).

---

## Referencias

- [Landing](app/page.tsx)
- [Card de competición](components/competition-card.tsx)
- [Tracker de equipo](components/team-tracker.tsx)
- [Cabecera de equipo](components/team-header.tsx)
- [Navbar](components/site-navbar.tsx), [Footer](components/site-footer.tsx), [Transición](components/page-transition.tsx)
- [Tema y estilos](app/globals.css)
- [Logos de rivales](lib/logos.ts)
- [SDD principal del tracker](heretics-tracker.md)
