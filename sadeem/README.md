# SADEEM Hangar · هانقر سديم

A sovereign virtual innovation hangar for **SADEEM Innovates (سديم للابتكار)**, the single national entry point for high-sensitivity technical and defence innovation. It comes in two modes over one record set:

- **Enter**: the facility itself. Visitors cross the three thresholds (Containment → Guidance → Governance), reach the Vision Chamber, then the Pipeline Hall, the Containment Vault and the capability labs.
- **Work**: the SADEEM OS, the daily work surface for analysts, the approving authority and the competent entities.

Arabic is the first language of the building. English is complete. Every mechanism is labelled *proposed · pending official approval*, and every record is an example until real data is approved.

## Zones

| Floor | Zone | Route |
|---|---|---|
| Facility | Entry Point · المدخل الوطني | `#arrival` |
| | Vision Chamber · قاعة الرؤية | `#vision` |
| Pipeline | Pipeline Hall · مسار سديم (11 stations) | `#lab` |
| | Containment Vault · قبو الاحتواء | `#gate` |
| | Command Deck · منصة القيادة | `#deck` |
| Capability labs | Vehicle Bay, Drone Lab, Factory of the Future, Digital Twin Lab, Mission Engineering | `#bay` `#drones` `#factory` `#twins` `#missions` |
| Knowledge & foresight | Innovation Library, Technology Radar, National Constellation, Foresight Telescope | `#library` `#radar` `#galaxy` `#foresight` |
| Work | SADEEM OS | `#os` |

Keyboard: `⌘K` / `Ctrl K` or `/` to search, `M` for the facility map, `1–7` and `0` to jump between the main zones.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine unit tests (vitest)
npm run build      # typecheck + production build into dist/
```

`dist/` is a static site with relative paths. It can be hosted on any static host or inside the sovereign environment.

## Structure

```
src/
  core/        i18n (ar/en, RTL), reference data, store, router, AI context, content loading
  shell/       dock with floor-grouped navigation, command palette, AI drawer, map, tour, sound
  engines/     pure simulation and rule engines (drone, vehicle, factory, ops, evaluation) with tests
  viewer/      three.js viewer and procedural reference platforms
  scenes/      WebGL scenes (nebula → star, national constellation)
  zones/       one module per zone
  styles/      tokens.css (identity), base.css (components), shell.css, zones/*.css
public/content/  quotes.json, radar.json, library.json (editable content; quotes carry source + verification)
legacy/        the previous single-file build, kept for reference
```

## Principles the code keeps

- **Containment**: the AI layer runs on local rules only. Nothing leaves the browser, and high-sensitivity records are never shown to any model.
- **Honest labels**: nothing appears as approved unless it is. Leadership statements show only official wording per language, never machine translation.
- **Identity**: bronze-olive `#534B31`, deep umber `#463A1E`, brushed gold `#C8A45C` on ivory, from the SADEEM concept sheet. Night staging only where the building is staged (entry, vault, bays, sky).
