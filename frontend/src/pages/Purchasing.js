import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import KPICard from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { purchaseOrders, suppliers, materials, formatRupiah } from "@/data/mockData";
import { ShoppingBag, Truck, FileText, Plus, Download } from "lucide-react";
import FormDialog from "@/components/shared/FormDialog";
import { showExportToast } from "@/components/shared/FilterPopover";

const Purchasing = () => {
  const totalNilai = purchaseOrders.reduce((s, p) => s + p.nilai, 0);

  return (
    <div>
      <PageHeader
        title="Pembelian"
        subtitle="Purchase order bahan baku dari supplier"
        breadcrumbs={["Beranda", "Pembelian"]}
        testId="purchasing-page-header"
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => showExportToast("purchase orders")}><Download className="w-3.5 h-3.5" />Ekspor</Button>
            <FormDialog
              testId="po-purchase-create"
              title="Purchase Order Baru"
              description="Buat PO pembelian bahan baku dari supplier"
              submitLabel="Buat PO"
              successMessage="Purchase Order berhasil dibuat"
              fields={[
                { name: "supplier", label: "Supplier", type: "select", required: true, options: suppliers.map(s => ({ value: s.kode, label: s.nama })) },
                { name: "material", label: "Material", type: "select", required: true, options: materials.map(m => ({ value: m.kode, label: `${m.kode} — ${m.nama}` })) },
                { name: "qty", label: "Quantity", type: "number", required: true },
                { name: "satuan", label: "Satuan", type: "select", options: [
                  { value: "kg", label: "kg" }, { value: "ton", label: "ton" },
                  { value: "m3", label: "m³" }, { value: "liter", label: "liter" },
                  { value: "lembar", label: "lembar" },
                ]},
                { name: "harga", label: "Harga Satuan (Rp)", type: "number" },
                { name: "tglTiba", label: "Estimasi Tiba", type: "date", required: true },
                { name: "termin", label: "Termin Pembayaran", type: "select", options: [
                  { value: "tunai", label: "Tunai" }, { value: "30hari", label: "30 Hari" },
                  { value: "60hari", label: "60 Hari" },
                ]},
                { name: "catatan", label: "Catatan", type: "textarea", span: 2 },
              ]}
              trigger={<Button size="sm" className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1]"><Plus className="w-3.5 h-3.5" />PO Baru</Button>}
            />
          </>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard testId="pur-kpi-total" label="Total Nilai PO" value={(totalNilai / 1000000).toFixed(0)} unit="Juta Rp" icon={ShoppingBag} accent="default" />
          <KPICard testId="pur-kpi-confirm" label="Konfirmasi" value="2" unit="PO" icon={FileText} accent="default" />
          <KPICard testId="pur-kpi-ship" label="Dalam Pengiriman" value="1" unit="PO" icon={Truck} accent="warning" />
          <KPICard testId="pur-kpi-received" label="Diterima Bulan Ini" value="3" unit="PO" icon={Truck} accent="success" />
        </div>

        <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-[#DFE3E8]">
            <div className="text-base font-semibold text-[#1C252E] font-display">Daftar Purchase Order</div>
          </div>
          <table className="w-full mes-table">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">No. PO</th>
                <th className="px-4 py-2 text-left">Supplier</th>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Nilai</th>
                <th className="px-4 py-2 text-left">Tgl Order</th>
                <th className="px-4 py-2 text-left">Estimasi Tiba</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((p, i) => (
                <tr key={p.no} data-testid={`pur-row-${i}`}>
                  <td className="px-4 font-mono-num text-[#0A6ED1] font-medium">{p.no}</td>
                  <td className="px-4 font-medium">{p.supplier}</td>
                  <td className="px-4 text-[#59687A]">{p.item}</td>
                  <td className="px-4 text-right font-mono-num">{p.qty}</td>
                  <td className="px-4 text-right font-mono-num font-semibold">{formatRupiah(p.nilai)}</td>
                  <td className="px-4 font-mono-num text-[#59687A]">{p.tglOrder}</td>
                  <td className="px-4 font-mono-num">{p.tglTiba}</td>
                  <td className="px-4"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Purchasing;
