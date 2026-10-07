# CIRQ — Circular Agri-Food Intelligence

CIRQ is an open, globally extensible circular-resource intelligence platform for agricultural and food systems. It connects agricultural residue and food-system by-products to verified, Pareto-optimal circular pathways (biochar, biomethane, industrial pellets, insect protein, biological compost) by evaluating real-world physical, thermodynamic, economic, and transport constraints.

---

## 1. Executive Summary & Differentiation

Instead of asking:
> *"What can we do with agricultural waste?"*

CIRQ asks:
> *"Given this material, its proximate composition, quantity, location, season, local demand, processor headroom, freight transport cost, environmental boundaries, and available technologies, what is the optimal viable circular pathway?"*

### Core Product Loop
```
Agricultural Biomass Stream
            ↓
Semantic Ontology Resolution (AGROVOC / NaLamKI)
            ↓
Composition & Quality Verification
            ↓
Circular Pathway Discovery & Multi-Objective Pareto Optimization
            ↓
Supply–Demand Matching & Facility Capacity Allocation
            ↓
Green Freight Logistics Optimization (GLEC Framework 3.0)
            ↓
Processing & Bio-product Valorization
            ↓
FAO EX-ACT LCA Carbon & Economic Impact Measurement
            ↓
Closed Circular Loop Reintegration (Soil Fertility / Renewable Energy)
```

---

## 2. Architecture & Design Principles

### A. Zero Mock Data Invariant
- The frontend is a thin, typed client querying `/api/v1`.
- Every number, label, node, route, and metric rendered originates from a real API response.
- Every dynamic value displays its provenance state (`LIVE`, `DEMO`, `CACHED`, `STALE`, `ERROR`), evidence counts, and freshness.
- No bare scores: every score displays `value / 100`, confidence label, evidence citations, and methodology standard.

### B. Design System & Reference Heritage
- Derived from the FarmEsy and dark-mode scientific intelligence reference specifications.
- Palette: Charcoal canvas (`#0B0D0D`, `#101313`), structural panel surfaces (`#111615`, `#151A18`), restrained agricultural greens (`#8BCF45`, `#9ED957`), muted yellow accents (`#D6D75A`), information cyan (`#6DA8C8`), and hairline borders (`#26302C`, `#303936`).
- Zero-Pill discipline: unboxed metadata separated by clean typographic dots (`·`), reserving bordered buttons strictly for functional filter controls and segmented selectors.
- Tabular numerals (`tabular-nums`) across all metrics, tables, and sparklines.

---

## 3. Screen Inventory

| Route | Feature Screen | Purpose & Connected Endpoints |
|---|---|---|
| `/` | **Overview** | Command centre: metric tiles, global network hero map, resource spotlight, flow, composition, live events (`/map/overview`, `/impact/overview`, `/system/events`, `/system/events/stream`) |
| `/map` | **Global Resource Map** | Map with progressive spatial resolution, layer toggles, region filter, twin synchronized list/table view (`/map/*`, `/search/regions`) |
| `/resources` | **Resources List** | Server-side filtered table, concept resolver, batch import dialog (`/resources`, `/resources/import`, `/resources/resolve`) |
| `/resources/:id` | **Resource Intelligence** | 16 deep inspection tabs: Identity, Availability, Composition, Quality, Geography, Seasonality, Pathways, Processors, Demand, Logistics, Economics, Impact, Research, Provenance, AI Analysis, History (`/resources/{id}/*`, `/knowledge/resources/{id}`) |
| `/graph` | **Resource Graph** | Inspectable circular knowledge graph: Feedstock ➔ Process ➔ Product ➔ Carbon Sink (`/network/*`) |
| `/pathways` | **Pathway Explorer** | Ranked pathways, score breakdown, confidence panel, side-by-side comparison, human oversight actions (Accept, Reject, Modify, Request Evidence) (`/pathways/*`) |
| `/simulator` | **Pathway Simulator** | Input parameter controls + mass/energy balance Sankey flowchart bound to live simulation API (`/simulations/*`) |
| `/processors` | **Processors Registry** | Processing facilities list, capacity gauges, capabilities, queue depth, impact (`/processors/*`) |
| `/matching` | **Supply-to-Processor Matching** | Algorithmic matchmaking with transparency explanation criteria and human oversight (`/matching/*`, `/processors/match`) |
| `/logistics` | **Logistics Optimizer** | GLEC Framework 3.0 route optimizer, mode comparisons (Diesel vs Electric vs Tractor), turn-by-turn directions (`/logistics/*`, `/map/routes`) |
| `/impact` | **Impact Observatory** | Planetary boundary accounting (avoided burning, soil organic carbon accretion, renewable energy, unlocked gate value) (`/impact/*`, `/provenance/impacts/{id}`) |
| `/ai` | **AI Services & Traces** | Schema-driven dynamic forms, service health, execution list, step-by-step trace timeline (`/ai/*`) |
| `/data` | **Data Observatory** | Lineage and license tracking for FAOSTAT, Copernicus Sentinel-2, NASA POWER, ESA WorldCover, AGROVOC (`/data/sources/*`) |
| `/integrations` | **Integration Hub** | Connectors for AgriFoodData Farm Twin, OGC SensorThings, ESA Sentinel, test ping, sync trigger, logs (`/integrations/*`) |
| `/scenarios` | **Scenario Lab** | What-if sensitivity modeling (supply surges, freight spikes, carbon credit price delta) with baseline vs scenario diff (`/scenarios/*`) |
| `/loops` | **Circular Loops** | Closed-loop agro-ecological systems, 5-year payback simulations, loop geometry (`/loops/*`) |
| `/research` | **Research & Evidence** | Peer-reviewed agronomic literature, DOIs, experimental conditions, yield validations (`/knowledge/*`) |
| `/demo` | **Global Circularity Demo** | Executes real 9-step physical-to-intelligence loop in real-time (`/demo`) |
| `/system` | **System Health** | Liveness, readiness, microservice topology, queue depths (`/health/*`, `/system/metrics`) |
| `/settings` | **Settings** | Unit system (Metric/Imperial), currency (USD/EUR/INR/BRL/KES), user roles, session token |
| `/__ui` | **Component Gallery** | Living development showcase of all design tokens, states, cards, and meters |

---

## 4. Setup and Development

See `docs/MANUAL_STEPS.md` for credentials and platform values, `docs/AUDIT.md` for what is real vs. still fake,
and `docs/TODO.md` for the ordered plan.

```bash
npm install
python3.12 -m venv .venv && . .venv/bin/activate
pip install -e "backend/[test]"            # + ,appext for SDK sign-in
cp .env.example .env                       # fill it in
npm run dev                                # Vite :5173, Python API :8100, legacy engine :3001
npm run ingest                             # index backend/corpus into Db2
pytest backend/tests && npm run lint
```
Production: `docker build -t cirq .` (see `.bob/skills/deploy-container`).

---

## 5. Known Limitations & Roadmap
- The Express domain engine still serves most `/api/v1` routes through a Python proxy (strangler-fig); port plan in `docs/TODO.md` P2.
- Seed data (5 resources, 5 processors, 5 pathways, 3 loops) is demo data and in-memory. Do not present it as live.
- The zero-mock invariant in §2A is the goal, not yet the state: 67 hardcoded `LIVE` literals remain (`docs/AUDIT.md` §3).
- Basemap tiles may be blocked by the SDK's strict CSP (`docs/MANUAL_STEPS.md` §6).
- Project assistant configuration for IBM Bob lives in `.bob/`.

---

## 6. License
Apache-2.0 Open Source License.
# CIRQ-Vishwa
