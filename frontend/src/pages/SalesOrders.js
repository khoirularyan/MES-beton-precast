import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import KPICard from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { salesOrders, customers, products, formatRupiah } from "@/data/mockData";
import { ShoppingCart, TrendingUp, FileCheck, Clock, Plus, Download } from "lucide-react";
import FormDialog from "@/components/shared/FormDialog";
import { showExportToast } from "@/components/shared/FilterPopover";

const SalesOrders = () => {
  const totalNilai = salesOrders.reduce((s, o) => s + o.nilai, 0);
  const aktif = salesOrders.filter((o) => o.status !== "Selesai").length;

  return (
    <div>
      <PageHeader
        title="Order Penjualan"
        subtitle="Manajemen sales order dari customer BUMN, swasta, dan pemerintah"
        breadcrumbs={["Beranda", "Order Penjualan"]}
        testId="sales-page-header"
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => showExportToast("sales orders")}><Download className="w-3.5 h-3.5" />Ekspor</Button>
            <FormDialog
              testId="so-create"
              title="Sales Order Baru"
              description="Catat order baru dari customer"
              submitLabel="Buat Sales Order"
              successMessage="Sales order berhasil dibuat"
              fields={[
                { name: "customer", label: "Customer", type: "select", required: true, options: customers.map(c => ({ value: c.kode, label: c.nama })) },
                { name: "produk", label: "Produk Utama", type: "select", required: true, options: products.map(p => ({ value: p.kode, label: `${p.kode} — ${p.nama}` })) },
                { name: "qty", label: "Quantity", type: "number", required: true },
                { name: "nilai", label: "Nilai Order (Rp)", type: "number", required: true },
                { name: "tglOrder", label: "Tanggal Order", type: "date", required: true },
                { name: "tglKirim", label: "Tanggal Kirim", type: "date", required: true },
                { name: "termPayment", label: "Termin Pembayaran", type: "select", options: [
                  { value: "tunai", label: "Tunai" },
                  { value: "30hari", label: "30 Hari" },
                  { value: "60hari", label: "60 Hari" },
                  { value: "90hari", label: "90 Hari" },
                ]},
                { name: "alamatKirim", label: "Alamat Pengiriman", type: "textarea", span: 2 },
              ]}
              trigger={<Button size="sm" className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1]"><Plus className="w-3.5 h-3.5" />Sales Order Baru</Button>}
            />
          </>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard testId="so-kpi-total" label="Total Nilai Order" value={(totalNilai / 1000000000).toFixed(2)} unit="Milyar" icon={ShoppingCart} accent="success" />
          <KPICard testId="so-kpi-aktif" label="Order Aktif" value={aktif} unit="order" icon={TrendingUp} accent="default" />
          <KPICard testId="so-kpi-siap" label="Siap Dikirim" value="2" unit="order" icon={FileCheck} accent="warning" />
          <KPICard testId="so-kpi-pending" label="Menunggu Produksi" value="3" unit="order" icon={Clock} accent="neutral" />
        </div>

        <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-[#DFE3E8]">
            <div className="text-base font-semibold text-[#1C252E] font-display">Daftar Sales Order</div>
          </div>
          <table className="w-full mes-table">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">No. SO</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Produk</th>
                <th className="px-4 py-2 text-right">Nilai Order</th>
                <th className="px-4 py-2 text-left">Tgl Order</th>
                <th className="px-4 py-2 text-left">Tgl Kirim</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {salesOrders.map((s, i) => (
                <tr key={s.no} data-testid={`so-row-${i}`}>
                  <td className="px-4 font-mono-num text-[#0A6ED1] font-medium">{s.no}</td>
                  <td className="px-4 font-medium">{s.customer}</td>
                  <td className="px-4 text-[#59687A] max-w-xs truncate">{s.produk}</td>
                  <td className="px-4 text-right font-mono-num font-semibold">{formatRupiah(s.nilai)}</td>
                  <td className="px-4 font-mono-num text-[#59687A]">{s.tglOrder}</td>
                  <td className="px-4 font-mono-num">{s.tglKirim}</td>
                  <td className="px-4"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesOrders;
