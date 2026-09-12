# SDD: Team Heretics Match Tracker

> **Estado:** `implementando`
> **Autor:** Luis Angel
> **Fecha:** 2026-09-08
> **Última actualización:** 2026-09-12

## Contexto

El tracker muestra los próximos partidos y resultados recientes de Team Heretics por juego. Cubre cinco competiciones:

- **League of Legends** — LEC (Team Heretics) y LES (Los Heretics / Heretics Academy).
- **Valorant** — VCT EMEA.
- **Call of Duty** — CDL (Miami Heretics) y eventos como EWC (Team Heretics).
- **Brawl Stars** — BSL/BSC (Team Heretics).

La estructura permite añadir equipos/juegos sin tocar la UI de las páginas existentes.

### Arquitectura de páginas

- `/` — landing con la identidad del club y un grid de cards por competición.
- `/lol/lec`, `/lol/les`, `/valorant`, `/cod`, `/brawlstars` — páginas de equipo, todas con el mismo componente compartido `TeamTracker`.
- Navbar global con menú móvil y footer.

### Estado actual

- Proyecto Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4, single runtime Node/TS.
- `pnpm typecheck`, `pnpm lint` y `pnpm build` pasan sin errores. `next lint` sigue marcado como deprecado por Next.js (avisos de migración), pero funciona.
- Todo el código vive en este repo; no hay componentes ni configuraciones externas.
- Se scrapea server-side porque no existe API oficial:
  - **VLR.gg** para Valorant (`app/api/valorant/route.ts`).
  - **Liquipedia** para LoL, CoD y Brawl Stars (`app/api/lol/route.ts`, `app/api/cod/route.ts`, `app/api/brawlstars/route.ts`).
- Identidad visual oscura/dorada de Team Heretics con acentos por juego (ver SDD de UI).

### Restricciones

- Las fuentes son HTML frágil: VLR.gg y Liquipedia pueden cambiar su markup sin aviso.
- Liquipedia aplica rate limiting y conviene enviar User-Agent (`LIQUIPEDIA_UA`) y gzip.
- Los horarios de los partidos son aproximados y pueden moverse de último minuto.

---

## Objetivos y límites

### Objetivos (lo que el tracker hace)

- Servir una landing `/` con la identidad del club y cards de las competiciones que enlazan a cada página de equipo.
- Exponer páginas por equipo con "Próximos partidos" (3) y "Resultados recientes" (10) por juego, con marcador, badge de Victoria/Derrota y logo del rival.
- Exponer `/api/valorant`, `/api/lol`, `/api/cod` y `/api/brawlstars` (Node) que devuelven los partidos de Heretics normalizados, con caché y rate limit.
- Mantener los datos y selectores de scraping centralizados para facilitar el mantenimiento.
- Añadir un juego nuevo = crear un endpoint + configurar `TeamTracker`; las páginas comparten componente.

### No incluye

- Histórico completo de partidos, estadísticas de jugadores y noticias.
- Calendarios de equipos que no sean de Team Heretics.
- Autenticación o cuentas de usuario.
- traer logos de liquipedia.

---

## Decisiones vigentes

### Scraping Node/TS en los endpoints

- **Elección:** Valorant, LoL, CoD y Brawl Stars se scrapean desde Route Handlers Node con `fetch` + `node-html-parser`.
- **Motivo:** es la única vía fiable sin APIs oficiales y mantiene un único runtime en el proyecto.

### Selectores centralizados

- **Elección:** cada route handler define sus selectores en un objeto `SELECTORS` (o bien constantes cercanas al scraper).
- **Motivo:** los scrapers son frágiles ante cambios de HTML; centralizar localiza el mantenimiento.
- **Riesgo conocido:** si la fuente cambia el markup, hay que actualizar los selectores.

### Landing como índice, no como tracker único

- **Elección:** la home `/` es un hub con cards de competiciones; el detalle vive en páginas por equipo.
- **Motivo:** reemplaza el diseño previo (tracker de una sola página con next-match global y countdowns), que quedó superado por la navegación por equipos.

### Páginas de equipo compartidas

