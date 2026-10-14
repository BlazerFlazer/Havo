# HAVO

**HAVO** (*havo* means "air" in Uzbek) is a youth-focused environmental action platform about air pollution in Uzbekistan, built for teenagers aged 13–18, student clubs and teachers.

It answers one question: *how can teenagers realistically help reduce air pollution in Uzbekistan?* It explains the problem honestly, then turns it into concrete, safe, trackable actions. It also makes clear that individual habits matter but can't replace public policy, cleaner transport, modern heating, industrial controls and monitoring.

The interface is entirely in **Russian**. Code, comments and this README are in English.

---

## Features

| Section | What it does |
|---|---|
| **Hero** | Cinematic Three.js globe with real country borders (Natural Earth data, bundled). Uzbekistan is highlighted and there is a symbolic "smog → clean air" particle transition. Pointer parallax and scroll-linked motion. CSS fallback while loading or when WebGL is unavailable. |
| **Manifest** | Scroll-linked statement over a lightweight 2D particle field that reacts to scroll and pointer. |
| **Проблема** | Verified Tashkent figures (World Bank 2024) and an accordion that separates *emission sources* from *weather conditions*. Includes an **interactive inversion lab** (canvas model of a valley), PM2.5/PM10/NO₂/O₃ cards with WHO 2021 guideline levels, a particle-size figure drawn to scale, an AQI explainer comparing two index systems, and an «Источники и методология» section. |
| **Уровни перемен** | CSS-3D "plates" showing what individuals, schools, communities and the state each control. |
| **Действия** | **Action finder** (5 questions, explained recommendations, empty and stale states) and a **library of 27 actions** with category and effect filters. Each action has difficulty, time, cost, materials, safety notes, steps and an honest benefit statement in a detail drawer. |
| **Инструменты** | **Impact calculator** (formula, units, sources, uncertainty range, isometric chart, transport comparison chart), **air-quality dashboard** (live only when configured, see below) and a **13-question quiz** with feedback, score and review of mistakes. |
| **Инициативы** | Six template youth projects with roles, plans, materials, a persistent safety checklist and realistic outcomes, plus a validated **proposal form**. Proposals are stored locally only; the form asks for no personal data and rejects phone numbers and e-mail addresses. |
| **Мой вклад** | Personal planner (add, remove, complete, deadlines, notes, clear with confirmation), participation points, streaks, weekly goal, 8 badges, milestones, history and progress reset. Everything persists in `localStorage`. No accounts, rankings or fake community numbers. |

## Tech stack

- **Next.js 16** (App Router, Turbopack) and **React 19**, plain JavaScript
- **three.js**, **@react-three/fiber**, **@react-three/drei** (only `PerformanceMonitor` is used)
- **d3-geo**, **topojson-client** and **world-atlas**, which turn bundled map data into the globe texture at runtime
- **motion** (Framer Motion) for interface animation, **lucide-react** for icons, **recharts** for the transport chart
- Fonts are self-hosted from npm through Fontsource: Manrope, Cormorant Garamond and JetBrains Mono, all with Cyrillic
- CSS Modules plus one global design-token stylesheet (`app/globals.css`)

There is no database, authentication or paid service. The site works fully offline from external APIs.

## Getting started

Requires Node.js 20.9 or newer (developed on Node 22).

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build (after `npm run build`) |
| `npm run lint` | ESLint (Next.js core-web-vitals config, including React Compiler rules) |
| `npm test` | Unit tests with Node's built-in test runner (no extra dependencies) |

## Project structure

```
app/                  layout, page, global design tokens, API route
  api/air-quality/    server proxy for the optional live data provider
components/
  layout/             Header (sticky nav, mobile menu), Footer, Providers
  sections/           one component per page section
  three/              hero globe: scene, shaders, map texture, CSS fallback
  canvas/             2D particle field
  ui/                 Button, Sheet (drawer), ConfirmDialog, ChoiceGroup, Reveal, …
config/dataSources.js ALL external links, API settings and emission factors
data/                 educational content: actions, initiatives, quiz, pollution, cities
features/             feature logic + UI (actions, planner, progress, quiz, impact, air, …)
hooks/                small shared hooks (media queries, viewport, dialogs)
lib/                  formatting, storage, scroll, WAQI response normaliser
tests/                unit tests (node --test)
```

Content lives apart from rendering. To edit texts, open `data/`. To change links, factors or API settings, edit `config/dataSources.js`. Pure logic (`finder.js`, `impact.js`, `progress.js`, `proposal.js`, `waqi.js`, `inversionSim.js`) has no React imports and is unit-tested.

## Environment variables

