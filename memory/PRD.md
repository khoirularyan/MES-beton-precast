# PrecastMES — Manufacturing Execution System (Phase 1: Frontend Demo)

## Original Problem Statement
Design a modern web-based MES dashboard for a Precast Concrete Factory. Professional industrial SaaS UI (SAP Fiori / Odoo / Oracle inspired) with blue/gray/white palette, data-rich cards, charts, and tables using TailwindCSS + React. Phase 1 is **frontend-only with realistic mock data**.

## Constraints (Phase 1)
- ❌ No backend, no database, no authentication
- ✅ Bahasa Indonesia localization throughout
- ✅ Mock data only (`/app/frontend/src/data/mockData.js`)
- ✅ Configurable, scalable, easy-to-understand UI

## Architecture (current)
```
/app/frontend/src/
├── data/
│   └── mockData.js                 # All mock data + KPI definitions + process definitions + business flow
├── components/
│   ├── shared/                     # PageHeader, KPICard, KPIDrilldownDialog, DetailDialog, FormDialog, StatusBadge, FilterPopover
│   ├── visuals/                    # ProductIcon, ProcessIcons, IndustrialVisuals, IsometricPlantFloor (interactive SVG plant map)
│   ├── layout/                     # AppLayout, Sidebar (15 nav items)
│   └── ui/                         # shadcn primitives
└── pages/                          # 15 pages (Dashboard, BusinessFlow, MasterData, MasterProcess, 11 ops modules)
```

## Implemented Features

### Iteration 1-3 (prior sessions)
- 13 MES pages: Dashboard, Master Data, Production Planning, Production Orders, Production Execution, Curing, QC, Inventory, Sales, Delivery, Purchasing, Maintenance, Reports
- Custom visual library: product SVG thumbnails, process icons, industrial silos/trucks, OEE radial gauges
- FactoryHero banner, defect image gallery, cement silos, delivery timeline, executive OEE gauges
- 100% test pass (iteration 3)

### Iteration 4 (Plant Floor + cleanup)
- **IsometricPlantFloor** — 10-zone interactive isometric SVG factory map with steam/conveyor animation, hotspot detail panel, stat strip. Integrated as a tab in Production Planning.
- Removed line illustration from Eksekusi Produksi line cards (user request)

### Iteration 5 — Configurability Layer (Feb 2026) ✅ 100% test pass
- **Master Data extended to 19 tabs**: added Tipe Produk, Spesifikasi, Kategori Material, Parameter QC, Kategori Defect, Status Produksi, Status Pengiriman
- **Master Proses page** (`/master-process`) — Visual workflow builder:
  - Summary strip (Total / Aktif / Durasi Siklus / Estimasi jam)
  - Horizontal visual workflow (active stages only) with colored chevrons
  - List builder with reorder (up/down), inline icon picker (10 lucide icons), color picker (9 colors), duration, active toggle, edit & delete
  - Add/Edit dialog with form validation
- **Alur Bisnis page** (`/business-flow`) — End-to-end visual:
  - Gradient hero strip with live demo badge
  - 6 process-flow nodes (Sales Order → PO → Produksi → QC → FG → Delivery) with input/output per node
  - Production process sub-stage strip (renders active process definitions)
  - Master Data sources panel summarizing configuration foundations
- **KPI Tooltip + Drilldown** on Dashboard:
  - Info (ⓘ) icon on every KPI card with hover tooltip (Bahasa Indonesia explanation)
  - Clicking card body opens **KPIDrilldownDialog** with: colored gradient header, value, formula, data source, 7-day trend AreaChart, breakdown bars
  - Info click uses stopPropagation (does not open dialog)
- 12 KPI cards × 12 kpiDefinitions wired with formula + dataSource + breakdown
- 10 process definitions, 6 business flow steps stored in mockData

## Routes
| Path | Page |
|---|---|
| `/` | Dashboard |
| `/business-flow` | Alur Bisnis (NEW) |
| `/master-data` | Master Data (19 tabs) |
| `/master-process` | Master Proses (NEW) |
| `/planning` | Perencanaan Produksi (Gantt + Plant Floor tabs) |
| `/production-orders` | Order Produksi |
| `/production-execution` | Eksekusi Produksi |
| `/curing` | Curing |
| `/quality` | Quality Control |
| `/inventory` | Persediaan |
| `/sales` | Order Penjualan |
| `/delivery` | Pengiriman |
| `/purchasing` | Pembelian |
| `/maintenance` | Pemeliharaan |
| `/reports` | Laporan |

## Master Data Entities (19 tabs)
Produk · Kategori Produk · Tipe Produk · Spesifikasi · Mutu Beton · Kategori Material · Material · Cetakan · Customer · Supplier · Gudang · Line Produksi · Mesin · Karyawan · Shift · Parameter QC · Kategori Defect · Status Produksi · Status Pengiriman

## Testing Status
- Iteration 5: **100% frontend pass** — 11/11 review items, 0 console errors, 0 regressions
- Test report: `/app/test_reports/iteration_5.json`

## Backlog / Future
- **P1** Wire master process changes to ProductionExecution flow display (currently static visual)
- **P1** Persist user changes (master data CRUD) to localStorage so demo state survives refresh
- **P1** Add "Heat Map" toggle on Plant Floor (utilization / temperature / alert density)
- **P2** Phase 2 — FastAPI backend + MongoDB (deferred per user)
- **P2** Authentication + role management (deferred)
- **P2** Multi-tenant / multi-plant switcher