- **Elección:** un solo componente `TeamTracker` recibe un `team` y usa un `config` (juego, liga, título, descripción, logo, loader y acento).
- **Motivo:** las cinco páginas tienen el mismo contrato y se diferencian solo por configuración.
- **Datos:** cada página normaliza los partidos de su endpoint a `TrackerMatch` (`id`, `opponent`, `opponentLogoUrl?`, `tournament`, `date`, `score`, `result: "W" | "L" | "-"`).

### Logos y nombres de rivales centralizados

- **Elección:** `lib/logos.ts` resuelve logo y display name del rival por liga (`lec`, `les`, `vct`, `cdl`, `brawl`) usando alias normalizados.
- **Motivo:** una sola fuente de verdad para identificar a los rivales que devuelven Liquipedia/VLR/LES.

### Cache

- **Elección:** caché en memoria derivada del servidor (`lib/api-cache.ts`, TTL 300 s, dedupe in-flight) + caché HTTP (`max-age=120, s-maxage=300, stale-while-revalidate=600`) + cliente con dedupe y retry en `lib/http-client.ts`.
- **Motivo:** reduce requests a fuentes que limitan y evita cargas lentas al navegar (ver SDD de caché).
- **Nota:** se retiró el next-match global cacheado en `localStorage`; ya no existe ese cálculo.

### Rate limit con fallback

- **Elección:** `lib/rate-limit.ts` limita por IP con Upstash (si `UPSTASH_REDIS_REST_URL/TOKEN` están definidos) y con mapa en memoria como fallback (30 req/min en ventana deslizante).
- **Motivo:** proteger los endpoints del abuso sin infraestructura obligatoria; Upstash es opcional.

### Identidad visual Heretics y acentos por juego

- **Elección:** tema oscuro (negro/carbón) con dorado institucional, texto crema, y acento por juego: azul (LoL), rosa (Valorant), naranja (CoD), rojo (Brawl Stars).
- **Motivo:** fidelidad con la marca y discriminación visual de cada competición.
- **Detalle:** ver SDD `team-tracker-ui.md`.

### User-Agents como variables de entorno

- **Elección:** `LIQUIPEDIA_UA` y `VLR_USER_AGENT` se leen de `.env` con fallback en código.
- **Motivo:** las fuentes los exigen; se evita hardcodear credenciales.

### Favicon local

- **Elección:** icono `Team_Hereticslogo_220.ico` declarado en `metadata.icons` con URL `/logos/...` (desde `public/`, sin prefijo `/public`).
- **Motivo:** la ruta correcta de Next.js para recursos de `public/`; antes apuntaba a `/public/...` y no aparecía.

### CoD: combinación de identidades competitivas

- **Elección:** `/api/cod` combina `Miami_Heretics` y `Team_Heretics` de Liquipedia en una única lista, deduplicada.
- **Motivo:** Miami Heretics es la identidad habitual de la CDL; Team Heretics se usa en competiciones como EWC.

---

## 4. Diseño y flujo

### Arquitectura multi-source

```
[Navbar global / footer] + app/template.tsx (PageTransition)
        │
        ├── /  → TeamHeader + competition-grid (CompetitionCard × 5)
        └── /lol/lec | /lol/les | /valorant | /cod | /brawlstars  → TeamTracker(team)
                └── fetchApiJson → /api/{valorant,lol,cod,brawlstars} (Route Handler Node)
                        ├── caché memoria (TTL 300 s) + dedupe in-flight
                        ├── rate limit por IP (Upstash o fallback)
                        ├── VLR.gg (valorant)
                        └── Liquipedia (lol, cod, brawlstars)
```

### Datos

Los endpoints devuelven formas por juego; `TeamTracker` las normaliza a `TrackerMatch` (con un normalizador genérico compartido por LoL, CoD y Brawl Stars). No existe un contrato común adicional: la UI solo consume `TrackerMatch`.

```ts
// TrackerMatch (cliente, components/team-tracker.tsx)
interface TrackerMatch {
  id: string
  opponent: string
  opponentLogoUrl?: string
  tournament: string
  date: string       // ISO
  score: string      // "2-0" o "Por definir"
  result: "W" | "L" | "-"
}
```

