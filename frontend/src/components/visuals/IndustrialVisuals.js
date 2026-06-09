// Industrial visualizations: Cement silo, Aggregate stockpile, Warehouse fill,
// Truck illustration, Curing chamber, OEE gauge, Dashboard hero banner.

import { Truck } from "lucide-react";

// ===== Cement Silo =====
// Vertical silo with fill level (0-100)
export const CementSilo = ({ level = 70, label = "Silo Semen", capacity = "200 ton", className = "" }) => {
  const fillHeight = Math.min(100, Math.max(0, level));
  const color = level < 25 ? "#B00020" : level < 50 ? "#E9730C" : "#0A6ED1";
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg viewBox="0 0 80 140" className="w-full max-w-[110px]">
        {/* Conical top */}
        <polygon points="40,4 16,28 64,28" fill="#9AA5B1" stroke="#59687A" strokeWidth="1" />
        <polygon points="40,4 16,28 40,28" fill="#B5BCC4" />
        {/* Vent pipe */}
        <line x1="40" y1="4" x2="40" y2="-2" stroke="#59687A" strokeWidth="2" />
        {/* Main cylinder */}
        <rect x="14" y="28" width="52" height="78" fill="#DFE3E8" stroke="#59687A" strokeWidth="1" />
        <rect x="14" y="28" width="6" height="78" fill="#C7CCD3" />
        {/* Fill */}
        <clipPath id={`silo-clip-${label.replace(/\s/g,'')}`}>
          <rect x="14" y="28" width="52" height="78" />
        </clipPath>
        <rect
          x="14"
          y={28 + (78 - (78 * fillHeight / 100))}
          width="52"
          height={(78 * fillHeight / 100)}
          fill={color}
          opacity="0.85"
          clipPath={`url(#silo-clip-${label.replace(/\s/g,'')})`}
        />
        {/* Fill highlight gradient */}
        <rect
          x="14"
          y={28 + (78 - (78 * fillHeight / 100))}
          width="6"
          height={(78 * fillHeight / 100)}
          fill={color}
          opacity="0.5"
        />
        {/* Level lines */}
        {[25, 50, 75].map((pct) => (
          <line key={pct} x1="14" y1={28 + (78 * (100 - pct) / 100)} x2="20" y2={28 + (78 * (100 - pct) / 100)} stroke="#59687A" strokeWidth="0.6" />
        ))}
        {/* Conical bottom */}
        <polygon points="14,106 66,106 50,126 30,126" fill="#9AA5B1" stroke="#59687A" strokeWidth="1" />
        <polygon points="14,106 40,106 30,126" fill="#B5BCC4" />
        {/* Outlet */}
        <rect x="34" y="126" width="12" height="6" fill="#59687A" />
        {/* Legs */}
        <line x1="20" y1="132" x2="14" y2="140" stroke="#455468" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="60" y1="132" x2="66" y2="140" stroke="#455468" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="mt-2 text-center">
        <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">{label}</div>
        <div className="text-xl font-semibold font-mono-num" style={{ color }}>{level}%</div>
        <div className="text-[10px] text-[#59687A] font-mono-num">{capacity}</div>
      </div>
    </div>
  );
};

