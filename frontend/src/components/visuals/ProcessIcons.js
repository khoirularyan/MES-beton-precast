// Industrial process & defect SVG icons + visualizations.

// ===== PROCESS ICONS (Casting, Curing, Demoulding, QC) =====

const ProcessCasting = ({ color = "#0A6ED1" }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    {/* Concrete mixer pouring */}
    <path d="M14 12 L26 12 L30 22 L18 22 Z" fill={color} opacity="0.85" />
    <rect x="14" y="22" width="16" height="3" fill={color} />
    {/* Concrete stream */}
    <path d="M22 25 Q23 30 24 36 Q22 42 20 50" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
    <circle cx="20" cy="50" r="2" fill={color} />
    {/* Form/mold */}
    <path d="M30 44 L54 44 L54 56 L30 56 Z" fill="none" stroke={color} strokeWidth="2" />
    <path d="M30 50 L54 50" stroke={color} strokeWidth="1" opacity="0.5" />
    {/* Hatch */}
    {[34, 40, 46, 52].map((x, i) => (
      <line key={i} x1={x} y1="44" x2={x - 4} y2="56" stroke={color} strokeWidth="0.5" opacity="0.4" />
    ))}
  </svg>
);

const ProcessCuring = ({ color = "#E9730C" }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    {/* Steam chamber */}
    <rect x="10" y="22" width="44" height="32" rx="2" fill="none" stroke={color} strokeWidth="2" />
    <rect x="10" y="22" width="44" height="6" fill={color} opacity="0.15" />
    {/* Steam */}
    <path d="M18 18 Q16 12 20 8 Q24 12 22 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M30 18 Q28 10 32 6 Q36 10 34 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M42 18 Q40 12 44 8 Q48 12 46 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    {/* Thermometer */}
    <line x1="32" y1="32" x2="32" y2="46" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="48" r="3.5" fill={color} />
    <line x1="28" y1="36" x2="30" y2="36" stroke={color} strokeWidth="1" />
    <line x1="28" y1="42" x2="30" y2="42" stroke={color} strokeWidth="1" />
  </svg>
);

