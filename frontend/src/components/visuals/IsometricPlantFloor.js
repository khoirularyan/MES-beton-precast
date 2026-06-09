// Interactive Isometric Plant Floor — Digital Twin overview
// Click any zone to view live details in the side panel.
// Pure SVG with subtle animations & status-aware coloring.

import { useState } from "react";
import { X, Activity, Thermometer, Droplets, Package, AlertTriangle, CheckCircle2, Cog } from "lucide-react";

// Status palette
const STATUS = {
  running:    { color: "#107E3E", bg: "#E6F5EC", label: "Beroperasi", pulse: true  },
  warning:    { color: "#E9730C", bg: "#FDF3E7", label: "Perhatian",  pulse: true  },
  idle:       { color: "#59687A", bg: "#EEF0F2", label: "Standby",     pulse: false },
  maintenance:{ color: "#9C4F00", bg: "#FBE6D2", label: "Maintenance", pulse: false },
  critical:   { color: "#B00020", bg: "#FBE6E9", label: "Kritis",      pulse: true  },
};

// Zone definitions — id, label, status, position (svg coords), metrics
const ZONES = [
  {
    id: "silos", label: "Silo Cluster", category: "Material Storage",
    status: "running",
    hot: { x: 120, y: 120, r: 18 },
    metrics: [
      { label: "Silo Semen 1", value: "82%", color: "#0A6ED1" },
      { label: "Silo Semen 2", value: "64%", color: "#0A6ED1" },
      { label: "Silo Semen 3", value: "28%", color: "#E9730C" },
      { label: "Konsumsi Hari Ini", value: "18.4 ton" },
    ],
    alerts: [{ level: "warning", text: "Silo 3 mendekati ambang batas minimum" }],
  },
  {
    id: "batching", label: "Batching Plant",  category: "Processing",
    status: "running",
    hot: { x: 250, y: 200, r: 18 },
    metrics: [
      { label: "Output Batch/Jam", value: "12.8 m³" },
      { label: "Utilisasi", value: "85%", color: "#107E3E" },
      { label: "Operator", value: "Sugeng W." },
      { label: "Mix Aktif", value: "K-400 / K-450" },
    ],
    alerts: [],
  },
  {
    id: "mixer", label: "Concrete Mixer",  category: "Processing",
    status: "warning",
    hot: { x: 360, y: 250, r: 18 },
    metrics: [
      { label: "Status", value: "Running" },
      { label: "Speed", value: "28 RPM" },
      { label: "Downtime Hari Ini", value: "0.8 jam", color: "#E9730C" },
      { label: "OEE", value: "62.8%", color: "#E9730C" },
    ],
    alerts: [{ level: "warning", text: "Mixer 2 mengalami downtime 48 menit pagi ini" }],
  },
  {
    id: "casting", label: "Casting Bay A & B",  category: "Production Line",
    status: "running",
    hot: { x: 540, y: 280, r: 22 },
    metrics: [
      { label: "Line Aktif", value: "2/2" },
      { label: "Mould Aktif", value: "132 / 150" },
      { label: "Produk", value: "U-Ditch 500, Box Culvert 1000" },
      { label: "Output Hari Ini", value: "132 unit" },
    ],
    alerts: [],
  },
  {
    id: "curing", label: "Steam Curing Chamber", category: "Curing",
    status: "running",
    hot: { x: 720, y: 240, r: 20 },
    metrics: [
      { label: "Chamber Aktif", value: "2/2" },
      { label: "Suhu Rata-rata", value: "65°C", color: "#E9730C" },
      { label: "Kelembaban", value: "92%", color: "#0070F2" },
      { label: "Unit Dalam Curing", value: "248 unit" },
    ],
    alerts: [],
  },
  {
    id: "demoulding", label: "Demoulding & Finishing", category: "Post-Process",
    status: "idle",
    hot: { x: 820, y: 320, r: 18 },
    metrics: [
      { label: "Status", value: "Menunggu Curing" },
      { label: "Antrian", value: "45 unit" },
      { label: "Operator", value: "2 orang" },
      { label: "ETA Mulai", value: "16:00 WIB" },
    ],
    alerts: [],
  },
  {
    id: "qc", label: "QC Station", category: "Quality",
    status: "running",
    hot: { x: 880, y: 380, r: 18 },
    metrics: [
      { label: "Inspeksi Hari Ini", value: "186 unit" },
      { label: "Lulus", value: "182", color: "#107E3E" },
      { label: "Reject", value: "4", color: "#B00020" },
      { label: "Reject Rate", value: "2.1%" },
    ],
    alerts: [],
  },
  {
    id: "storage", label: "Storage Yard", category: "Finished Goods",
    status: "warning",
    hot: { x: 700, y: 460, r: 22 },
    metrics: [
      { label: "Utilisasi", value: "92%", color: "#E9730C" },
      { label: "Stok Tersedia", value: "1.842 unit" },
      { label: "Reserved", value: "528 unit" },
      { label: "Available", value: "1.314 unit", color: "#107E3E" },
    ],
    alerts: [{ level: "warning", text: "Gudang FG mendekati kapasitas maksimum" }],
  },
  {
    id: "dispatch", label: "Loading Dock", category: "Logistics",
    status: "running",
    hot: { x: 480, y: 500, r: 18 },
    metrics: [
      { label: "Truk Loading", value: "2 unit" },
      { label: "DO Hari Ini", value: "5 DO" },
      { label: "Selesai", value: "3 DO", color: "#107E3E" },
      { label: "Berikutnya", value: "DO-2026-0182" },
    ],
    alerts: [],
  },
  {
    id: "maintenance", label: "Workshop Maintenance", category: "Maintenance",
    status: "maintenance",
    hot: { x: 200, y: 460, r: 16 },
    metrics: [
      { label: "Mesin Maintenance", value: "1 unit" },
      { label: "Mesin Down", value: "1 unit", color: "#B00020" },
      { label: "MTTR", value: "2.5 jam" },
      { label: "Teknisi On-call", value: "3 orang" },
    ],
    alerts: [{ level: "critical", text: "Forklift 2 dalam maintenance terjadwal" }],
  },
];