// ===== Aggregate Stockpile (cone-shaped pile) =====
export const AggregateStockpile = ({ level = 60, label = "Pasir Lumajang", capacity = "1.280 m³", color = "#9C4F00", className = "" }) => {
  const fillHeight = Math.min(100, Math.max(0, level));
  // Pile size scales with level
  const baseWidth = 100;
  const pileWidth = 40 + (baseWidth - 40) * (fillHeight / 100);
  const pileHeight = 20 + 40 * (fillHeight / 100);
  const startX = 60 - pileWidth / 2;
  const endX = 60 + pileWidth / 2;
  const apexY = 80 - pileHeight;
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg viewBox="0 0 120 90" className="w-full max-w-[140px]">
        {/* Ground line */}
        <line x1="6" y1="80" x2="114" y2="80" stroke="#59687A" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5" />
        {/* Pile shadow */}
        <ellipse cx="60" cy="82" rx={pileWidth / 2 + 4} ry="3" fill="#000" opacity="0.1" />
        {/* Pile */}
        <polygon
          points={`${startX},80 60,${apexY} ${endX},80`}
          fill={color}
          opacity="0.85"
          stroke="#5A2D00"
          strokeWidth="0.6"
        />
        {/* Lighter side */}
        <polygon points={`${startX},80 60,${apexY} 60,80`} fill={color} opacity="0.5" />
        {/* Texture (deterministic) */}
        {Array.from({ length: 8 }).map((_, i) => (
          <circle key={i} cx={20 + (i * 12)} cy={apexY + 4 + ((i * 4) % Math.max(2, pileHeight - 2))} r="0.8" fill="#3B1B00" opacity="0.5" />
        ))}
        {/* Top granular detail */}
        <circle cx="60" cy={apexY + 1} r="1" fill="#FFFFFF" opacity="0.5" />
      </svg>
      <div className="mt-1 text-center">
        <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold truncate max-w-[140px]">{label}</div>
        <div className="text-lg font-semibold font-mono-num text-[#1C252E]">{level}%</div>
        <div className="text-[10px] text-[#59687A] font-mono-num">{capacity}</div>
      </div>
    </div>
  );
};