const ProcessDemoulding = ({ color = "#0070F2" }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    {/* Mold opening */}
    <path d="M8 50 L20 22 L28 22 L24 50 Z" fill={color} opacity="0.25" stroke={color} strokeWidth="1.5" />
    <path d="M56 50 L44 22 L36 22 L40 50 Z" fill={color} opacity="0.25" stroke={color} strokeWidth="1.5" />
    {/* Product (rising up) */}
    <rect x="24" y="14" width="16" height="28" rx="1" fill={color} opacity="0.9" />
    <rect x="24" y="14" width="16" height="4" fill={color} />
    {/* Lifting hook */}
    <line x1="32" y1="14" x2="32" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="4" r="2.5" fill="none" stroke={color} strokeWidth="2" />
    {/* Arrows */}
    <path d="M14 30 L10 26 M14 30 L10 34" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M50 30 L54 26 M50 30 L54 34" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

const ProcessQC = ({ color = "#107E3E" }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    {/* Clipboard */}
    <rect x="14" y="14" width="32" height="40" rx="2" fill="none" stroke={color} strokeWidth="2" />
    <rect x="22" y="10" width="16" height="8" rx="1" fill={color} opacity="0.85" />
    {/* Checkmarks */}
    <path d="M19 28 L22 31 L28 25" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="32" y1="28" x2="42" y2="28" stroke={color} strokeWidth="1.5" />
    <path d="M19 38 L22 41 L28 35" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="32" y1="38" x2="42" y2="38" stroke={color} strokeWidth="1.5" />
    <path d="M19 48 L22 51 L28 45" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="32" y1="48" x2="42" y2="48" stroke={color} strokeWidth="1.5" />
    {/* Magnifier */}
    <circle cx="52" cy="48" r="6" fill="white" stroke={color} strokeWidth="2" />
    <line x1="56" y1="52" x2="60" y2="56" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PROCESS = {
  casting: ProcessCasting,
  curing: ProcessCuring,
  demoulding: ProcessDemoulding,
  qc: ProcessQC,
};

export const ProcessIcon = ({ stage, color, size = "md" }) => {
  const Comp = PROCESS[stage] || ProcessCasting;
  const sizeMap = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-16 h-16" };
  return (
    <div className={`${sizeMap[size] || sizeMap.md}`}>
      <Comp color={color} />
    </div>
  );
};

// ===== DEFECT ICONS =====
const DefHoneycomb = () => (
  <svg viewBox="0 0 100 80" className="w-full h-full">
    <rect width="100" height="80" fill="#D8DCE2" />
    {/* Honeycomb voids (irregular holes) */}
    {[
      [22, 18, 4], [38, 24, 6], [58, 20, 5], [72, 30, 7],
      [28, 42, 5], [48, 48, 8], [68, 52, 6], [82, 46, 4],
      [18, 60, 6], [40, 64, 4], [62, 66, 5], [82, 64, 5],
    ].map(([cx, cy, r], i) => (
      <g key={i}>
        <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.85} fill="#2A3543" />
        <ellipse cx={cx - 0.5} cy={cy - 0.5} rx={r * 0.6} ry={r * 0.5} fill="#1C252E" />
      </g>
    ))}
    {/* Texture cracks */}
    <path d="M10 30 L30 28 L44 35" fill="none" stroke="#59687A" strokeWidth="0.6" opacity="0.5" />
    <path d="M60 12 L74 18 L86 22" fill="none" stroke="#59687A" strokeWidth="0.6" opacity="0.5" />
  </svg>
);

const DefCrack = () => (
  <svg viewBox="0 0 100 80" className="w-full h-full">
    <rect width="100" height="80" fill="#D8DCE2" />
    {/* Main crack */}
    <path d="M10 14 L24 24 L32 22 L48 38 L58 36 L72 52 L82 56 L92 70"
      fill="none" stroke="#1C252E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Crack shadow */}
    <path d="M10 14 L24 24 L32 22 L48 38 L58 36 L72 52 L82 56 L92 70"
      fill="none" stroke="#B00020" strokeWidth="0.6" strokeLinecap="round" />
    {/* Branches */}
    <path d="M32 22 L40 14" fill="none" stroke="#1C252E" strokeWidth="1" strokeLinecap="round" />
    <path d="M58 36 L66 26" fill="none" stroke="#1C252E" strokeWidth="1" strokeLinecap="round" />
    <path d="M72 52 L80 44" fill="none" stroke="#1C252E" strokeWidth="1" strokeLinecap="round" />
    {/* Surface noise */}
    {[15, 30, 45, 60, 75].map((x, i) => (
      <circle key={i} cx={x} cy={i * 12 + 8} r="0.5" fill="#59687A" opacity="0.5" />
    ))}
  </svg>
);

const DefSurface = () => (
  <svg viewBox="0 0 100 80" className="w-full h-full">
    <rect width="100" height="80" fill="#D8DCE2" />
    {/* Patches of surface irregularity */}
    <path d="M14 16 Q22 12 28 18 Q32 26 24 30 Q14 28 14 16Z" fill="#9AA5B1" stroke="#59687A" strokeWidth="0.4" />
    <path d="M44 28 Q56 24 62 32 Q66 42 56 46 Q44 44 44 28Z" fill="#A4ADB5" stroke="#59687A" strokeWidth="0.4" />
    <path d="M70 12 Q82 10 86 18 Q84 26 76 26 Q68 22 70 12Z" fill="#9AA5B1" stroke="#59687A" strokeWidth="0.4" />
    <path d="M22 52 Q34 50 38 58 Q34 66 24 66 Q18 60 22 52Z" fill="#A4ADB5" stroke="#59687A" strokeWidth="0.4" />
    <path d="M62 56 Q76 54 84 62 Q82 72 70 72 Q60 66 62 56Z" fill="#9AA5B1" stroke="#59687A" strokeWidth="0.4" />
    {/* Pinholes */}
    {[[34, 38], [50, 16], [78, 38], [40, 70], [12, 38], [88, 50]].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r="1.2" fill="#1C252E" opacity="0.7" />
    ))}
  </svg>
);