export const IsometricPlantFloor = ({ testId = "plant-floor" }) => {
  const [selected, setSelected] = useState(null);
  const zone = ZONES.find((z) => z.id === selected);
  const counts = ZONES.reduce((acc, z) => ((acc[z.status] = (acc[z.status] || 0) + 1), acc), {});

  return (
    <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden" data-testid={testId}>
      {/* Header strip */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#DFE3E8] bg-gradient-to-r from-[#0A2540] via-[#0854A1] to-[#0A6ED1]">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[#5DCB7E] animate-pulse" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#9DD8FF] font-semibold">Digital Twin · Industry 4.0</div>
            <div className="text-sm font-display font-semibold text-white">Plant Floor Overview — Live</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[#B9DCFF]">
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#5DCB7E] animate-pulse" />{counts.running || 0} Beroperasi</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#E9730C]" />{counts.warning || 0} Perhatian</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#59687A]" />{counts.idle || 0} Standby</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#9C4F00]" />{counts.maintenance || 0} Maintenance</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
        {/* SVG Plant */}
        <div className="relative bg-gradient-to-br from-[#0A1B2E] via-[#0E2540] to-[#102B4A] p-4 min-h-[520px]">
          <svg viewBox="0 0 980 600" className="w-full h-auto" style={{ filter: "drop-shadow(0 12px 30px rgba(0,0,0,0.35))" }}>
            <defs>
              {/* Isometric grid pattern */}
              <pattern id="isoGrid" width="60" height="34" patternUnits="userSpaceOnUse" patternTransform="skewX(-30)">
                <path d="M 60 0 L 0 0 0 34" fill="none" stroke="#1E4675" strokeWidth="0.4" opacity="0.55" />
              </pattern>
              <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1A3458" />
                <stop offset="100%" stopColor="#0A1B2E" />
              </linearGradient>
              <linearGradient id="silo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D8DCE2" />
                <stop offset="100%" stopColor="#8E97A2" />
              </linearGradient>
              <linearGradient id="bldg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3D5A7F" />
                <stop offset="100%" stopColor="#21384F" />
              </linearGradient>
              <linearGradient id="bldgLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5C7FA8" />
                <stop offset="100%" stopColor="#3D5A7F" />
              </linearGradient>
              <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7090BC" />
                <stop offset="100%" stopColor="#4A6586" />
              </linearGradient>
              <linearGradient id="curingGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBC36C" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#E9730C" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="conveyor" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FBC36C" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#FFE7A6" stopOpacity="1" />
                <stop offset="100%" stopColor="#FBC36C" stopOpacity="0.8" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Floor base (isometric diamond) */}
            <polygon points="40,360 490,80 940,360 490,560" fill="url(#floorGrad)" stroke="#1E4675" strokeWidth="1.2" />
            {/* Grid overlay */}
            <polygon points="40,360 490,80 940,360 490,560" fill="url(#isoGrid)" opacity="0.4" />

            {/* Conveyor paths (yellow dashed) */}
            <g stroke="url(#conveyor)" strokeWidth="3" fill="none" strokeDasharray="6 4" opacity="0.7">
              <path d="M 145 145 L 270 215" />
              <path d="M 290 215 L 360 250" />
              <path d="M 390 270 L 540 290" />
              <path d="M 570 290 L 720 250" />
              <path d="M 740 260 L 820 320" />
              <path d="M 820 340 L 880 380" />
              <path d="M 700 410 L 700 460" />
              <path d="M 660 470 L 510 500" />
            </g>

            {/* === SILOS (top-left) === */}
            <g transform="translate(80, 70)">
              {[0, 32, 64].map((offset, i) => (
                <g key={i} transform={`translate(${offset}, ${offset * 0.4})`}>
                  <polygon points="0,30 18,20 36,30 36,90 18,100 0,90" fill="url(#silo)" stroke="#1E4675" strokeWidth="0.8" />
                  <polygon points="0,30 18,20 18,80 0,90" fill="#9AA5B1" />
                  <polygon points="6,30 12,18 24,18 30,30" fill="#D8DCE2" />
                  {/* Fill indicator */}
                  <rect x="3" y={36 + (i === 2 ? 30 : i === 1 ? 18 : 10)} width="6" height={50 - (i === 2 ? 30 : i === 1 ? 18 : 10)} fill={i === 2 ? "#E9730C" : "#0A6ED1"} opacity="0.85" />
                </g>
              ))}
            </g>

            {/* === BATCHING PLANT === */}
            <g transform="translate(200, 140)">
              <polygon points="0,80 60,50 120,80 120,140 60,170 0,140" fill="url(#bldg)" stroke="#1E4675" strokeWidth="0.8" />
              <polygon points="0,80 60,50 60,140 0,140" fill="url(#bldgLight)" />
              <polygon points="0,80 60,50 120,80 60,110" fill="url(#roof)" />
              {/* Window lights */}
              {[100, 115, 130].map((y, i) => (
                <rect key={i} x="8" y={y} width="6" height="4" fill="#FBC36C" opacity="0.9" />
              ))}
              {/* Label tag */}
              <rect x="20" y="155" width="80" height="14" rx="2" fill="#0A2540" opacity="0.8" />
              <text x="60" y="165" textAnchor="middle" fontSize="9" fill="#9DD8FF" fontFamily="IBM Plex Sans" letterSpacing="1">BATCHING</text>
            </g>

            {/* === MIXER (cylindrical) === */}
            <g transform="translate(330, 200)">
              <ellipse cx="30" cy="80" rx="30" ry="10" fill="#3D5A7F" stroke="#1E4675" strokeWidth="0.8" />
              <rect x="0" y="40" width="60" height="40" fill="url(#bldgLight)" />
              <ellipse cx="30" cy="40" rx="30" ry="10" fill="#5C7FA8" stroke="#1E4675" strokeWidth="0.8" />
              {/* Rotating mark */}
              <line x1="30" y1="40" x2="30" y2="30" stroke="#E9730C" strokeWidth="2" />
              <circle cx="30" cy="40" r="3" fill="#E9730C" />
              {/* Label */}
              <rect x="0" y="95" width="60" height="12" rx="2" fill="#0A2540" opacity="0.8" />
              <text x="30" y="104" textAnchor="middle" fontSize="8" fill="#9DD8FF" fontFamily="IBM Plex Sans" letterSpacing="1">MIXER</text>
            </g>

            {/* === CASTING BAY (large hall) === */}
            <g transform="translate(440, 220)">
              <polygon points="0,80 100,40 200,80 200,160 100,200 0,160" fill="url(#bldg)" stroke="#1E4675" strokeWidth="1" />
              <polygon points="0,80 100,40 100,160 0,160" fill="url(#bldgLight)" />
              <polygon points="0,80 100,40 200,80 100,120" fill="url(#roof)" />
              {/* Roof ridges */}
              <line x1="20" y1="72" x2="120" y2="32" stroke="#9DBFE3" strokeWidth="0.6" opacity="0.6" />
              <line x1="60" y1="60" x2="160" y2="20" stroke="#9DBFE3" strokeWidth="0.6" opacity="0.6" />
              {/* Bay door (lit) */}
              <rect x="44" y="135" width="20" height="22" fill="#FBC36C" opacity="0.9" />
              <rect x="68" y="138" width="14" height="18" fill="#FBC36C" opacity="0.6" />
              {/* Mould rows (inside) */}
              {[0, 1, 2].map((r) => (
                <g key={r} opacity="0.8">
                  <rect x={20 + r * 18} y={100 + r * 8} width="22" height="6" fill="#C7CCD3" />
                  <rect x={50 + r * 18} y={88 + r * 8} width="22" height="6" fill="#C7CCD3" />
                </g>
              ))}
              <rect x="60" y="170" width="80" height="14" rx="2" fill="#0A2540" opacity="0.8" />
              <text x="100" y="180" textAnchor="middle" fontSize="9" fill="#9DD8FF" fontFamily="IBM Plex Sans" letterSpacing="1">CASTING BAY</text>
            </g>

            {/* === CURING CHAMBERS (with steam glow) === */}
            <g transform="translate(660, 180)">
              {/* Glow */}
              <ellipse cx="60" cy="60" rx="80" ry="40" fill="url(#curingGlow)" opacity="0.25" filter="url(#glow)" />
              {/* Steam puffs */}
              <g opacity="0.55">
                <circle cx="30" cy="20" r="6" fill="#9DD8FF">
                  <animate attributeName="cy" values="20;5;20" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0.1;0.7" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="55" cy="15" r="5" fill="#9DD8FF">
                  <animate attributeName="cy" values="15;0;15" dur="3.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0.1;0.7" dur="3.4s" repeatCount="indefinite" />
                </circle>
                <circle cx="80" cy="22" r="6" fill="#9DD8FF">
                  <animate attributeName="cy" values="22;7;22" dur="3.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0.1;0.7" dur="3.8s" repeatCount="indefinite" />
                </circle>
              </g>
              {/* Chamber 1 */}
              <polygon points="0,80 50,55 100,80 100,130 50,155 0,130" fill="url(#bldg)" stroke="#E9730C" strokeWidth="1" opacity="0.9" />
              <polygon points="0,80 50,55 50,130 0,130" fill="#3D5A7F" />
              <polygon points="0,80 50,55 100,80 50,105" fill="url(#roof)" />
              {/* Heat vents */}
              {[14, 28, 42].map((x, i) => (
                <rect key={i} x={x} y="58" width="6" height="3" fill="#E9730C" opacity="0.9">
                  <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.6s" repeatCount="indefinite" />
                </rect>
              ))}
              {/* Chamber 2 (slightly offset) */}
              <g transform="translate(70, 30)">
                <polygon points="0,80 50,55 100,80 100,130 50,155 0,130" fill="url(#bldg)" stroke="#E9730C" strokeWidth="1" opacity="0.9" />
                <polygon points="0,80 50,55 50,130 0,130" fill="#3D5A7F" />
                <polygon points="0,80 50,55 100,80 50,105" fill="url(#roof)" />
                {[14, 28, 42].map((x, i) => (
                  <rect key={i} x={x} y="58" width="6" height="3" fill="#E9730C" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.6s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
                  </rect>
                ))}
              </g>
              <rect x="60" y="180" width="80" height="14" rx="2" fill="#0A2540" opacity="0.8" />
              <text x="100" y="190" textAnchor="middle" fontSize="9" fill="#9DD8FF" fontFamily="IBM Plex Sans" letterSpacing="1">CURING</text>
            </g>

            {/* === DEMOULDING === */}
            <g transform="translate(790, 290)">
              <polygon points="0,40 40,20 80,40 80,80 40,100 0,80" fill="url(#bldg)" stroke="#1E4675" strokeWidth="0.8" opacity="0.85" />
              <polygon points="0,40 40,20 40,80 0,80" fill="url(#bldgLight)" />
              <polygon points="0,40 40,20 80,40 40,60" fill="url(#roof)" />
              <rect x="6" y="92" width="68" height="11" rx="2" fill="#0A2540" opacity="0.8" />
              <text x="40" y="100" textAnchor="middle" fontSize="8" fill="#9DD8FF" fontFamily="IBM Plex Sans" letterSpacing="1">DEMOULD</text>
            </g>

            {/* === QC STATION === */}
            <g transform="translate(840, 340)">
              <polygon points="0,40 40,20 80,40 80,80 40,100 0,80" fill="url(#bldg)" stroke="#107E3E" strokeWidth="1.2" />
              <polygon points="0,40 40,20 40,80 0,80" fill="url(#bldgLight)" />
              <polygon points="0,40 40,20 80,40 40,60" fill="url(#roof)" />
              {/* QC stamp icon */}
              <circle cx="40" cy="55" r="6" fill="#107E3E" />
              <path d="M37 55 L 39 57 L 43 53" stroke="white" strokeWidth="1.4" fill="none" />
              <rect x="6" y="92" width="68" height="11" rx="2" fill="#0A2540" opacity="0.8" />
              <text x="40" y="100" textAnchor="middle" fontSize="8" fill="#5DCB7E" fontFamily="IBM Plex Sans" letterSpacing="1">QC</text>
            </g>

            {/* === STORAGE YARD (stacked products) === */}
            <g transform="translate(600, 400)">
              <polygon points="0,60 100,30 200,60 200,120 100,150 0,120" fill="url(#bldg)" stroke="#1E4675" strokeWidth="0.8" opacity="0.5" />
              {/* Stacked product piles (visible) */}
              {[
                [20, 70], [50, 60], [80, 70], [110, 60], [140, 70],
                [35, 90], [65, 80], [95, 90], [125, 80], [155, 90],
                [50, 110], [80, 100], [110, 110], [140, 100],
              ].map(([x, y], i) => (
                <g key={i}>
                  <rect x={x} y={y} width="18" height="10" fill="#9AA5B1" stroke="#1E4675" strokeWidth="0.4" />
                  <rect x={x} y={y} width="18" height="2" fill="#0A6ED1" opacity="0.6" />
                </g>
              ))}
              <rect x="60" y="155" width="80" height="13" rx="2" fill="#0A2540" opacity="0.8" />
              <text x="100" y="164" textAnchor="middle" fontSize="9" fill="#9DD8FF" fontFamily="IBM Plex Sans" letterSpacing="1">STORAGE YARD</text>
            </g>

            {/* === LOADING DOCK with truck === */}
            <g transform="translate(420, 460)">
              <polygon points="0,40 50,20 120,40 120,80 50,100 0,80" fill="url(#bldg)" stroke="#1E4675" strokeWidth="0.8" opacity="0.8" />
              <polygon points="0,40 50,20 50,80 0,80" fill="url(#bldgLight)" />
              {/* Truck */}
              <g transform="translate(40, 28)">
                <rect x="0" y="0" width="22" height="14" fill="#9AA5B1" stroke="#1E4675" strokeWidth="0.4" />
                <rect x="0" y="0" width="22" height="3" fill="#0A6ED1" />
                <path d="M22 4 L 30 4 L 32 8 L 32 14 L 22 14 Z" fill="#E9730C" />
                <circle cx="6" cy="15" r="2" fill="#0A1B2E" />
                <circle cx="18" cy="15" r="2" fill="#0A1B2E" />
                <circle cx="28" cy="15" r="2" fill="#0A1B2E" />
              </g>
              <rect x="20" y="92" width="80" height="11" rx="2" fill="#0A2540" opacity="0.8" />
              <text x="60" y="100" textAnchor="middle" fontSize="8" fill="#9DD8FF" fontFamily="IBM Plex Sans" letterSpacing="1">LOADING DOCK</text>
            </g>

            {/* === MAINTENANCE WORKSHOP === */}
            <g transform="translate(150, 410)">
              <polygon points="0,40 30,25 70,40 70,80 30,100 0,80" fill="url(#bldg)" stroke="#9C4F00" strokeWidth="1" opacity="0.85" />
              <polygon points="0,40 30,25 30,80 0,80" fill="url(#bldgLight)" />
              <polygon points="0,40 30,25 70,40 30,55" fill="url(#roof)" />
              {/* Tool icon */}
              <g transform="translate(28, 50)">
                <path d="M0 0 L 4 4 L 0 8" stroke="#FBC36C" strokeWidth="1.5" fill="none" />
              </g>
              <rect x="0" y="92" width="68" height="11" rx="2" fill="#0A2540" opacity="0.8" />
              <text x="34" y="100" textAnchor="middle" fontSize="8" fill="#FBC36C" fontFamily="IBM Plex Sans" letterSpacing="1">WORKSHOP</text>
            </g>

            {/* === Hotspot indicators (clickable) === */}
            {ZONES.map((z) => {
              const s = STATUS[z.status];
              const isSelected = selected === z.id;
              return (
                <g
                  key={z.id}
                  data-testid={`zone-${z.id}`}
                  onClick={() => setSelected(z.id)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Outer pulse */}
                  {s.pulse && (
                    <circle cx={z.hot.x} cy={z.hot.y} r={z.hot.r} fill={s.color} opacity="0.25">
                      <animate attributeName="r" values={`${z.hot.r};${z.hot.r + 8};${z.hot.r}`} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.35;0;0.35" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Outer ring */}
                  <circle cx={z.hot.x} cy={z.hot.y} r={z.hot.r - 2} fill={isSelected ? s.color : "white"} fillOpacity={isSelected ? 0.9 : 0.12} stroke={s.color} strokeWidth={isSelected ? 3 : 2} />
                  {/* Dot */}
                  <circle cx={z.hot.x} cy={z.hot.y} r="5" fill={s.color} stroke="white" strokeWidth="1.5" />
                  {/* Hover label (visible on selected) */}
                  {isSelected && (
                    <g>
                      <rect x={z.hot.x - 60} y={z.hot.y - z.hot.r - 22} width="120" height="16" rx="3" fill="#0A2540" stroke={s.color} strokeWidth="1" />
                      <text x={z.hot.x} y={z.hot.y - z.hot.r - 10} textAnchor="middle" fontSize="9" fill="white" fontFamily="IBM Plex Sans" fontWeight="600">{z.label}</text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Top corner watermark */}
            <text x="60" y="50" fontSize="10" fill="#9DD8FF" opacity="0.5" fontFamily="JetBrains Mono" letterSpacing="2">PLANT SURABAYA · BAY 01</text>
          </svg>

          {/* Legend overlay */}
          <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center gap-2 text-[10px] text-[#B9DCFF]">
            <span className="bg-[#0A1B2E]/70 backdrop-blur px-2 py-1 rounded border border-[#1E4675]">Klik node untuk detail zona</span>
            <span className="bg-[#0A1B2E]/70 backdrop-blur px-2 py-1 rounded border border-[#1E4675] font-mono-num">10 zona aktif</span>
          </div>
        </div>

        {/* Side detail panel */}
        <aside className="border-l border-[#DFE3E8] bg-[#F8FAFC] min-h-[520px]" data-testid="plant-floor-panel">
          {!zone ? (
            <div className="p-6 h-full flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#E5F0FA] flex items-center justify-center mb-3">
                <Activity className="w-5 h-5 text-[#0A6ED1]" />
              </div>
              <div className="text-sm font-semibold text-[#1C252E] mb-1">Pilih Zona untuk Detail</div>
              <div className="text-xs text-[#59687A] max-w-[240px]">
                Klik salah satu node berkedip di peta untuk melihat status real-time, KPI, dan peringatan zona tersebut.
              </div>
              <div className="mt-6 w-full max-w-[260px] space-y-2 text-left">
                {ZONES.slice(0, 5).map((z) => {
                  const s = STATUS[z.status];
                  return (
                    <button
                      key={z.id}
                      data-testid={`zone-list-${z.id}`}
                      onClick={() => setSelected(z.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 bg-white border border-[#DFE3E8] rounded hover:border-[#0A6ED1] transition-colors text-left"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-[#1C252E] flex-1 truncate">{z.label}</span>
                      <span className="text-[10px] text-[#59687A]">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">{zone.category}</div>
                  <div className="text-base font-semibold text-[#1C252E] font-display">{zone.label}</div>
                </div>
                <button
                  data-testid="plant-floor-close"
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 rounded hover:bg-[#EEF0F2] flex items-center justify-center text-[#59687A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                  style={{ backgroundColor: STATUS[zone.status].bg, color: STATUS[zone.status].color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS[zone.status].color }} />
                  {STATUS[zone.status].label}
                </span>
                <span className="text-[10px] text-[#59687A] font-mono-num">ID · {zone.id.toUpperCase()}</span>
              </div>

              <div className="space-y-2 mb-4">
                {zone.metrics.map((m, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border border-[#DFE3E8] rounded px-3 py-2">
                    <span className="text-xs text-[#59687A]">{m.label}</span>
                    <span className="text-sm font-semibold font-mono-num" style={{ color: m.color || "#1C252E" }}>{m.value}</span>
                  </div>
                ))}
              </div>

              {zone.alerts.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold mb-2">Peringatan Aktif</div>
                  {zone.alerts.map((a, i) => {
                    const aColor = a.level === "critical" ? "#B00020" : "#E9730C";
                    return (
                      <div key={i} className="flex items-start gap-2 bg-white border-l-2 rounded px-3 py-2" style={{ borderLeftColor: aColor }}>
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: aColor }} />
                        <div className="text-[11px] text-[#1C252E]">{a.text}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {zone.alerts.length === 0 && (
                <div className="flex items-center gap-2 bg-[#E6F5EC] border border-[#107E3E]/20 rounded px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#107E3E]" />
                  <div className="text-[11px] text-[#107E3E] font-medium">Tidak ada peringatan aktif</div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-[#DFE3E8]">
                <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold mb-2">Sensor Telemetri</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white border border-[#DFE3E8] rounded p-2 text-center">
                    <Thermometer className="w-3.5 h-3.5 text-[#E9730C] mx-auto mb-1" />
                    <div className="text-[9px] text-[#59687A]">Suhu</div>
                    <div className="text-xs font-mono-num font-semibold text-[#1C252E]">32°C</div>
                  </div>
                  <div className="bg-white border border-[#DFE3E8] rounded p-2 text-center">
                    <Droplets className="w-3.5 h-3.5 text-[#0070F2] mx-auto mb-1" />
                    <div className="text-[9px] text-[#59687A]">RH</div>
                    <div className="text-xs font-mono-num font-semibold text-[#1C252E]">68%</div>
                  </div>
                  <div className="bg-white border border-[#DFE3E8] rounded p-2 text-center">
                    <Cog className="w-3.5 h-3.5 text-[#59687A] mx-auto mb-1" />
                    <div className="text-[9px] text-[#59687A]">Vibr.</div>
                    <div className="text-xs font-mono-num font-semibold text-[#1C252E]">0.4g</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-0 border-t border-[#DFE3E8]">
        {[
          { label: "Mould Active", value: "132 / 150", color: "#1C252E", icon: Package },
          { label: "In Use", value: "94 (63%)", color: "#0A6ED1", icon: Activity },
          { label: "Ready", value: "26 (17%)", color: "#107E3E", icon: CheckCircle2 },
          { label: "Maintenance", value: "12 (8%)", color: "#E9730C", icon: Cog },
          { label: "Cleaning", value: "6 (4%)", color: "#59687A", icon: Droplets },
        ].map((s, i) => {
          const I = s.icon;
          return (
            <div key={i} className="px-4 py-3 border-r border-[#DFE3E8] last:border-r-0" data-testid={`mould-stat-${i}`}>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#59687A] font-semibold mb-1">
                <I className="w-3 h-3" />{s.label}
              </div>
              <div className="text-base font-semibold font-mono-num" style={{ color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IsometricPlantFloor;
