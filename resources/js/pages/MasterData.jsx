import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search, Download, LayoutGrid, Table as TableIcon, Loader2, Pencil, Trash2 } from "lucide-react";
import FormDialog from "@/components/shared/FormDialog";
import DetailDialog from "@/components/shared/DetailDialog";
import FilterPopover, { showExportToast } from "@/components/shared/FilterPopover";
import { toast } from "sonner";
import ProductIcon from "@/components/visuals/ProductIcon";
import {
  productApi, materialApi,
  supplierApi, customerApi,
  productCategoryApi, productTypeApi, productSpecApi, concreteGradeApi,
  materialCategoryApi, moldApi, warehouseApi,
  shiftApi, qcParameterApi, defectCategoryApi,
  batchStatusApi, userApi,
} from "@/lib/api";
import { formatRupiah, formatNumber } from "@/data/mockData";

// ─── Generic Section Component ──────────────────────────────────────────────
const Section = ({ children, columns, data, testId, entityName, addFields, filterSelects, headerExtra, onSubmit, onUpdate, onDelete, loading }) => {
  const [query, setQuery] = useState("");
  const [editingItem, setEditingItem] = useState(null);

  const filtered = data.filter((row) => {
    if (!query) return true;
    return Object.values(row).some((v) => String(v).toLowerCase().includes(query.toLowerCase()));
  });

  const columnsWithActions = onUpdate || onDelete ? [
    ...columns,
    {
      key: "actions",
      label: "Aksi",
      cls: "text-center w-20",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          {onUpdate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-[#0A6ED1] hover:text-[#0854A1] hover:bg-[#F0F7FF]"
              onClick={() => setEditingItem(row)}
              data-testid={`${testId}-edit-${row.id}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-[#B00020] hover:text-[#8B0016] hover:bg-[#FFF0F1]"
              onClick={() => onDelete(row.id, row.nama || row.name || row.status || row.parameter || row.grade || row.nik)}
              data-testid={`${testId}-delete-${row.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ] : columns;

  if (loading) {
    return (
      <div className="bg-white border border-[#DFE3E8] rounded-md p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#0A6ED1] mr-2" />
        <span className="text-[#59687A]">Memuat data {entityName}...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden" data-testid={testId}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#DFE3E8]">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#59687A]" />
            <Input
              placeholder="Cari..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-8 text-xs bg-[#F4F6F8] border-[#DFE3E8]"
              data-testid={`${testId}-search`}
            />
          </div>
          {headerExtra}
        </div>
        <div className="flex gap-2">
          <FilterPopover testId={`${testId}-filter`} selects={filterSelects || []} />
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => showExportToast(entityName)} data-testid={`${testId}-export`}>
            <Download className="w-3.5 h-3.5" />Ekspor
          </Button>
          <FormDialog
            testId={`${testId}-create`}
            title={`Tambah ${entityName}`}
            description={`Tambah data ${entityName} baru ke master data`}
            submitLabel="Simpan"
            successMessage={`${entityName} berhasil ditambahkan`}
            fields={addFields}
            onSubmit={onSubmit}
            trigger={
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1]" data-testid={`${testId}-add`}>
                <Plus className="w-3.5 h-3.5" />Tambah
              </Button>
            }
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full mes-table">
          <thead>
            <tr>{columnsWithActions.map((c) => <th key={c.key} className={`px-4 py-2 text-left ${c.cls || ""}`}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.id || i} data-testid={`row-${testId}-${i}`}>
                {columnsWithActions.map((c) => (
                  <td key={c.key} className={`px-4 ${c.cls || ""}`}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={columnsWithActions.length} className="px-4 py-6 text-center text-xs text-[#59687A]">Tidak ada data yang cocok</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      {editingItem && onUpdate && (
        <FormDialog
          testId={`${testId}-edit`}
          title={`Edit ${entityName}`}
          description={`Perbarui informasi ${entityName}`}
          submitLabel="Update"
          successMessage={`${entityName} berhasil diperbarui`}
          fields={addFields.map(f => ({ ...f, defaultValue: editingItem[f.name] }))}
          initialValues={{
            ...editingItem,
            materials: Array.isArray(editingItem.materials) && editingItem.materials.length > 0 && typeof editingItem.materials[0] === 'object'
              ? editingItem.materials.map(m => m.id)
              : editingItem.materials
          }}
          onSubmit={async (data) => {
            await onUpdate(editingItem.id, data);
            setEditingItem(null);
          }}
          open={true}
          onOpenChange={(open) => !open && setEditingItem(null)}
        />
      )}
    </div>
  );
};

// ─── Product Grid Card ───────────────────────────────────────────────────────
const ProductGridCard = ({ p, i }) => (
  <DetailDialog
    testId={`product-detail-${i}`}
    title={p.nama}
    subtitle={`${p.kode} • ${p.spek}`}
    status={p.grade}
    sections={[
      { title: "Informasi Produk", items: [
        { label: "Foto", value: p.foto, render: (v) => v ? <img src={v} alt="Foto Produk" className="w-24 h-24 object-cover rounded border border-[#DFE3E8] bg-white" /> : "-" },
        { label: "Kode Produk", value: p.kode },
        { label: "Nama Produk", value: p.nama },
        { label: "Kategori", value: p.kategori },
        { label: "Varian", value: p.varian },
        { label: "Spesifikasi", value: p.spek },
        { label: "Mutu Beton", value: p.grade, render: (v) => <StatusBadge status={v} variant="info" /> },
      ]},
      { title: "Spesifikasi Teknis", items: [
        { label: "Berat per Unit", value: `${formatNumber(p.berat)} kg` },
        { label: "Harga Satuan", value: formatRupiah(p.harga) },
        { label: "Standar", value: "SNI 7833:2012" },
        { label: "Toleransi", value: "± 5 mm" },
      ]},
    ]}
    trigger={
      <div
        data-testid={`product-card-${i}`}
        className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden hover:border-[#0A6ED1] hover:shadow-sm transition-all cursor-pointer group"
      >
        <div className="aspect-[16/10] bg-gradient-to-br from-[#F8FAFC] to-[#EEF0F2] p-4 flex items-center justify-center relative">
          <div className="w-full h-full max-h-[120px] flex items-center justify-center">
            {p.foto ? (
              <img src={p.foto} alt={p.nama} className="max-h-full max-w-full object-contain rounded" />
            ) : (
              <ProductIcon name={p.nama} size="lg" className="w-full !h-24" />
            )}
          </div>
          <div className="absolute top-2 right-2">
            <StatusBadge status={p.grade} variant="info" />
          </div>
          <div className="absolute bottom-2 left-2 text-[10px] uppercase tracking-wider text-[#59687A] font-semibold">{p.kategori}</div>
        </div>
        <div className="p-3 border-t border-[#DFE3E8]">
          <div className="text-[10px] font-mono-num text-[#0A6ED1] font-medium">{p.kode}</div>
          <div className="text-sm font-semibold text-[#1C252E] truncate group-hover:text-[#0A6ED1] transition-colors">{p.nama}</div>
          <div className="text-[11px] text-[#59687A] mb-2">{p.spek}</div>
          <div className="flex items-center justify-between pt-1 border-t border-[#EEF0F2]">
            <div className="text-[10px] text-[#59687A]">Harga</div>
            <div className="font-mono-num text-xs font-semibold text-[#1C252E]">{formatRupiah(p.harga)}</div>
          </div>
        </div>
      </div>
    }
  />
);

// ─── Generic API-connected tab hook ─────────────────────────────────────────
const useApiData = (api, tabKey, activeTab, activeWhen = tabKey) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const shouldLoad = Array.isArray(activeWhen) ? activeWhen.includes(activeTab) : activeTab === activeWhen;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getAll({ per_page: 200 });
      const payload = res.data;
      setData(payload.data || payload);
    } catch (err) {
      console.error(`Failed to load ${tabKey}:`, err);
      toast.error(`Gagal memuat data ${tabKey}`, { description: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  }, [api, tabKey]);

  useEffect(() => {
    if (shouldLoad) load();
  }, [shouldLoad, load]);

  const handleCreate = async (formData) => {
    try {
      await api.create(formData);
      toast.success(`${tabKey} berhasil ditambahkan`);
      load();
    } catch (err) {
      toast.error(`Gagal menambah ${tabKey}`, { description: err.response?.data?.message || err.message });
      throw err;
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      await api.update(id, formData);
      toast.success(`${tabKey} berhasil diperbarui`);
      load();
    } catch (err) {
      toast.error(`Gagal memperbarui ${tabKey}`, { description: err.response?.data?.message || err.message });
      throw err;
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus "${name}"?\n\nTindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.delete(id);
      toast.success(`${tabKey} berhasil dihapus`);
      load();
    } catch (err) {
      toast.error(`Gagal menghapus ${tabKey}`, { description: err.response?.data?.message || err.message });
    }
  };

  return { data, loading, handleCreate, handleUpdate, handleDelete, reload: load };
};

// ─── Main MasterData Page ────────────────────────────────────────────────────
const MasterData = () => {
  const [tab, setTab] = useState("products");
  const [productView, setProductView] = useState("grid");
  const [productQuery, setProductQuery] = useState("");

  // Products
  const products     = useApiData(productApi,    "Produk",           tab, ["products", "specs"]);
  const categories   = useApiData(productCategoryApi, "Kategori Produk", tab, "products");
  const types        = useApiData(productTypeApi, "Tipe Produk",      tab, "products");
  const specs        = useApiData(productSpecApi, "Spesifikasi",      tab, "specs");
  const grades       = useApiData(concreteGradeApi, "Mutu Beton",    tab, ["products", "grades"]);
  // Materials
  const materials    = useApiData(materialApi,   "Material",          tab, ["materials", "suppliers"]);
  const matCats      = useApiData(materialCategoryApi, "Kategori Material", tab, "materials");
  // Others
  const molds        = useApiData(moldApi,       "Cetakan",           tab, "molds");
  const customers    = useApiData(customerApi,   "Customer",          tab, "customers");
  const suppliers    = useApiData(supplierApi,   "Supplier",          tab, "suppliers");
  const warehouses   = useApiData(warehouseApi,  "Gudang",            tab, "warehouses");
  const users        = useApiData(userApi,       "User",              tab, ["users", "shifts"]);
  const shifts       = useApiData(shiftApi,      "Shift",             tab, "shifts");
  const batchStatuses= useApiData(batchStatusApi,"Status Batch",      tab, "batch-status");
  const qcParams     = useApiData(qcParameterApi, "Parameter QC",    tab, "qc-params");
  const defects      = useApiData(defectCategoryApi, "Kategori Defect", tab, "defects");

  // Status Produksi & Pengiriman di-hardcode (bukan master data)

  const filteredProducts = products.data.filter((p) => {
    if (!productQuery) return true;
    return Object.values(p).some((v) => String(v).toLowerCase().includes(productQuery.toLowerCase()));
  });

  const viewToggle = (
    <div className="inline-flex items-center border border-[#DFE3E8] rounded-md p-0.5 bg-[#F4F6F8]">
      <button
        data-testid="product-view-grid"
        onClick={() => setProductView("grid")}
        className={`h-7 px-2.5 text-xs rounded flex items-center gap-1.5 transition-colors ${productView === "grid" ? "bg-white text-[#0A6ED1] shadow-sm font-medium" : "text-[#59687A]"}`}
      >
        <LayoutGrid className="w-3.5 h-3.5" /> Grid
      </button>
      <button
        data-testid="product-view-table"
        onClick={() => setProductView("table")}
        className={`h-7 px-2.5 text-xs rounded flex items-center gap-1.5 transition-colors ${productView === "table" ? "bg-white text-[#0A6ED1] shadow-sm font-medium" : "text-[#59687A]"}`}
      >
        <TableIcon className="w-3.5 h-3.5" /> Tabel
      </button>
    </div>
  );

  // Grade options derived from loaded data (fallback to common values)
  const gradeOptions = grades.data.length
    ? grades.data.map(g => ({ value: g.grade, label: g.grade }))
    : ["K-250","K-300","K-350","K-400","K-500"].map(g => ({ value: g, label: g }));

  // Product Category and Type options
  const productCategoryOptions = Array.from(new Set([
    ...categories.data.map(c => c.nama),
    ...products.data.map(p => p.kategori)
  ].filter(Boolean))).map(c => ({ value: c, label: c }));

  const productTypeOptions = Array.from(new Set([
    ...types.data.map(t => t.nama),
    ...products.data.map(p => p.varian)
  ].filter(Boolean))).map(t => ({ value: t, label: t }));

  const productOptions = products.data.map(p => ({
    value: p.id,
    label: `${p.kode} - ${p.nama}`
  }));

  const materialCategoryOptions = Array.from(new Set([
    ...matCats.data.map(c => c.nama),
    ...materials.data.map(m => m.kategori)
  ].filter(Boolean))).map(c => ({ value: c, label: c }));

  // User options for supervisor selects (name-based)
  const userOptions = users.data.length
    ? users.data.map(u => ({ value: u.name, label: u.name }))
    : [];

  return (
    <div>
      <PageHeader
        title="Master Data"
        subtitle="Kelola data referensi produk, material, customer, dan sumber daya pabrik"
        breadcrumbs={["Beranda", "Master Data"]}
        testId="master-data-header"
      />
      <div className="p-6">
        <Tabs value={tab} onValueChange={setTab} data-testid="master-tabs">
          <TabsList className="bg-white border border-[#DFE3E8] p-1 h-auto flex flex-wrap gap-1">
            <TabsTrigger value="products"     className="text-xs h-8">Produk</TabsTrigger>
            <TabsTrigger value="specs"        className="text-xs h-8">Spesifikasi</TabsTrigger>
            <TabsTrigger value="grades"       className="text-xs h-8">Mutu Beton</TabsTrigger>
            <TabsTrigger value="materials"    className="text-xs h-8">Material</TabsTrigger>
            <TabsTrigger value="molds"        className="text-xs h-8">Cetakan</TabsTrigger>
            <TabsTrigger value="customers"    className="text-xs h-8">Customer</TabsTrigger>
            <TabsTrigger value="suppliers"    className="text-xs h-8">Supplier</TabsTrigger>
            <TabsTrigger value="warehouses"   className="text-xs h-8">Gudang</TabsTrigger>
            <TabsTrigger value="users"        className="text-xs h-8">User</TabsTrigger>
            <TabsTrigger value="shifts"       className="text-xs h-8">Shift</TabsTrigger>
            <TabsTrigger value="batch-status" className="text-xs h-8">Status Batch</TabsTrigger>
            <TabsTrigger value="qc-params"    className="text-xs h-8">Parameter QC</TabsTrigger>
            <TabsTrigger value="defects"      className="text-xs h-8">Kategori Defect</TabsTrigger>
          </TabsList>

          {/* ── PRODUK ── */}
          <TabsContent value="products" className="mt-4">
            {products.loading ? (
              <div className="bg-white border border-[#DFE3E8] rounded-md p-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#0A6ED1] mr-2" />
                <span className="text-[#59687A]">Memuat produk...</span>
              </div>
            ) : productView === "grid" ? (
              <div className="bg-white border border-[#DFE3E8] rounded-md" data-testid="products-grid">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#DFE3E8]">
                  <div className="flex items-center gap-2">
                    <div className="relative w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#59687A]" />
                      <Input placeholder="Cari produk..." value={productQuery} onChange={(e) => setProductQuery(e.target.value)} className="pl-9 h-8 text-xs bg-[#F4F6F8] border-[#DFE3E8]" data-testid="products-grid-search" />
                    </div>
                    {viewToggle}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => showExportToast("Katalog Produk")}>
                      <Download className="w-3.5 h-3.5" />Ekspor Katalog
                    </Button>
                    <FormDialog
                      testId="products-grid-create"
                      title="Tambah Produk"
                      description="Tambah produk baru ke katalog"
                      submitLabel="Simpan"
                      successMessage="Produk berhasil ditambahkan"
                      onSubmit={products.handleCreate}
                      fields={[
                        { name: "kode",             label: "Kode Produk",    required: true },
                        { name: "nama",             label: "Nama Produk",    required: true, span: 2 },
                        { name: "foto",             label: "Foto Produk",    type: "file", span: 2 },
                        { name: "kategori",         label: "Kategori",       type: "datalist", options: productCategoryOptions, placeholder: "Pilih / ketik baru..." },
                        { name: "varian",           label: "Tipe/Varian",    type: "datalist", options: productTypeOptions, placeholder: "Pilih / ketik baru..." },
                        { name: "grade",            label: "Mutu Beton",     type: "select", options: gradeOptions },
                        { name: "spek",             label: "Spesifikasi" },
                        { name: "berat",            label: "Berat (kg)",     type: "number" },
                        { name: "volume_m3",        label: "Volume (m³)",    type: "number", placeholder: "Volume per unit" },
                        { name: "harga",            label: "Harga (Rp)",     type: "number" },
                        { name: "satuan",           label: "Satuan",         placeholder: "pcs, unit, m3" },
                      ]}
                      trigger={
                        <Button size="sm" className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1]">
                          <Plus className="w-3.5 h-3.5" />Tambah Produk
                        </Button>
                      }
                    />
                  </div>
                </div>
                {filteredProducts.length === 0 ? (
                  <div className="px-4 py-12 text-center text-xs text-[#59687A]">Tidak ada produk yang cocok</div>
                ) : (
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filteredProducts.map((p, i) => <ProductGridCard key={p.kode || i} p={p} i={i} />)}
                  </div>
                )}
              </div>
            ) : (
              <Section
                testId="products-table" entityName="Produk"
                data={products.data} headerExtra={viewToggle}
                onSubmit={products.handleCreate} onUpdate={products.handleUpdate} onDelete={products.handleDelete}
                addFields={[
                  { name: "kode",             label: "Kode Produk",    required: true },
                  { name: "nama",             label: "Nama Produk",    required: true, span: 2 },
                  { name: "foto",             label: "Foto Produk",    type: "file", span: 2 },
                  { name: "kategori",         label: "Kategori",       type: "datalist", options: productCategoryOptions, placeholder: "Pilih / ketik baru..." },
                  { name: "varian",           label: "Tipe/Varian",    type: "datalist", options: productTypeOptions, placeholder: "Pilih / ketik baru..." },
                  { name: "grade",            label: "Mutu Beton",     type: "select", options: gradeOptions },
                  { name: "spek",             label: "Spesifikasi" },
                  { name: "berat",            label: "Berat (kg)",     type: "number" },
                  { name: "volume_m3",        label: "Volume (m³)",    type: "number", placeholder: "Volume per unit" },
                  { name: "harga",            label: "Harga (Rp)",     type: "number" },
                ]}
                filterSelects={[{ name: "kategori", label: "Kategori", options: productCategoryOptions }]}
                columns={[
                  { key: "thumb",    label: "",              render: (r) => r.foto ? <img src={r.foto} alt={r.nama} className="w-8 h-8 object-cover rounded" /> : <ProductIcon name={r.nama} size="sm" /> },
                  { key: "kode",     label: "Kode",          cls: "font-mono-num text-[#0A6ED1] font-medium" },
                  { key: "nama",     label: "Nama Produk",   cls: "font-medium" },
                  { key: "kategori", label: "Kategori" },
                  { key: "spek",     label: "Spesifikasi",   cls: "text-[#59687A]" },
                  { key: "grade",    label: "Mutu",          render: (r) => <StatusBadge status={r.grade} variant="info" /> },
                  { key: "berat",    label: "Berat (kg)",    cls: "text-right font-mono-num", render: (r) => formatNumber(r.berat || 0) },
                  { key: "volume_m3", label: "Volume (m³)", cls: "text-right font-mono-num", render: (r) => r.volume_m3 ? `${formatNumber(r.volume_m3)} m³` : "-" },
                  { key: "harga",    label: "Harga",         cls: "text-right font-mono-num", render: (r) => formatRupiah(r.harga || 0) },
                ]}
              />
            )}
          </TabsContent>

          {/* ── SPESIFIKASI ── */}
          <TabsContent value="specs" className="mt-4">
            <Section testId="specs-table" entityName="Spesifikasi Produk"
              data={specs.data} loading={specs.loading}
              onSubmit={specs.handleCreate} onUpdate={specs.handleUpdate} onDelete={specs.handleDelete}
              addFields={[
                { name: "kode",      label: "Kode Spec",     required: true },
                { name: "product_id", label: "Produk",       required: true, type: "select", options: productOptions, span: 2 },
                { name: "dimensi",   label: "Dimensi" },
                { name: "toleransi", label: "Toleransi" },
                { name: "berat",     label: "Berat" },
                { name: "grade",     label: "Mutu Beton",    type: "select", options: gradeOptions },
              ]}
              columns={[
                { key: "kode",      label: "Kode",          cls: "font-mono-num text-[#0A6ED1] font-medium" },
                { key: "produk",    label: "Produk",        cls: "font-medium" },
                { key: "dimensi",   label: "Dimensi",       cls: "font-mono-num" },
                { key: "toleransi", label: "Toleransi",     cls: "text-[#59687A]" },
                { key: "berat",     label: "Berat" },
                { key: "grade",     label: "Mutu",          render: (r) => <StatusBadge status={r.grade} variant="info" /> },
                { key: "aktif",     label: "Status",        render: (r) => <StatusBadge status={r.aktif ? "Aktif" : "Nonaktif"} /> },
              ]}
            />
          </TabsContent>

          {/* ── MUTU BETON ── */}
          <TabsContent value="grades" className="mt-4">
            <Section testId="grades-table" entityName="Mutu Beton"
              data={grades.data} loading={grades.loading}
              onSubmit={grades.handleCreate} onUpdate={grades.handleUpdate} onDelete={grades.handleDelete}
              addFields={[
                { name: "grade",        label: "Kode Mutu",       required: true, placeholder: "K-350" },
                { name: "nama",         label: "Nama Mutu",       required: true, span: 2, placeholder: "Beton K-350 untuk Kolom" },
                { name: "fc_mpa",       label: "f'c (MPa)",       type: "number", required: true, placeholder: "29.05" },
                { name: "slump_min_cm", label: "Slump Min (cm)",  type: "number", placeholder: "8" },
                { name: "slump_max_cm", label: "Slump Max (cm)",  type: "number", placeholder: "12" },
                { name: "keterangan",   label: "Keterangan",      type: "textarea", span: 2 },
              ]}
              columns={[
                { key: "grade",        label: "Kode",            cls: "font-mono-num text-[#0A6ED1] font-medium" },
                { key: "nama",         label: "Nama Mutu",       cls: "font-medium" },
                { key: "fc_mpa",       label: "f'c (MPa)",       cls: "text-right font-mono-num" },
                { key: "slump_min_cm", label: "Slump Min (cm)",  cls: "text-right font-mono-num" },
                { key: "slump_max_cm", label: "Slump Max (cm)",  cls: "text-right font-mono-num" },
                { key: "keterangan",   label: "Keterangan",      cls: "text-[#59687A]" },
              ]}
            />
          </TabsContent>

          {/* ── MATERIAL ── */}
          <TabsContent value="materials" className="mt-4">
            <Section testId="materials-table" entityName="Material"
              data={materials.data} loading={materials.loading}
              onSubmit={materials.handleCreate} onUpdate={materials.handleUpdate} onDelete={materials.handleDelete}
              addFields={[
                { name: "nama",     label: "Nama Material", required: true, span: 2 },
                { name: "satuan",   label: "Satuan",        type: "select", options: [
                  { value: "kg", label: "kg" }, { value: "ton", label: "ton" },
                  { value: "m3", label: "m³" }, { value: "liter", label: "liter" }, { value: "lembar", label: "lembar" },
                ]},
                { name: "kategori", label: "Kategori",      type: "datalist", options: materialCategoryOptions, placeholder: "Pilih / ketik baru..." },
                { name: "stok",     label: "Stok Awal",     type: "number" },
                { name: "min_stok", label: "Min Stok",      type: "number" },
                { name: "harga",    label: "Harga (Rp/unit)", type: "number" },
                { name: "lead_time_hari", label: "Lead Time (hari)", type: "number", placeholder: "Hari pengiriman dari PO" },
              ]}
              columns={[
                { key: "nama",     label: "Nama Material", cls: "font-medium" },
                { key: "kategori", label: "Kategori" },
                { key: "satuan",   label: "Satuan" },
                { key: "stok",     label: "Stok",          cls: "text-right font-mono-num", render: (r) => formatNumber(r.stok || 0) },
                { key: "min_stok", label: "Min Stok",      cls: "text-right font-mono-num text-[#59687A]", render: (r) => formatNumber(r.min_stok || 0) },
                { key: "harga",    label: "Harga/Unit",    cls: "text-right font-mono-num", render: (r) => formatRupiah(r.harga || 0) },
                { key: "lead_time_hari", label: "Lead Time", cls: "text-right font-mono-num", render: (r) => r.lead_time_hari ? `${r.lead_time_hari} hari` : "-" },
              ]}
            />
          </TabsContent>

          {/* ── CETAKAN ── */}
          <TabsContent value="molds" className="mt-4">
            <Section testId="molds-table" entityName="Cetakan"
              data={molds.data} loading={molds.loading}
              onSubmit={molds.handleCreate} onUpdate={molds.handleUpdate} onDelete={molds.handleDelete}
              addFields={[
                { name: "kode",                 label: "Kode Cetakan",        required: true },
                { name: "nama",                 label: "Nama Cetakan",        required: true, span: 2 },
                { name: "produk",               label: "Produk Terkait" },
                { name: "jumlah",               label: "Jumlah Cetakan",      type: "number" },
                { name: "kondisi",              label: "Kondisi",             type: "select", options: [
                  { value: "Baik", label: "Baik" }, { value: "Sedang", label: "Sedang" }, { value: "Perlu Perawatan", label: "Perlu Perawatan" },
                ]},
                { name: "kapasitas_per_siklus", label: "Kapasitas/Siklus",    type: "number", placeholder: "Jml produk per siklus casting" },
                { name: "siklus_per_hari",      label: "Siklus/Hari",         type: "number", placeholder: "Jml siklus casting per hari" },
              ]}
              columns={[
                { key: "kode",                 label: "Kode",          cls: "font-mono-num text-[#0A6ED1] font-medium" },
                { key: "nama",                 label: "Cetakan",       cls: "font-medium" },
                { key: "produk",               label: "Produk" },
                { key: "jumlah",               label: "Total",         cls: "text-right font-mono-num" },
                { key: "kondisi",              label: "Kondisi",       render: (r) => <StatusBadge status={r.kondisi} /> },
                { key: "kapasitas_per_siklus", label: "Kap/Siklus",   cls: "text-right font-mono-num" },
                { key: "siklus_per_hari",      label: "Siklus/Hari",  cls: "text-right font-mono-num" },
              ]}
            />
          </TabsContent>

          {/* ── CUSTOMER ── */}
          <TabsContent value="customers" className="mt-4">
            <Section testId="customers-table" entityName="Customer"
              data={customers.data} loading={customers.loading}
              onSubmit={customers.handleCreate} onUpdate={customers.handleUpdate} onDelete={customers.handleDelete}
              addFields={[
                { name: "kode",         label: "Kode Customer",    required: true },
                { name: "nama",         label: "Nama Perusahaan",  required: true, span: 2 },
                { name: "kontak",       label: "Kontak Person" },
                { name: "telepon",      label: "Telepon" },
                { name: "email",        label: "Email" },
                { name: "npwp",         label: "NPWP",             placeholder: "00.000.000.0-000.000" },
                { name: "pic_proyek",   label: "PIC Proyek",       placeholder: "Nama PIC di lapangan" },
                { name: "kota",         label: "Kota" },
                { name: "segmen",       label: "Segmen",           type: "select", options: [
                  { value: "BUMN Konstruksi", label: "BUMN Konstruksi" },
                  { value: "Swasta",          label: "Swasta" },
                  { value: "Pemerintah",      label: "Pemerintah" },
                ]},
                { name: "limit_kredit", label: "Limit Kredit (Rp)", type: "number" },
                { name: "alamat",       label: "Alamat Lengkap",   type: "textarea", span: 2 },
              ]}
              columns={[
                { key: "kode",         label: "Kode",          cls: "font-mono-num text-[#0A6ED1] font-medium" },
                { key: "nama",         label: "Customer",      cls: "font-medium" },
                { key: "kontak",       label: "Kontak" },
                { key: "pic_proyek",   label: "PIC Proyek",  cls: "text-[#59687A]" },
                { key: "npwp",         label: "NPWP",          cls: "font-mono-num text-[#59687A]" },
                { key: "telepon",      label: "Telepon",       cls: "font-mono-num" },
                { key: "kota",         label: "Kota" },
                { key: "segmen",       label: "Segmen" },
                { key: "limit_kredit", label: "Limit Kredit",  cls: "text-right font-mono-num", render: (r) => formatRupiah(r.limit_kredit || 0) },
              ]}
            />
          </TabsContent>

          {/* ── SUPPLIER ── */}
          <TabsContent value="suppliers" className="mt-4">
            <Section testId="suppliers-table" entityName="Supplier"
              data={suppliers.data} loading={suppliers.loading}
              onSubmit={suppliers.handleCreate} onUpdate={suppliers.handleUpdate} onDelete={suppliers.handleDelete}
              addFields={[
                { name: "nama",           label: "Nama Supplier",    required: true, span: 2 },
                { name: "materials",      label: "Material Disuplai", type: "multiselect", options: materials.data.map(m => ({ value: m.id, label: m.nama })), span: 2 },
                { name: "kontak",         label: "Telepon" },
                { name: "email",          label: "Email" },
                { name: "kota",           label: "Kota" },
                { name: "rating",         label: "Rating (1-5)",     type: "number" },
                { name: "lead_time_hari", label: "Lead Time (hari)", type: "number", placeholder: "Hari pengiriman dari PO" },
                { name: "alamat",         label: "Alamat",           type: "textarea", span: 2 },
              ]}
              columns={[
                { key: "nama",           label: "Supplier",       cls: "font-medium" },
                { key: "materials",      label: "Material",       render: (r) => r.materials?.map(m => m.nama).join(", ") || "-" },
                { key: "kontak",         label: "Kontak",         cls: "font-mono-num" },
                { key: "kota",           label: "Kota" },
                { key: "lead_time_hari", label: "Lead Time",      cls: "text-right font-mono-num", render: (r) => r.lead_time_hari ? `${r.lead_time_hari} hari` : "-" },
                { key: "rating",         label: "Rating",         render: (r) => "★".repeat(r.rating || 0) + "☆".repeat(5 - (r.rating || 0)) },
              ]}
            />
          </TabsContent>

          {/* ── GUDANG ── */}
          <TabsContent value="warehouses" className="mt-4">
            <Section testId="warehouses-table" entityName="Gudang"
              data={warehouses.data} loading={warehouses.loading}
              onSubmit={warehouses.handleCreate} onUpdate={warehouses.handleUpdate} onDelete={warehouses.handleDelete}
              addFields={[
                { name: "kode",      label: "Kode Gudang",   required: true },
                { name: "nama",      label: "Nama Gudang",   required: true, span: 2 },
                { name: "tipe",      label: "Tipe",          type: "select", options: [
                  { value: "Raw Material", label: "Raw Material" },
                  { value: "Work In Progress", label: "Work In Progress" },
                  { value: "Finished Goods", label: "Finished Goods" },
                  { value: "Reject", label: "Reject" },
                ]},
                { name: "lokasi",    label: "Lokasi" },
                { name: "kapasitas", label: "Kapasitas" },
              ]}
              columns={[
                { key: "kode",      label: "Kode",          cls: "font-mono-num text-[#0A6ED1] font-medium" },
                { key: "nama",      label: "Gudang",        cls: "font-medium" },
                { key: "tipe",      label: "Tipe" },
                { key: "lokasi",    label: "Lokasi" },
                { key: "kapasitas", label: "Kapasitas" },
              ]}
            />
          </TabsContent>

          {/* ── USER (Master User - menggantikan Karyawan) ── */}
          <TabsContent value="users" className="mt-4">
            <Section testId="users-table" entityName="User"
              data={users.data} loading={users.loading}
              onSubmit={users.handleCreate} onUpdate={users.handleUpdate} onDelete={users.handleDelete}
              addFields={[
                { name: "name",       label: "Nama Lengkap",  required: true, span: 2 },
                { name: "username",   label: "Username",      required: true },
                { name: "email",      label: "Email",         required: true },
                { name: "password",   label: "Password",      type: "password", placeholder: "Min. 6 karakter" },
                { name: "role",       label: "Role",          required: true, type: "select", options: [
                  { value: "super_admin", label: "Super Admin" },
                  { value: "admin",       label: "Admin" },
                  { value: "manager",     label: "Manager" },
                  { value: "ppic",        label: "PPIC" },
                  { value: "production",  label: "Production" },
                  { value: "qc",          label: "QC" },
                  { value: "warehouse",   label: "Warehouse" },
                  { value: "sales",       label: "Sales" },
                ]},
                { name: "is_active",  label: "Status",        type: "select", options: [
                  { value: true,  label: "Aktif" },
                  { value: false, label: "Nonaktif" },
                ], default: true },
              ]}
              columns={[
                { key: "name",       label: "Nama",          cls: "font-medium" },
                { key: "username",   label: "Username",      cls: "font-mono-num text-[#0A6ED1]" },
                { key: "email",      label: "Email",         cls: "text-[#59687A]" },
                { key: "role",       label: "Role",          render: (r) => <StatusBadge status={r.role} variant="info" /> },
                { key: "is_active",  label: "Status",        render: (r) => <StatusBadge status={r.is_active ? "Aktif" : "Nonaktif"} /> },
              ]}
            />
          </TabsContent>

          {/* ── SHIFT ── */}
          <TabsContent value="shifts" className="mt-4">
            <Section testId="shifts-table" entityName="Shift"
              data={shifts.data} loading={shifts.loading}
              onSubmit={shifts.handleCreate} onUpdate={shifts.handleUpdate} onDelete={shifts.handleDelete}
              addFields={[
                { name: "kode",           label: "Kode Shift",     required: true },
                { name: "nama",           label: "Nama Shift",     required: true },
                { name: "jam",            label: "Jam Kerja",      placeholder: "07:00 - 15:00" },
                { name: "supervisor",     label: "Supervisor",     type: "select", options: userOptions, placeholder: "Pilih supervisor dari User" },
                { name: "jumlah_pekerja", label: "Jumlah Pekerja", type: "number" },
              ]}
              columns={[
                { key: "kode",           label: "Kode",          cls: "font-mono-num text-[#0A6ED1] font-medium" },
                { key: "nama",           label: "Shift",         cls: "font-medium" },
                { key: "jam",            label: "Jam Kerja",     cls: "font-mono-num" },
                { key: "supervisor",     label: "Supervisor",    cls: "text-[#59687A]" },
                { key: "jumlah_pekerja", label: "Jml Pekerja",  cls: "text-right font-mono-num" },
              ]}
            />
          </TabsContent>

          {/* ── STATUS BATCH ── */}
          <TabsContent value="batch-status" className="mt-4">
            <Section testId="batch-status-table" entityName="Status Batch"
              data={batchStatuses.data} loading={batchStatuses.loading}
              onSubmit={batchStatuses.handleCreate} onUpdate={batchStatuses.handleUpdate} onDelete={batchStatuses.handleDelete}
              addFields={[
                { name: "kode",      label: "Kode Status",   required: true, placeholder: "BS-01" },
                { name: "status",    label: "Nama Status",   required: true, span: 2, placeholder: "Planning, Casting, dll" },
                { name: "urutan",    label: "Urutan",        type: "number", placeholder: "1, 2, 3..." },
                { name: "warna",     label: "Warna (hex)",   placeholder: "#4CAF50" },
                { name: "deskripsi", label: "Deskripsi",     type: "textarea", span: 2 },
                { name: "aktif",     label: "Status",        type: "select", options: [
                  { value: true,  label: "Aktif" },
                  { value: false, label: "Nonaktif" },
                ], default: true },
              ]}
              columns={[
                { key: "urutan",  label: "#",          cls: "text-center w-12 font-mono-num text-[#59687A]" },
                { key: "warna",   label: "",           render: (r) => <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: r.warna || "#ccc" }} /> },
                { key: "kode",    label: "Kode",       cls: "font-mono-num text-[#0A6ED1] font-medium" },
                { key: "status",  label: "Status",     cls: "font-medium" },
                { key: "deskripsi", label: "Deskripsi", cls: "text-[#59687A]" },
                { key: "aktif",   label: "Aktif",      render: (r) => <StatusBadge status={r.aktif ? "Aktif" : "Nonaktif"} /> },
              ]}
            />
          </TabsContent>

          {/* ── PARAMETER QC ── */}
          <TabsContent value="qc-params" className="mt-4">
            <Section testId="qc-params-table" entityName="Parameter QC"
              data={qcParams.data} loading={qcParams.loading}
              onSubmit={qcParams.handleCreate} onUpdate={qcParams.handleUpdate} onDelete={qcParams.handleDelete}
              addFields={[
                { name: "kode",      label: "Kode Parameter", required: true },
                { name: "parameter", label: "Nama Parameter", required: true, span: 2 },
                { name: "satuan",    label: "Satuan" },
                { name: "min",       label: "Batas Minimum" },
                { name: "target",    label: "Target" },
                { name: "metode",    label: "Metode Uji",     span: 2 },
              ]}
              columns={[
                { key: "kode",      label: "Kode",          cls: "font-mono-num text-[#0A6ED1] font-medium" },
                { key: "parameter", label: "Parameter",     cls: "font-medium" },
                { key: "satuan",    label: "Satuan",        cls: "text-[#59687A]" },
                { key: "min",       label: "Minimum" },
                { key: "target",    label: "Target",        cls: "font-medium text-[#107E3E]" },
                { key: "metode",    label: "Metode" },
                { key: "aktif",     label: "Status",        render: (r) => <StatusBadge status={r.aktif ? "Aktif" : "Nonaktif"} /> },
              ]}
            />
          </TabsContent>

          {/* ── KATEGORI DEFECT ── */}
          <TabsContent value="defects" className="mt-4">
            <Section testId="defects-table" entityName="Kategori Defect"
              data={defects.data} loading={defects.loading}
              onSubmit={defects.handleCreate} onUpdate={defects.handleUpdate} onDelete={defects.handleDelete}
              addFields={[
                { name: "kode",          label: "Kode Defect",    required: true },
                { name: "nama",          label: "Nama Defect",    required: true, span: 2 },
                { name: "tingkat",       label: "Tingkat",        type: "select", options: [
                  { value: "Kritis", label: "Kritis" }, { value: "Mayor", label: "Mayor" }, { value: "Minor", label: "Minor" },
                ]},
                { name: "warna",         label: "Warna (hex)",    placeholder: "#FF0000" },
                { name: "penyebab_umum", label: "Penyebab Umum",  span: 2 },
                { name: "disposisi",     label: "Disposisi Standar", span: 2 },
              ]}
              columns={[
                { key: "kode",          label: "Kode",          cls: "font-mono-num text-[#0A6ED1] font-medium" },
                { key: "warna",         label: "",              render: (r) => <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: r.warna }} /> },
                { key: "nama",          label: "Defect",        cls: "font-medium" },
                { key: "tingkat",       label: "Tingkat",       render: (r) => <StatusBadge status={r.tingkat} /> },
                { key: "penyebab_umum", label: "Penyebab Umum", cls: "text-[#59687A]" },
                { key: "disposisi",     label: "Disposisi" },
                { key: "aktif",         label: "Status",        render: (r) => <StatusBadge status={r.aktif ? "Aktif" : "Nonaktif"} /> },
              ]}
            />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default MasterData;