// ===== Warehouse Utilization 3D Bar =====
export const WarehouseFill = ({ level = 74, label = "Gudang Produk Jadi", code = "WH-FG", capacity = "2.500 unit", className = "" }) => {
  const f = Math.min(100, Math.max(0, level));
  const color = f < 50 ? "#107E3E" : f < 80 ? "#0A6ED1" : f < 95 ? "#E9730C" : "#B00020";
  return (
    <div className={`bg-white border border-[#DFE3E8] rounded-md p-3 ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">{code}</div>
          <div className="text-sm font-semibold text-[#1C252E] truncate">{label}</div>
          <div className="text-[10px] text-[#59687A] font-mono-num">{capacity}</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold font-mono-num" style={{ color }}>{level}%</div>
        </div>
      </div>
      <svg viewBox="0 0 160 64" className="w-full">
        {/* Warehouse outline (isometric box) */}
        <polygon points="6,52 130,52 154,36 30,36" fill="#F4F6F8" stroke="#59687A" strokeWidth="0.8" />
        <polygon points="6,52 130,52 130,16 6,16" fill="#FAFBFC" stroke="#59687A" strokeWidth="0.8" />
        <polygon points="130,16 154,4 154,36 130,52" fill="#EEF0F2" stroke="#59687A" strokeWidth="0.8" />
        {/* Roof shading */}
        <polygon points="6,16 30,4 154,4 130,16" fill="#DFE3E8" stroke="#59687A" strokeWidth="0.8" />
        {/* Doorway */}
        <rect x="58" y="32" width="20" height="20" fill="#2A3543" />
        <line x1="68" y1="32" x2="68" y2="52" stroke="#59687A" strokeWidth="0.6" />
        {/* Pallets/boxes inside (fill level) */}
        {[0, 1, 2, 3, 4, 5].map((row) => {
          const visible = (row + 1) * (100 / 6) <= f + 5;
          if (!visible) return null;
          return (
            <g key={row}>
              <rect x={14 + row * 18} y={48 - row * 4} width="14" height="4" fill={color} opacity="0.85" />
              <rect x={14 + row * 18} y={48 - row * 4} width="14" height="1" fill={color} />
            </g>
          );
        })}
        {/* Indicator panel */}
        <rect x="138" y="42" width="14" height="8" fill="white" stroke={color} strokeWidth="0.8" />
        <circle cx="142" cy="46" r="1.4" fill={color} />
      </svg>
      <div className="mt-2 h-1 bg-[#EEF0F2] rounded-full overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${f}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

// ===== Truck Illustration =====
export const TruckIllustration = ({ status = "ready", className = "" }) => {
  // status: ready | route | done
  const statusColor =
    status === "route" ? "#E9730C" :
    status === "done" ? "#107E3E" :
    "#0A6ED1";
  return (
    <svg viewBox="0 0 180 80" className={`w-full ${className}`}>
      {/* Ground */}
      <line x1="0" y1="68" x2="180" y2="68" stroke="#DFE3E8" strokeWidth="0.6" strokeDasharray="3 3" />
      {/* Cargo box */}
      <rect x="62" y="20" width="84" height="40" fill="#FAFBFC" stroke="#59687A" strokeWidth="1.2" />
      <rect x="62" y="20" width="84" height="6" fill="#0A6ED1" />
      {/* Cargo: stacked concrete products */}
      <rect x="68" y="32" width="22" height="20" fill="#C7CCD3" stroke="#59687A" strokeWidth="0.5" />
      <rect x="68" y="36" width="22" height="2" fill="#0A6ED1" opacity="0.5" />
      <rect x="92" y="34" width="20" height="18" fill="#B5BCC4" stroke="#59687A" strokeWidth="0.5" />
      <rect x="114" y="32" width="26" height="20" fill="#C7CCD3" stroke="#59687A" strokeWidth="0.5" />
      <rect x="114" y="40" width="26" height="2" fill="#0A6ED1" opacity="0.5" />
      {/* Cab */}
      <path d="M146 32 L160 32 L168 44 L168 60 L146 60 Z" fill={statusColor} stroke="#1C252E" strokeWidth="1.2" />
      {/* Window */}
      <path d="M148 36 L158 36 L163 44 L148 44 Z" fill="#9DD8FF" stroke="#1C252E" strokeWidth="0.6" />
      {/* Headlight */}
      <rect x="166" y="50" width="3" height="3" fill="#FBC36C" />
      {/* Bumper */}
      <rect x="146" y="60" width="22" height="3" fill="#1C252E" />
      {/* Wheels */}
      <circle cx="78" cy="64" r="6" fill="#1C252E" stroke="#0A6ED1" strokeWidth="0.8" />
      <circle cx="78" cy="64" r="2" fill="#59687A" />
      <circle cx="100" cy="64" r="6" fill="#1C252E" stroke="#0A6ED1" strokeWidth="0.8" />
      <circle cx="100" cy="64" r="2" fill="#59687A" />
      <circle cx="156" cy="64" r="6" fill="#1C252E" stroke="#0A6ED1" strokeWidth="0.8" />
      <circle cx="156" cy="64" r="2" fill="#59687A" />
      {/* Motion lines (when in route) */}
      {status === "route" && (
        <g opacity="0.6">
          <line x1="14" y1="36" x2="48" y2="36" stroke={statusColor} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="6" y1="46" x2="50" y2="46" stroke={statusColor} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="18" y1="56" x2="48" y2="56" stroke={statusColor} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};

// ===== Curing Chamber Illustration =====
export const CuringChamberIllustration = ({ temp = 65, humidity = 92, units = 28, status = "Running" }) => {
  const statusColor = status === "Running" ? "#107E3E" : "#59687A";
  return (
    <svg viewBox="0 0 240 120" className="w-full">
      {/* Floor */}
      <line x1="6" y1="106" x2="234" y2="106" stroke="#DFE3E8" strokeWidth="0.8" />
      {/* Chamber walls (steel insulated) */}
      <rect x="14" y="22" width="212" height="84" fill="#F4F6F8" stroke="#59687A" strokeWidth="1.2" />
      {/* Insulation panels */}
      {[14, 60, 106, 152, 198].map((x, i) => (
        <line key={i} x1={x} y1="22" x2={x} y2="106" stroke="#9AA5B1" strokeWidth="0.6" />
      ))}
      {/* Top vents */}
      {[40, 90, 140, 190].map((x, i) => (
        <g key={i}>
          <rect x={x - 6} y="12" width="12" height="10" fill="#59687A" />
          <path d={`M${x - 6} 22 Q${x - 4} 16 ${x - 2} 22 Q${x} 16 ${x + 2} 22 Q${x + 4} 16 ${x + 6} 22`} fill="none" stroke="#E9730C" strokeWidth="1" />
        </g>
      ))}
      {/* Steam coming up from products */}
      <g opacity="0.6">
        <path d="M50 70 Q48 60 52 50 Q56 60 54 70" fill="none" stroke="#9AA5B1" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M110 68 Q108 56 114 46 Q118 56 116 68" fill="none" stroke="#9AA5B1" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M170 70 Q168 60 174 50 Q178 60 176 70" fill="none" stroke="#9AA5B1" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      {/* Products inside (concrete blocks stacked) */}
      {[30, 70, 110, 150, 190].map((x, i) => (
        <g key={i}>
          <rect x={x} y="76" width="28" height="20" fill="#C7CCD3" stroke="#59687A" strokeWidth="0.6" />
          <rect x={x} y="76" width="28" height="3" fill="#9AA5B1" />
          <rect x={x + 4} y="58" width="20" height="18" fill="#D8DCE2" stroke="#59687A" strokeWidth="0.6" />
        </g>
      ))}
      {/* Floor track */}
      <line x1="14" y1="98" x2="226" y2="98" stroke="#59687A" strokeWidth="0.8" strokeDasharray="3 2" />
      {/* Door (right side) */}
      <rect x="220" y="32" width="6" height="64" fill="#9AA5B1" stroke="#59687A" strokeWidth="0.6" />
      {/* Control panel */}
      <rect x="222" y="34" width="14" height="22" fill="#1C252E" />
      <circle cx="226" cy="40" r="1.5" fill={statusColor} />
      <text x="226" y="48" fontSize="4" fill="#9AA5B1" fontFamily="JetBrains Mono">{temp}°</text>
      <text x="226" y="54" fontSize="4" fill="#9AA5B1" fontFamily="JetBrains Mono">{humidity}%</text>
      {/* Sensor lines on side */}
      <circle cx="20" cy="38" r="2" fill="#E9730C" />
      <circle cx="20" cy="58" r="2" fill="#0070F2" />
    </svg>
  );
};

// ===== Mini Sparkline / Temp trend =====
export const MiniSparkline = ({ data = [], color = "#E9730C", height = 28, width = 96, fill = true }) => {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);
  const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <defs>
        <linearGradient id={`spark-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && (
        <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#spark-${color.replace("#","")})`} />
      )}
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      {data.length > 0 && (() => {
        const last = data.length - 1;
        const x = last * stepX;
        const y = height - ((data[last] - min) / range) * (height - 4) - 2;
        return <circle cx={x} cy={y} r="2" fill={color} />;
      })()}
    </svg>
  );
};