const DefRebar = () => (
  <svg viewBox="0 0 100 80" className="w-full h-full">
    <rect width="100" height="80" fill="#D8DCE2" />
    {/* Concrete spalled section */}
    <path d="M18 28 Q14 38 22 48 Q34 56 50 52 Q62 50 70 42 Q72 34 60 28 Q44 24 28 26 Z"
      fill="#9AA5B1" stroke="#59687A" strokeWidth="0.6" />
    {/* Exposed rebar (vertical and horizontal) */}
    <line x1="30" y1="20" x2="34" y2="64" stroke="#9C4F00" strokeWidth="3" strokeLinecap="round" />
    <line x1="46" y1="20" x2="50" y2="64" stroke="#9C4F00" strokeWidth="3" strokeLinecap="round" />
    <line x1="62" y1="20" x2="66" y2="64" stroke="#9C4F00" strokeWidth="3" strokeLinecap="round" />
    {/* Rust highlights */}
    <line x1="30" y1="20" x2="34" y2="64" stroke="#E9730C" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
    <line x1="46" y1="20" x2="50" y2="64" stroke="#E9730C" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
    <line x1="62" y1="20" x2="66" y2="64" stroke="#E9730C" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
    {/* Tie wires */}
    <line x1="26" y1="38" x2="70" y2="40" stroke="#9C4F00" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DEFECTS = {
  honeycomb: { Comp: DefHoneycomb, label: "Honeycomb" },
  retak: { Comp: DefCrack, label: "Retak Struktural" },
  permukaan: { Comp: DefSurface, label: "Cacat Permukaan" },
  tulangan: { Comp: DefRebar, label: "Tulangan Terekspos" },
};

export const DefectIcon = ({ type, className = "" }) => {
  const def = DEFECTS[type] || DEFECTS.honeycomb;
  const { Comp } = def;
  return (
    <div className={`overflow-hidden rounded ${className}`} style={{ border: "1px solid #DFE3E8" }}>
      <Comp />
    </div>
  );
};

export const defectList = [
  { key: "honeycomb", label: "Honeycomb", description: "Rongga akibat pemadatan kurang sempurna" },
  { key: "retak", label: "Retak Struktural", description: "Retak akibat susut atau beban prematur" },
  { key: "permukaan", label: "Cacat Permukaan", description: "Pinhole, blistering, atau bekas form-tie" },
  { key: "tulangan", label: "Tulangan Terekspos", description: "Cover beton kurang, rebar tampak ke luar" },
];

// Map reject reason string → defect key
export const reasonToDefectKey = (reason = "") => {
  const s = reason.toLowerCase();
  if (s.includes("honeycomb")) return "honeycomb";
  if (s.includes("retak")) return "retak";
  if (s.includes("permukaan") || s.includes("dimensi")) return "permukaan";
  if (s.includes("tulangan") || s.includes("rebar")) return "tulangan";
  return "honeycomb";
};

// ===== Pass / Reject stamps =====
export const QualityStamp = ({ type = "pass", className = "" }) => {
  const isPass = type === "pass";
  const color = isPass ? "#107E3E" : "#B00020";
  const label = isPass ? "LULUS" : "REJECT";
  return (
    <div
      className={`inline-flex items-center justify-center rounded ${className}`}
      style={{
        border: `2px solid ${color}`,
        color,
        padding: "2px 10px",
        transform: "rotate(-7deg)",
        fontFamily: "IBM Plex Sans, sans-serif",
        fontWeight: 700,
        letterSpacing: "0.15em",
        fontSize: "11px",
        backgroundColor: `${color}10`,
        boxShadow: `inset 0 0 0 1px ${color}40`,
      }}
    >
      {label}
    </div>
  );
};

export default ProcessIcon;