### Estructura de archivos

| Archivo | Rol |
|---------|-----|
| `app/layout.tsx`, `app/template.tsx`, `app/globals.css` | Shell, transición de página y tema/design tokens |
| `app/page.tsx` | Landing con cabecera del club y cards de competiciones |
| `app/lol/lec`, `app/lol/les`, `app/valorant`, `app/cod`, `app/brawlstars` | Páginas de equipo (`TeamTracker`) |
| `app/api/valorant/route.ts` | Scraper VLR.gg (Team Heretics) |
| `app/api/lol/route.ts` | Scraper Liquipedia (Team_Heretics y Los_Heretics) |
| `app/api/cod/route.ts` | Scraper Liquipedia (Miami_Heretics y Team_Heretics) |
| `app/api/brawlstars/route.ts` | Scraper Liquipedia Brawl Stars (Team_Heretics) |
| `components/team-tracker.tsx`, `team-header.tsx`, `competition-card.tsx` | UI de páginas de equipo, cabeceras y cards |
| `components/site-navbar.tsx`, `site-footer.tsx`, `page-transition.tsx` | Navegación, pie y animación de página |
| `lib/valorant.ts`, `lib/lol.ts`, `lib/cod.ts`, `lib/brawlstars.ts` | Clientes de fetch por juego |
| `lib/api-cache.ts`, `lib/http-client.ts`, `lib/rate-limit.ts` | Infra: caché, cliente y rate limit |
| `lib/logos.ts` | Resolución de logos y nombres de rivales por liga |

### Cache, polling y rate limit

| Fuente | Caché HTTP | Caché memoria | Rate limit |
|--------|-----------|---------------|------------|
| Valorant (`/api/valorant`) | `max-age=120, s-maxage=300, swr=600` | 300 s | 30 req/min |
| LoL (`/api/lol`) | idem | 300 s | 30 req/min |
| CoD (`/api/cod`) | idem | 300 s | 30 req/min |
| Brawl Stars (`/api/brawlstars`) | idem | 300 s | 30 req/min |

---

## 5. Contratos y datos

### Endpoints

| Método | Ruta | Fuente | Runtime | Cache |
|--------|------|--------|---------|-------|
| GET | `/api/valorant` | VLR.gg (scraping) | Node | 300 s |
| GET | `/api/lol` | Liquipedia (scraping) | Node | 300 s |
| GET | `/api/cod` | Liquipedia (scraping) | Node | 300 s |
| GET | `/api/brawlstars` | Liquipedia (scraping) | Node | 300 s |

Headers de respuesta en los cuatro: `Cache-Control: public, max-age=120, s-maxage=300, stale-while-revalidate=600`. En rate limit excedido: `429` + `Retry-After` + `X-RateLimit-*` (con `Cache-Control: no-store`).

### Tipos por juego (normalizados en el cliente)

```ts
// lib/valorant.ts (shape del endpoint, se normaliza en TeamTracker)
interface ValorantMatch {
  tournament_name: string
  team1: { name: string }
  team2: { name: string; logo?: string }
  match_datetime: string // ISO UTC
  score?: { team: number; opponent: number }
}

// lib/lol.ts, lib/cod.ts, lib/brawlstars.ts (shape común)
interface XMatch {
  id: string
  team: string
  opponent: string
  opponentLogoUrl?: string
  tournament: string
  startTime: string // ISO string
  score?: { team: number; opponent: number }
}
```

### Persistencia

Sin base de datos. Caché en memoria del proceso (se pierde al reiniciar) + caché HTTP/CDN. Se retiró el `localStorage` del next-match.

---

## Comportamiento esperado

### Caso principal

1. El usuario abre `/` y ve la cabecera del club y las cards de las competiciones.
2. Al hover/foco en una card se revela la descripción de la competición bajo el título.
3. El usuario navega (navbar o card) a una página de equipo.
4. En la página se ve la cabecera con el logo del juego, "Próximos partidos" (hasta 3, ordenados por fecha) y "Resultados recientes" (hasta 10) con marcador, badge Victoria/Derrota y logo del rival.
5. En móvil el navbar colapsa a un menú hamburguesa.

