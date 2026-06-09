export const StatusBadge = ({ status, variant }) => {
  const map = {
    // Production statuses
    "Direncanakan":      { bg: "#F4F6F8", text: "#455468", dot: "#59687A" },
    "Casting":           { bg: "#E5F0FA", text: "#0A6ED1", dot: "#0A6ED1" },
    "Curing":            { bg: "#FDF3E7", text: "#9C4F00", dot: "#E9730C" },
    "Demoulding":        { bg: "#E5F0FA", text: "#0854A1", dot: "#0070F2" },
    "QC":                { bg: "#FDF3E7", text: "#9C4F00", dot: "#E9730C" },
    "Selesai":           { bg: "#E6F5EC", text: "#0A5A2E", dot: "#107E3E" },
    "Aktif":             { bg: "#E6F5EC", text: "#0A5A2E", dot: "#107E3E" },
    "Maintenance":       { bg: "#FDF3E7", text: "#9C4F00", dot: "#E9730C" },
    "Berlangsung":       { bg: "#FDF3E7", text: "#9C4F00", dot: "#E9730C" },
    // QC
    "Lulus":             { bg: "#E6F5EC", text: "#0A5A2E", dot: "#107E3E" },
    "Lulus Bersyarat":   { bg: "#FDF3E7", text: "#9C4F00", dot: "#E9730C" },
    "Reject":            { bg: "#FBE6E9", text: "#7A0014", dot: "#B00020" },
    "Sesuai":            { bg: "#E5F0FA", text: "#0854A1", dot: "#0070F2" },
    "Gagal":             { bg: "#FBE6E9", text: "#7A0014", dot: "#B00020" },
    // SO
    "Konfirmasi":        { bg: "#E5F0FA", text: "#0854A1", dot: "#0070F2" },
    "Produksi":          { bg: "#FDF3E7", text: "#9C4F00", dot: "#E9730C" },
    "Siap Kirim":        { bg: "#E5F0FA", text: "#0854A1", dot: "#0070F2" },
    "Siap Berangkat":    { bg: "#E5F0FA", text: "#0854A1", dot: "#0070F2" },
    "Dalam Perjalanan":  { bg: "#FDF3E7", text: "#9C4F00", dot: "#E9730C" },
    "Pengiriman":        { bg: "#FDF3E7", text: "#9C4F00", dot: "#E9730C" },
    "Diterima":          { bg: "#E6F5EC", text: "#0A5A2E", dot: "#107E3E" },
    // Priority
    "Tinggi":            { bg: "#FBE6E9", text: "#7A0014", dot: "#B00020" },
    "Sedang":            { bg: "#FDF3E7", text: "#9C4F00", dot: "#E9730C" },
    "Rendah":            { bg: "#F4F6F8", text: "#455468", dot: "#59687A" },
    // Material/Activity
    "success": { bg: "#E6F5EC", text: "#0A5A2E", dot: "#107E3E" },
    "warning": { bg: "#FDF3E7", text: "#9C4F00", dot: "#E9730C" },
    "error":   { bg: "#FBE6E9", text: "#7A0014", dot: "#B00020" },
    "info":    { bg: "#E5F0FA", text: "#0854A1", dot: "#0070F2" },
    // Condition
    "Baik":              { bg: "#E6F5EC", text: "#0A5A2E", dot: "#107E3E" },
    "Perlu Perawatan":   { bg: "#FBE6E9", text: "#7A0014", dot: "#B00020" },
    // Running etc.
    "Running":           { bg: "#E6F5EC", text: "#0A5A2E", dot: "#107E3E" },
    "Masuk":             { bg: "#E6F5EC", text: "#0A5A2E", dot: "#107E3E" },
    "Keluar":            { bg: "#FBE6E9", text: "#7A0014", dot: "#B00020" },
    "Pindah":            { bg: "#E5F0FA", text: "#0854A1", dot: "#0070F2" },
  };

  const key = variant || status;
  const s = map[key] || { bg: "#F4F6F8", text: "#455468", dot: "#59687A" };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {status}
    </span>
  );
};

export default StatusBadge;
