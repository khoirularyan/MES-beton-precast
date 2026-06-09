// Industrial SVG product thumbnails for Precast Concrete products.
// Keys: rcpipe, nrpipe, jackingpipe, uditch, coverudt, boxculvert, barrier, sumurresapan

const palette = {
  concreteLight: "#E5E8EC",
  concreteMid: "#C7CCD3",
  concreteDark: "#9AA5B1",
  rebar: "#0A6ED1",
  rebarShadow: "#0854A1",
  edge: "#59687A",
  stroke: "#1C252E",
  highlight: "#FFFFFF",
};

// Map a product name/code to a visual key
export const getProductKey = (input = "") => {
  const s = String(input).toLowerCase();
  if (s.includes("jacking")) return "jackingpipe";
  if (s.includes("non bertulang") || s.includes("nr-") || /\bnrp\b/i.test(s)) return "nrpipe";
  if (s.includes("pipa")) return "rcpipe";
  if (s.includes("cover")) return "coverudt";
  if (s.includes("u-ditch") || s.includes("uditch") || /\budt\b/i.test(s)) return "uditch";
  if (s.includes("box culvert") || /\bbc-?\d/i.test(s)) return "boxculvert";
  if (s.includes("barrier")) return "barrier";
  if (s.includes("sumur")) return "sumurresapan";
  return "uditch";
};

// Soft tonal mapping by category for chip background
export const getCategoryTone = (key) => {
  switch (key) {
    case "rcpipe": return { bg: "#E5F0FA", accent: "#0A6ED1" };
    case "nrpipe": return { bg: "#EEF0F2", accent: "#59687A" };
    case "jackingpipe": return { bg: "#FDF3E7", accent: "#E9730C" };
    case "uditch": return { bg: "#E5F0FA", accent: "#0070F2" };
    case "coverudt": return { bg: "#F4F6F8", accent: "#455468" };
    case "boxculvert": return { bg: "#E6F5EC", accent: "#107E3E" };
    case "barrier": return { bg: "#FBE6E9", accent: "#B00020" };
    case "sumurresapan": return { bg: "#E5F0FA", accent: "#0854A1" };
    default: return { bg: "#F4F6F8", accent: "#59687A" };
  }
};

const RCPipe = () => (
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <defs>
      <linearGradient id="rcp-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={palette.concreteLight} />
        <stop offset="50%" stopColor={palette.concreteMid} />
        <stop offset="100%" stopColor={palette.concreteDark} />
      </linearGradient>
      <radialGradient id="rcp-hole" cx="0.35" cy="0.5" r="0.7">
        <stop offset="0%" stopColor="#1C252E" />
        <stop offset="100%" stopColor="#455468" />
      </radialGradient>
    </defs>
    {/* Pipe body */}
    <rect x="14" y="18" width="92" height="44" rx="2" fill="url(#rcp-body)" stroke={palette.edge} strokeWidth="1" />
    {/* Top edge */}
    <line x1="14" y1="22" x2="106" y2="22" stroke={palette.highlight} strokeWidth="1.2" opacity="0.55" />
    {/* Left end face (ring) */}
    <ellipse cx="22" cy="40" rx="8" ry="22" fill={palette.concreteMid} stroke={palette.edge} strokeWidth="1" />
    <ellipse cx="22" cy="40" rx="4.5" ry="14" fill="url(#rcp-hole)" />
    {/* Right end face hint */}
    <path d="M106 18 Q112 40 106 62" fill="none" stroke={palette.edge} strokeWidth="1" />
    {/* Rebar dots showing reinforcement */}
    {[28, 36, 44, 52].map((y, i) => (
      <circle key={i} cx="22" cy={y} r="1.2" fill={palette.rebar} />
    ))}
    {/* Surface ribbing */}
    {[40, 55, 70, 85].map((x, i) => (
      <line key={i} x1={x} y1="20" x2={x} y2="60" stroke={palette.edge} strokeWidth="0.4" opacity="0.4" />
    ))}
  </svg>
);

const NRPipe = () => (
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <defs>
      <linearGradient id="nrp-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={palette.concreteLight} />
        <stop offset="100%" stopColor={palette.concreteDark} />
      </linearGradient>
    </defs>
    <rect x="18" y="24" width="84" height="32" rx="2" fill="url(#nrp-body)" stroke={palette.edge} strokeWidth="1" />
    <ellipse cx="26" cy="40" rx="6" ry="16" fill={palette.concreteMid} stroke={palette.edge} strokeWidth="1" />
    <ellipse cx="26" cy="40" rx="3" ry="10" fill="#2A3543" />
    <path d="M102 24 Q108 40 102 56" fill="none" stroke={palette.edge} strokeWidth="1" />
    {[42, 56, 70, 84].map((x, i) => (
      <line key={i} x1={x} y1="26" x2={x} y2="54" stroke={palette.edge} strokeWidth="0.4" opacity="0.35" />
    ))}
  </svg>
);