### Casos importantes

| Escenario | Comportamiento esperado |
|---|---|
| Una API no responde o falla el scrape | El endpoint devuelve `[]`/datos vacíos y la página muestra el estado vacío; las demás fuentes siguen operativas. |
| Estado de carga | La página muestra "Cargando..." mientras los datos llegan. |
| No hay próximos partidos | "No hay partidos próximos programados." |
| No hay resultados | "No hay resultados disponibles." |
| Un rival no está en `lib/logos.ts` | Se muestra el nombre del rival sin logo. |
| Se supera el rate limit | El endpoint responde `429` con `Retry-After`. |
| VLR.gg o Liquipedia cambian su HTML | El scrapeo falla (log server-side); se actualizan los selectores centralizados. |
| Añadir un juego nuevo (futuro) | Endpoint nuevo + una entrada en `configs` de `TeamTracker` (y card en la home si aplica). |

### Criterios de aceptación

- [x] `pnpm typecheck` sin errores.
- [x] `pnpm lint` sin errores (solo warnings de `no-img-element`, decididos).
- [x] `pnpm build` compila y prerenderiza las 13 rutas.
- [x] No quedan referencias a código, componentes ni rutas de proyectos ajenos.
- [x] No quedan componentes legado (`competition-page.tsx` y `*-calendar.tsx` eliminados).
- [x] `/api/valorant`, `/api/lol`, `/api/cod` y `/api/brawlstars` son Route Handlers Node con caché y rate limit.
- [x] Los 4 endpoints devuelven el último partido jugado y los próximos con marcador cuando la fuente lo proporciona.
- [x] La landing `/` muestra la identidad del club y las cards de las 5 competiciones.
- [x] Las páginas por equipo comparten `TeamTracker` y separan próximos (3) de recientes (10).
- [x] Los logos de los rivales se resuelven desde `lib/logos.ts`.
- [x] El favicon se sirve con URL `/logos/Team_Hereticslogo_220.ico`.
- [ ] Validación final de build/deploy en el entorno de producción.

---

## 7. Testing

- `pnpm typecheck` pasa sin errores (verificado 2026-09-12).
- `next dev` arranca y las rutas responden; validación manual en navegador durante las iteraciones de diseño.
- `next build` compila (verificado en sesiones previas; pendiente re-verificación tras cambios de UI).
- `/api/valorant`, `/api/lol`, `/api/cod` y `/api/brawlstars` devuelven JSON con la estructura esperada.

---

## 8. Preguntas, riesgos y pendientes

- [ ] **Riesgo — scraping frágil:** VLR.gg y Liquipedia cambian su HTML. **Mitigación:** selectores centralizados y revisión manual al detectar caída.
- [ ] **Riesgo — rate limiting de fuentes:** se mitiga con caché y límite de partidos por respuesta; monitorizar si las fuentes endurecen sus políticas.
- [ ] **Pendiente — deploy:** confirmar el entorno de despliegue y la configuración de caché/ISR en producción.

---

## 9. Referencias

- [Home / landing](app/page.tsx)
- [Tracker de equipo compartido](components/team-tracker.tsx)
- [Cabecera de equipo](components/team-header.tsx)
- [Card de competición](components/competition-card.tsx)
- [Scraper Valorant (Node)](app/api/valorant/route.ts)
- [Scraper LoL (Node)](app/api/lol/route.ts)
- [Scraper CoD (Node)](app/api/cod/route.ts)
- [Scraper Brawl Stars (Node)](app/api/brawlstars/route.ts)
- [Logos de rivales](lib/logos.ts)
- [Infra de caché](lib/api-cache.ts), [cliente HTTP](lib/http-client.ts), [rate limit](lib/rate-limit.ts)
- [Tema y estilos](app/globals.css)
- [SDD de caché](caching-api-data.md)
- [SDD de UI](team-tracker-ui.md)

---