All are optional. Copy `.env.example` to `.env.local`.

| Variable | Used by | Effect |
|---|---|---|
| `WAQI_API_TOKEN` | `app/api/air-quality/route.js` (server only) | Enables live readings in the air-quality dashboard. |

## Air-quality data

**Default (no token):** the dashboard shows a clearly labelled "Демонстрационный режим / Живые данные не подключены" state. It links to verified monitoring sites (Uzhydromet's monitoring portal, aqicn.org and IQAir) and explains how to read PM data. **No made-up readings are ever displayed.**

**With `WAQI_API_TOKEN`:** the server route calls the [World Air Quality Index API](https://aqicn.org/json-api/doc/) `feed/geo:{lat};{lon}` endpoint for the selected city.

- **Units:** WAQI `iaqi` values are **AQI sub-indices on the US EPA scale**, *not* µg/m³. The UI labels them "индекс, не мкг/м³" and shows the US EPA category.
- **Timestamps and staleness:** the station's observation time is shown. Readings older than 3 hours get a "Данные устарели" warning (`AIR_QUALITY.staleAfterHours`).
- **Coverage:** the API returns the *nearest* station. If it is more than 40 km from the city centre (`maxStationDistanceKm`), the dashboard says so rather than presenting it as that city's data. Station coverage in Uzbekistan outside Tashkent may be limited.
- **Caching:** successful upstream responses are cached on the server for 15 minutes (`revalidateSeconds`).
- **States handled:** loading, unconfigured, ok, stale, no-station, no-data and error (with retry).
- **Attribution and terms:** attribution to the World Air Quality Index Project *and* the originating agency is mandatory and shown in the UI. Per [aqicn.org/api](https://aqicn.org/api/), the data may not be used commercially or redistributed, and public non-profit use requires notifying the WAQI team first.

> The live path is covered by unit tests against the documented response shape. It has **not** been exercised against the real API with a real token in this repository.

## Impact calculator: method and limitations

`ΔCO₂ [kg] = trips/week × km/trip × weeks × (EF_car − EF_alternative) / 1000`

- **Car:** about 249 g CO₂/km, converted from US EPA's "about 400 g CO₂ per mile" for a typical US passenger vehicle. Users can enter their own factor.
- **Bus:** shown as a range, from 0 (marginal: the bus runs anyway) to about 104 g CO₂e per passenger-km (UK DESNZ 2025, average local bus).
- **Walking/cycling:** 0 g tailpipe emissions. Food and manufacturing are out of scope.
- **Car-sharing (2 people):** half the car factor per person.
- The factors come from US and UK fleets. Most private cars in Uzbekistan run on methane or propane (Statistics Agency, 2022), so real values differ. Results are rounded order-of-magnitude estimates.
- The calculator estimates **greenhouse-gas emissions only**. It says nothing about local PM2.5 concentrations, which depend on many sources and the weather, and the UI states this explicitly.

## 3D, performance and accessibility

- The globe (three.js, map data) and Recharts are **code-split** and loaded only on the client. Initial page JS does not include them.
- Adaptive quality: weaker or touch devices get fewer particles, fewer noise octaves and a lower pixel-ratio cap. `PerformanceMonitor` downgrades further if FPS drops.
- The render loop stops when the hero is off-screen (`frameloop="never"`). Canvas animations pause when not visible.
- Geometries, materials and textures are disposed on unmount.
- Errors inside the WebGL tree, a missing WebGL context or a lost context all fall back to the CSS globe without affecting the page.
- `prefers-reduced-motion` gives a static globe, settled (non-animated) simulations, no counters animation and instant transitions.
- Text and controls stay outside the canvas. The Uzbekistan label is a DOM element positioned from the 3D scene.
- The site uses semantic landmarks, a skip link, visible focus styles and labelled form fields. It also has ARIA tabs with arrow-key support, focus-trapped dialogs and drawers that restore focus, live regions for results and toasts, and a hidden data table behind the chart.

## Deployment

The app needs a Node.js runtime because of the `/api/air-quality` route.

- **Vercel:** import the repository and deploy. Optionally add `WAQI_API_TOKEN` in *Project → Settings → Environment Variables*.
- **Any Node host:** `npm ci && npm run build && npm start` (set `PORT` if needed).

## Sources and credits

All external links and the facts they support are listed in `config/dataSources.js` and on the site under «Источники и методология». The links were checked on 14 October 2026.

- Map data: Natural Earth (public domain), via the `world-atlas` package
- 3D simplex noise: Ian McEwan, Ashima Arts (MIT)
- Fonts: Manrope, Cormorant Garamond and JetBrains Mono (SIL Open Font License)