const JackingPipe = () => (
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <defs>
      <linearGradient id="jck-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#D8DCE2" />
        <stop offset="100%" stopColor="#8E97A2" />
      </linearGradient>
    </defs>
    {/* Heavy reinforced pipe with end flange */}
    <rect x="10" y="14" width="96" height="52" rx="3" fill="url(#jck-body)" stroke={palette.edge} strokeWidth="1.2" />
    {/* End flange (jacking joint) */}
    <rect x="10" y="10" width="10" height="60" fill="#E9730C" opacity="0.85" />
    <rect x="100" y="10" width="6" height="60" fill="#9C4F00" opacity="0.85" />
    {/* Center bore */}
    <ellipse cx="20" cy="40" rx="6" ry="20" fill={palette.concreteMid} stroke={palette.edge} strokeWidth="1" />
    <ellipse cx="20" cy="40" rx="3.5" ry="13" fill="#1C252E" />
    {/* Rebar rings */}
    {[26, 34, 42, 50, 58].map((y, i) => (
      <circle key={i} cx="20" cy={y} r="1.3" fill={palette.rebar} />
    ))}
    {/* Surface texture */}
    {[35, 50, 65, 80, 95].map((x, i) => (
      <line key={i} x1={x} y1="16" x2={x} y2="64" stroke={palette.edge} strokeWidth="0.4" opacity="0.35" />
    ))}
  </svg>
);

const UDitch = () => (
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <defs>
      <linearGradient id="udt-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={palette.concreteLight} />
        <stop offset="100%" stopColor={palette.concreteDark} />
      </linearGradient>
    </defs>
    {/* U-shape cross-section visible at front, perspective body */}
    <polygon points="14,18 106,18 100,28 20,28" fill={palette.concreteLight} stroke={palette.edge} strokeWidth="1" />
    {/* Outer walls */}
    <polygon points="14,18 14,62 20,68 20,28" fill="url(#udt-body)" stroke={palette.edge} strokeWidth="1" />
    <polygon points="106,18 106,62 100,68 100,28" fill={palette.concreteMid} stroke={palette.edge} strokeWidth="1" />
    {/* Base (inner) */}
    <polygon points="20,68 100,68 100,62 20,62" fill={palette.concreteDark} stroke={palette.edge} strokeWidth="1" />
    {/* U inner cavity */}
    <polygon points="26,28 94,28 94,58 26,58" fill="#2A3543" opacity="0.85" />
    <polygon points="26,28 30,32 90,32 94,28" fill="#3A4654" opacity="0.6" />
    {/* Highlight */}
    <line x1="14" y1="22" x2="106" y2="22" stroke={palette.highlight} strokeWidth="1" opacity="0.5" />
  </svg>
);

const CoverUDitch = () => (
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <defs>
      <linearGradient id="cvr-top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#EBEEF2" />
        <stop offset="100%" stopColor={palette.concreteMid} />
      </linearGradient>
    </defs>
    {/* Flat slab with perspective */}
    <polygon points="12,28 108,28 102,38 18,38" fill="url(#cvr-top)" stroke={palette.edge} strokeWidth="1" />
    <polygon points="18,38 102,38 102,52 18,52" fill={palette.concreteMid} stroke={palette.edge} strokeWidth="1" />
    <polygon points="18,52 102,52 96,62 24,62" fill={palette.concreteDark} stroke={palette.edge} strokeWidth="1" />
    {/* Lifting hooks (rebar loops) */}
    <path d="M40 28 Q42 22 48 22 Q54 22 56 28" fill="none" stroke={palette.rebar} strokeWidth="1.6" />
    <path d="M70 28 Q72 22 78 22 Q84 22 86 28" fill="none" stroke={palette.rebar} strokeWidth="1.6" />
    {/* Surface ridge */}
    <line x1="12" y1="32" x2="108" y2="32" stroke={palette.highlight} strokeWidth="0.8" opacity="0.5" />
  </svg>
);