// ===== OEE Gauge (radial / semi-circular) =====
export const OEEGauge = ({ value = 80, label = "Line A", subLabel = "OEE", size = 140 }) => {
  const v = Math.min(100, Math.max(0, value));
  const color = v >= 85 ? "#107E3E" : v >= 65 ? "#0A6ED1" : v >= 40 ? "#E9730C" : "#B00020";
  // Semi-circle arc: from angle 180 to 360 (or -180 → 0)
  const radius = 56;
  const cx = 70;
  const cy = 76;
  const startAngle = 180;
  const endAngle = 180 + (180 * v / 100);
  const polarToCartesian = (centerX, centerY, r, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return { x: centerX + r * Math.cos(angleInRadians), y: centerY + r * Math.sin(angleInRadians) };
  };
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  const d = `M ${end.x} ${end.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${start.x} ${start.y}`;
  const bgEnd = polarToCartesian(cx, cy, radius, 360);
  const bgStart = polarToCartesian(cx, cy, radius, 180);
  const bgD = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 1 1 ${bgEnd.x} ${bgEnd.y}`;
  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg viewBox="0 0 140 90" style={{ width: size, height: size * 0.65 }}>
        {/* Background arc */}
        <path d={bgD} fill="none" stroke="#EEF0F2" strokeWidth="12" strokeLinecap="round" />
        {/* Value arc */}
        <path d={d} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((t) => {
          const a = 180 + (180 * t / 100);
          const p1 = polarToCartesian(cx, cy, radius - 12, a);
          const p2 = polarToCartesian(cx, cy, radius - 18, a);
          return <line key={t} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#59687A" strokeWidth="1" />;
        })}
        {/* Center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="26" fontWeight="700" fill="#1C252E" fontFamily="JetBrains Mono">{v}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="9" fill="#59687A" fontFamily="IBM Plex Sans" letterSpacing="1">{subLabel}</text>
      </svg>
      <div className="text-xs font-semibold text-[#1C252E] mt-1">{label}</div>
    </div>
  );
};

// ===== Dashboard Hero Banner =====
export const FactoryHero = ({ company = "PT Megacon Bangun Perkasa", plant = "Plant Surabaya", shift = "Shift 1 - Pagi" }) => {
  return (
    <div
      className="relative overflow-hidden rounded-md border border-[#DFE3E8]"
      style={{
        background: "linear-gradient(120deg, #0A2540 0%, #0854A1 45%, #0A6ED1 100%)",
        minHeight: 152,
      }}
    >
      {/* Grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
      {/* Subtle blueprint grid */}
      <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FFFFFF" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Factory silhouette right side */}
      <svg
        viewBox="0 0 600 200"
        preserveAspectRatio="xMaxYMid meet"
        className="absolute right-0 top-0 h-full opacity-[0.22]"
        style={{ width: "70%" }}
      >
        {/* Sky line of factory buildings */}
        {/* Tall silos on right */}
        <g fill="#FFFFFF" opacity="0.9">
          {/* Silo 1 */}
          <rect x="430" y="40" width="36" height="140" />
          <polygon points="430,40 466,40 448,18" />
          <rect x="436" y="76" width="2" height="100" fill="#0A2540" opacity="0.5" />
          {/* Silo 2 */}
          <rect x="476" y="56" width="28" height="124" />
          <polygon points="476,56 504,56 490,40" />
          <rect x="480" y="84" width="2" height="90" fill="#0A2540" opacity="0.5" />
          {/* Silo 3 */}
          <rect x="514" y="48" width="32" height="132" />
          <polygon points="514,48 546,48 530,28" />
          {/* Connector pipe */}
          <rect x="430" y="68" width="116" height="4" />
        </g>
        {/* Main factory shed */}
        <g fill="#FFFFFF" opacity="0.7">
          <polygon points="170,180 170,116 230,90 290,116 290,180" />
          <polygon points="290,180 290,116 350,90 410,116 410,180" />
          <polygon points="170,116 230,90 230,116" fill="#FFFFFF" opacity="0.85" />
          {/* Windows */}
          {[180, 200, 220, 240, 260, 300, 320, 340, 360, 380].map((x, i) => (
            <rect key={i} x={x} y="140" width="8" height="14" fill="#0A6ED1" opacity="0.7" />
          ))}
          {/* Doors */}
          <rect x="200" y="160" width="22" height="20" fill="#0A2540" opacity="0.6" />
          <rect x="320" y="160" width="22" height="20" fill="#0A2540" opacity="0.6" />
        </g>
        {/* Smoke stack */}
        <g fill="#FFFFFF" opacity="0.65">
          <rect x="130" y="60" width="14" height="120" />
          <rect x="126" y="58" width="22" height="6" />
        </g>
        {/* Crane */}
        <g fill="none" stroke="#FFFFFF" strokeWidth="3" opacity="0.7">
          <line x1="40" y1="180" x2="40" y2="40" />
          <line x1="40" y1="40" x2="120" y2="40" />
          <line x1="40" y1="40" x2="116" y2="60" />
          <line x1="100" y1="40" x2="100" y2="70" />
          <rect x="92" y="68" width="14" height="8" fill="#FFFFFF" stroke="none" opacity="0.8" />
        </g>
      </svg>

      <div className="relative z-10 p-5 md:p-6 flex flex-col h-full">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[#9DD8FF] font-semibold mb-2">
          Manufacturing Execution System
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-white tracking-tight" style={{ letterSpacing: "-0.01em" }}>
          {company}
        </h1>
        <div className="mt-1 flex items-center gap-3 text-xs text-[#B9DCFF]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5DCB7E] animate-pulse" />
            Live · {plant}
          </span>
          <span>•</span>
          <span>{shift}</span>
          <span>•</span>
          <span className="font-mono-num">{new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</span>
        </div>

        {/* Bottom metric strip */}
        <div className="mt-auto grid grid-cols-3 gap-3 pt-4 max-w-md">
          <div className="border-l-2 border-[#5DCB7E] pl-2">
            <div className="text-[9px] uppercase tracking-wider text-[#B9DCFF]">Line Aktif</div>
            <div className="text-base font-semibold text-white font-mono-num">3<span className="text-xs text-[#B9DCFF]">/4</span></div>
          </div>
          <div className="border-l-2 border-[#FBC36C] pl-2">
            <div className="text-[9px] uppercase tracking-wider text-[#B9DCFF]">WIP</div>
            <div className="text-base font-semibold text-white font-mono-num">312</div>
          </div>
          <div className="border-l-2 border-[#9DD8FF] pl-2">
            <div className="text-[9px] uppercase tracking-wider text-[#B9DCFF]">Hari Ke</div>
            <div className="text-base font-semibold text-white font-mono-num">14<span className="text-xs text-[#B9DCFF]">/28</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== Production line visual (compact card illustration) =====
export const ProductionLineIllustration = ({ status = "Aktif", utilisasi = 70 }) => {
  const isActive = status === "Aktif" || status === "Running";
  const color = isActive ? "#0A6ED1" : "#E9730C";
  return (
    <svg viewBox="0 0 200 60" className="w-full">
      {/* Floor */}
      <line x1="4" y1="48" x2="196" y2="48" stroke="#DFE3E8" strokeWidth="0.6" strokeDasharray="2 2" />
      {/* Conveyor belt */}
      <rect x="8" y="38" width="184" height="6" fill="#9AA5B1" stroke="#59687A" strokeWidth="0.6" />
      {/* Rollers */}
      {[14, 30, 46, 62, 78, 94, 110, 126, 142, 158, 174, 188].map((x, i) => (
        <circle key={i} cx={x} cy="44" r="2.5" fill="#1C252E" stroke="#59687A" strokeWidth="0.5" />
      ))}
      {/* Mixer / batching */}
      <rect x="12" y="14" width="22" height="22" fill={color} opacity="0.85" />
      <polygon points="12,14 34,14 26,6 20,6" fill={color} />
      <rect x="20" y="20" width="6" height="10" fill="#FFFFFF" opacity="0.6" />
      {/* Cast products on belt */}
      {[42, 70, 100, 130, 158].map((x, i) => (
        <g key={i}>
          <rect x={x} y="28" width="20" height="12" fill="#C7CCD3" stroke="#59687A" strokeWidth="0.5" />
          <rect x={x} y="28" width="20" height="2" fill={color} opacity="0.5" />
        </g>
      ))}
      {/* Crane/gantry */}
      <line x1="44" y1="14" x2="180" y2="14" stroke="#59687A" strokeWidth="1.5" />
      <line x1="44" y1="6" x2="44" y2="14" stroke="#59687A" strokeWidth="1.5" />
      <line x1="180" y1="6" x2="180" y2="14" stroke="#59687A" strokeWidth="1.5" />
      <rect x="100" y="14" width="14" height="10" fill={color} />
      <line x1="107" y1="24" x2="107" y2="30" stroke="#1C252E" strokeWidth="1" />
      {/* Status light */}
      <circle cx="190" cy="10" r="3" fill={color}>
        {isActive && <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />}
      </circle>
    </svg>
  );
};