const BoxCulvert = () => (
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <defs>
      <linearGradient id="bc-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={palette.concreteLight} />
        <stop offset="100%" stopColor={palette.concreteDark} />
      </linearGradient>
    </defs>
    {/* Front face */}
    <rect x="14" y="14" width="68" height="52" fill="url(#bc-body)" stroke={palette.edge} strokeWidth="1" />
    {/* Inner hollow */}
    <rect x="22" y="22" width="52" height="36" fill="#1C252E" />
    <rect x="22" y="22" width="52" height="36" fill="none" stroke="#3A4654" strokeWidth="1" />
    {/* Right perspective body */}
    <polygon points="82,14 106,8 106,60 82,66" fill={palette.concreteMid} stroke={palette.edge} strokeWidth="1" />
    <polygon points="82,14 106,8 106,16 82,22" fill={palette.concreteLight} stroke={palette.edge} strokeWidth="0.6" />
    {/* Inner perspective */}
    <polygon points="74,22 96,16 96,52 74,58" fill="#2A3543" opacity="0.6" />
    {/* Highlight */}
    <line x1="14" y1="18" x2="82" y2="18" stroke={palette.highlight} strokeWidth="0.8" opacity="0.55" />
  </svg>
);

const Barrier = () => (
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <defs>
      <linearGradient id="bar-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#EDEFF2" />
        <stop offset="100%" stopColor={palette.concreteDark} />
      </linearGradient>
    </defs>
    {/* New Jersey shape - trapezoidal with slope */}
    <polygon points="20,68 100,68 92,32 84,20 36,20 28,32" fill="url(#bar-body)" stroke={palette.edge} strokeWidth="1.2" />
    {/* Side face for depth */}
    <polygon points="100,68 110,62 102,26 96,16 84,20 92,32" fill={palette.concreteMid} stroke={palette.edge} strokeWidth="1" />
    <polygon points="84,20 96,16 102,26" fill={palette.concreteLight} stroke={palette.edge} strokeWidth="0.6" />
    {/* Reflective stripe */}
    <rect x="28" y="36" width="64" height="4" fill="#E9730C" />
    <rect x="28" y="36" width="64" height="1" fill="#FBC36C" />
    {/* Crash slope highlight */}
    <line x1="36" y1="22" x2="84" y2="22" stroke={palette.highlight} strokeWidth="0.8" opacity="0.6" />
  </svg>
);

const SumurResapan = () => (
  <svg viewBox="0 0 120 80" className="w-full h-full">
    <defs>
      <linearGradient id="sr-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={palette.concreteLight} />
        <stop offset="100%" stopColor={palette.concreteDark} />
      </linearGradient>
      <radialGradient id="sr-hole" cx="0.5" cy="0.4" r="0.6">
        <stop offset="0%" stopColor="#1C252E" />
        <stop offset="100%" stopColor="#455468" />
      </radialGradient>
    </defs>
    {/* Cylindrical well, top view perspective */}
    <ellipse cx="60" cy="22" rx="42" ry="10" fill={palette.concreteLight} stroke={palette.edge} strokeWidth="1" />
    <ellipse cx="60" cy="22" rx="34" ry="7" fill="url(#sr-hole)" />
    {/* Body sides */}
    <path d="M18 22 L18 60 Q60 70 102 60 L102 22" fill="url(#sr-body)" stroke={palette.edge} strokeWidth="1" />
    <ellipse cx="60" cy="60" rx="42" ry="8" fill={palette.concreteDark} stroke={palette.edge} strokeWidth="1" />
    {/* Drainage perforations */}
    {[
      [30, 35], [44, 38], [60, 40], [76, 38], [90, 35],
      [28, 48], [42, 51], [60, 52], [78, 51], [92, 48],
    ].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r="1.4" fill="#1C252E" opacity="0.7" />
    ))}
  </svg>
);

const COMPONENTS = {
  rcpipe: RCPipe,
  nrpipe: NRPipe,
  jackingpipe: JackingPipe,
  uditch: UDitch,
  coverudt: CoverUDitch,
  boxculvert: BoxCulvert,
  barrier: Barrier,
  sumurresapan: SumurResapan,
};

/**
 * <ProductIcon name="U-Ditch 500" size="md" />
 * Sizes: xs (32px), sm (48px), md (72px), lg (120px)
 */
export const ProductIcon = ({ name, productKey, size = "md", className = "" }) => {
  const key = productKey || getProductKey(name);
  const Comp = COMPONENTS[key] || UDitch;
  const tone = getCategoryTone(key);
  const sizeMap = {
    xs: "w-8 h-8",
    sm: "w-12 h-9",
    md: "w-[72px] h-12",
    lg: "w-32 h-20",
  };
  return (
    <div
      className={`flex items-center justify-center rounded-md ${sizeMap[size] || sizeMap.md} ${className}`}
      style={{ backgroundColor: tone.bg, border: `1px solid ${tone.accent}22` }}
      aria-label={name || key}
    >
      <Comp />
    </div>
  );
};

export default ProductIcon;
