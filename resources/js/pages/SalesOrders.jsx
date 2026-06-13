import { useState, useEffect } from "react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import KPICard from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { salesOrderApi, customerApi, productApi } from "@/lib/api";
import { 
  ShoppingCart, 
  TrendingUp, 
  FileCheck, 
  Clock, 
  Plus, 
  Download, 
  Search, 
  Trash2, 
  History,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  LockOpen
} from "lucide-react";

export const formatRupiah = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const SalesOrders = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("sales.manage");
  const canApprove = hasPermission("sales.approve");
  const canPlan = hasPermission("planning.manage");

  // State Lists
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  // Filter & Pagination States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Form States
  const [rejectReason, setRejectReason] = useState("");
  const [formData, setFormData] = useState({
    no: "",
    so_type: "MTO",
    customer_id: "",
    nilai: 0,
    tgl_order: new Date().toISOString().split("T")[0],
    tgl_kirim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    prioritas: "Sedang",
    catatan: "",
    items: []
  });

  // KPI States
  const [kpis, setKpis] = useState({
    totalValue: 0,
    activeOrders: 0,
    approvedCount: 0,
    draftCount: 0,
    counts: {
      Draft: 0,
      Submitted: 0,
      Approved: 0,
      Planning: 0,
      Production: 0,
      Completed: 0,
      Delivered: 0,
      Cancelled: 0,
      Rejected: 0
    }
  });

  // Load Initial Lists
  useEffect(() => {
    fetchCustomersAndProducts();
    fetchOrders();
  }, [search, statusFilter, typeFilter, page]);

  const fetchCustomersAndProducts = async () => {
    try {
      const custRes = await customerApi.getAll({ per_page: 100 });
      setCustomers(custRes.data?.data || []);

      const prodRes = await productApi.getAll({ per_page: 100 });
      setProducts(prodRes.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch customer/products", err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 10,
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        so_type: typeFilter !== "all" ? typeFilter : undefined,
      };
      const res = await salesOrderApi.getAll(params);
      setOrders(res.data?.data || []);
      setLastPage(res.data?.last_page || 1);
      setTotal(res.data?.total || 0);

      // Compute KPI summaries dynamically
      const allOrdersRes = await salesOrderApi.getAll({ per_page: 1000 });
      const allList = allOrdersRes.data?.data || [];
      const totalVal = allList.reduce((sum, o) => sum + Number(o.nilai || 0), 0);
      const active = allList.filter(o => !["Completed", "Delivered", "Cancelled"].includes(o.status)).length;
      
      const counts = {
        Draft: allList.filter(o => o.status === "Draft").length,
        Submitted: allList.filter(o => o.status === "Submitted").length,
        Approved: allList.filter(o => o.status === "Approved").length,
        Planning: allList.filter(o => o.status === "Planning").length,
        Production: allList.filter(o => o.status === "Production").length,
        Completed: allList.filter(o => o.status === "Completed").length,
        Delivered: allList.filter(o => o.status === "Delivered").length,
        Cancelled: allList.filter(o => o.status === "Cancelled").length,
        Rejected: allList.filter(o => o.status === "Rejected").length,
      };

      setKpis({
        totalValue: totalVal,
        activeOrders: active,
        approvedCount: counts.Approved,
        draftCount: counts.Draft,
        counts
      });
    } catch (err) {
      toast.error("Failed to load sales orders");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (order) => {
    try {
      const detailRes = await salesOrderApi.getOne(order.id);
      setSelectedOrder(detailRes.data);
      setShowDetailDialog(true);
      
      // Load audit timeline logs
      const auditRes = await salesOrderApi.getAuditLogs(order.id);
      setAuditLogs(auditRes.data || []);
    } catch (err) {
      toast.error("Failed to load sales order details");
    }
  };

  // Item Form Helpers
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: "",
          qty_ordered: 1,
          unit_price: 0,
          delivery_date: prev.tgl_kirim,
          notes: ""
        }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => {
      const nextItems = [...prev.items];
      nextItems.splice(index, 1);
      const nextNilai = nextItems.reduce((sum, item) => sum + (item.qty_ordered * item.unit_price), 0);
      return {
        ...prev,
        items: nextItems,
        nilai: nextNilai
      };
    });
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const nextItems = [...prev.items];
      let item = { ...nextItems[index], [field]: value };

      // Autofill unit price from product catalog list price
      if (field === "product_id") {
        const prod = products.find(p => String(p.id) === String(value));
        if (prod) {
          item.unit_price = prod.harga;
        }
      }

      nextItems[index] = item;
      const nextNilai = nextItems.reduce((sum, it) => sum + (it.qty_ordered * it.unit_price), 0);

      return {
        ...prev,
        items: nextItems,
        nilai: nextNilai
      };
    });
  };

  // Actions
  const handleCreate = async () => {
    if (!formData.customer_id || formData.items.length === 0) {
      toast.warning("Please fill in customer and add at least one product.");
      return;
    }
    try {
      await salesOrderApi.create(formData);
      toast.success("Sales order created successfully");
      setShowCreateDialog(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create sales order");
    }
  };

  const handleOpenEdit = (order) => {
    setFormData({
      no: order.no,
      so_type: order.so_type,
      customer_id: String(order.customer_id),
      nilai: order.nilai,
      tgl_order: order.tgl_order,
      tgl_kirim: order.tgl_kirim,
      prioritas: order.prioritas,
      catatan: order.catatan || "",
      items: order.items.map(item => ({
        product_id: String(item.product_id),
        qty_ordered: Number(item.qty_ordered),
        unit_price: Number(item.unit_price),
        delivery_date: item.delivery_date,
        notes: item.notes || ""
      }))
    });
    setSelectedOrder(order);
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    try {
      await salesOrderApi.update(selectedOrder.id, formData);
      toast.success("Sales order updated successfully");
      setShowEditDialog(false);
      fetchOrders();
      if (showDetailDialog) {
        handleOpenDetail(selectedOrder);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update sales order");
    }
  };

  const handleSubmit = async (order) => {
    try {
      await salesOrderApi.submit(order.id);
      toast.success("Sales order submitted for approval");
      fetchOrders();
      if (showDetailDialog) {
        handleOpenDetail(order);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    }
  };

  const handleApprove = async (order) => {
    try {
      await salesOrderApi.confirm(order.id);
      toast.success("Sales order approved");
      fetchOrders();
      if (showDetailDialog) {
        handleOpenDetail(order);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Approval failed");
    }
  };

  const handleOpenReject = (order) => {
    setSelectedOrder(order);
    setRejectReason("");
    setShowRejectDialog(true);
  };

  const handleReject = async () => {
    if (!rejectReason) {
      toast.warning("Rejection reason is required.");
      return;
    }
    try {
      await salesOrderApi.reject(selectedOrder.id, { reason: rejectReason });
      toast.success("Sales order rejected");
      setShowRejectDialog(false);
      fetchOrders();
      if (showDetailDialog) {
        handleOpenDetail(selectedOrder);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Rejection failed");
    }
  };

  const handleCancel = async (order) => {
    if (!confirm("Are you sure you want to cancel this sales order?")) return;
    try {
      await salesOrderApi.cancel(order.id);
      toast.success("Sales order cancelled");
      fetchOrders();
      if (showDetailDialog) {
        handleOpenDetail(order);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancellation failed");
    }
  };

  const handleGenerateDemand = async (order) => {
    try {
      await salesOrderApi.generateDemands(order.id);
      toast.success("Production demands generated successfully");
      fetchOrders();
      if (showDetailDialog) {
        handleOpenDetail(order);
      }
    } catch (err) {
      // Decode laravel validation object if present
      const errMsg = err.response?.data?.errors 
        ? Object.values(err.response.data.errors).flat().join(" ") 
        : (err.response?.data?.message || "Demand generation failed");
      toast.error(errMsg, { duration: 6000 });
    }
  };

  const handleLockBom = async (order) => {
    try {
      const res = await salesOrderApi.lockBom(order.id);
      const { message, missing } = res.data;
      if (missing && missing.length > 0) {
        toast.warning(message, { duration: 6000 });
      } else {
        toast.success(message);
      }
      fetchOrders();
      if (showDetailDialog) {
        handleOpenDetail(order);
      }
    } catch (err) {
      const errMsg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : (err.response?.data?.message || "BOM locking failed");
      toast.error(errMsg, { duration: 6000 });
    }
  };

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        subtitle="Manage sales orders, track item-level BOM locking, and trigger production planning"
        breadcrumbs={["Home", "Sales Orders"]}
        testId="sales-page-header"
        actions={
          <>
            {canManage && (
              <Button 
                size="sm" 
                className="h-8 text-xs gap-1.5 bg-[#0A6ED1] hover:bg-[#0854A1] text-white"
                onClick={() => {
                  setFormData({
                    no: "",
                    so_type: "MTO",
                    customer_id: "",
                    nilai: 0,
                    tgl_order: new Date().toISOString().split("T")[0],
                    tgl_kirim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                    prioritas: "Sedang",
                    catatan: "",
                    items: []
                  });
                  setShowCreateDialog(true);
                }}
              >
                <Plus className="w-3.5 h-3.5" />New Sales Order
              </Button>
            )}
          </>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPI Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="Total Contract Value" value={(kpis.totalValue / 1000000000).toFixed(2)} unit="Billion" icon={ShoppingCart} accent="success" />
          <KPICard label="Active Orders" value={kpis.activeOrders} unit="orders" icon={TrendingUp} accent="default" />
          <KPICard label="Approved (PPIC Queue)" value={kpis.approvedCount} unit="orders" icon={FileCheck} accent="warning" />
          <KPICard label="Draft Orders" value={kpis.draftCount} unit="orders" icon={Clock} accent="neutral" />
        </div>

        {/* Status Breakdown Bar */}
        <div className="bg-white border border-[#DFE3E8] p-4 rounded-md shadow-sm">
          <div className="text-xs font-semibold text-[#59687A] uppercase tracking-wider mb-3 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-[#0A6ED1]" /> Status Distribution
          </div>
          <div className="grid grid-cols-3 md:grid-cols-9 gap-2 text-center">
            {Object.entries(kpis.counts).map(([status, count]) => (
              <div key={status} className="bg-slate-50 border border-[#EEF0F2] rounded py-2 px-1">
                <div className="text-[10px] text-[#59687A] font-medium truncate">{status}</div>
                <div className="text-sm font-semibold text-[#1C252E] font-mono-num mt-0.5">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-[#DFE3E8] p-4 rounded-md">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#59687A]" />
            <Input
              type="text"
              placeholder="Search SO number, customer..."
              className="pl-8 h-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="MTO">Make to Order</SelectItem>
                  <SelectItem value="MTS">Make to Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Sales Order List Table */}
        <div className="bg-white border border-[#DFE3E8] rounded-md overflow-hidden">
          <table className="w-full mes-table">
            <thead>
              <tr className="bg-[#F4F6F8]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#59687A]">SO Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#59687A]">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#59687A]">Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#59687A]">Order Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#59687A]">Order Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#59687A]">Delivery Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#59687A]">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#59687A]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-sm text-[#59687A]">Loading sales orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-sm text-[#59687A]">No sales orders found.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleOpenDetail(o)}>
                    <td className="px-4 py-3 font-mono-num text-[#0A6ED1] font-semibold">{o.no}</td>
                    <td className="px-4 py-3 font-medium">{o.customer?.nama || "Unknown Customer"}</td>
                    <td className="px-4 py-3 text-xs font-medium">{o.so_type}</td>
                    <td className="px-4 py-3 text-right font-mono-num font-semibold text-[#1C252E]">
                      {formatRupiah(o.nilai)}
                    </td>
                    <td className="px-4 py-3 font-mono-num text-xs text-[#59687A]">{o.tgl_order}</td>
                    <td className="px-4 py-3 font-mono-num text-xs font-medium text-[#1C252E]">{o.tgl_kirim}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-[#0A6ED1]" onClick={() => handleOpenDetail(o)}>
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {lastPage > 1 && (
            <div className="px-4 py-3 bg-[#F9FAFB] border-t border-[#DFE3E8] flex items-center justify-between">
              <span className="text-xs text-[#59687A]">Showing {orders.length} of {total} items</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page === lastPage} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Sales Order</DialogTitle>
            <DialogDescription>Create a new customer sales order with locked BOM revisions and calculations.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>SO Number</Label>
              <Input 
                value={formData.no || "(Nomor akan dibuat otomatis)"} 
                disabled
                className="bg-slate-50 italic text-slate-500 font-mono-num"
              />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select 
                value={formData.customer_id} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, customer_id: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SO Type</Label>
              <Select 
                value={formData.so_type} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, so_type: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MTO">Make to Order (MTO)</SelectItem>
                  <SelectItem value="MTS">Make to Stock (MTS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={formData.prioritas} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, prioritas: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rendah">Rendah</SelectItem>
                  <SelectItem value="Sedang">Sedang</SelectItem>
                  <SelectItem value="Tinggi">Tinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order Date</Label>
              <Input 
                type="date" 
                value={formData.tgl_order} 
                onChange={(e) => setFormData(prev => ({ ...prev, tgl_order: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Delivery Target Date</Label>
              <Input 
                type="date" 
                value={formData.tgl_kirim} 
                onChange={(e) => setFormData(prev => ({ ...prev, tgl_kirim: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea 
                value={formData.catatan} 
                onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
                placeholder="Include shipping addresses or contractual details..."
              />
            </div>
          </div>

          {/* Items Sub-table */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#1C252E]">Ordered Products</span>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleAddItem}>
                <Plus className="w-3.5 h-3.5" /> Add Product
              </Button>
            </div>
            <div className="border rounded-md overflow-hidden bg-slate-50">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="p-2.5 text-left font-semibold text-[#59687A]">Product Name</th>
                    <th className="p-2.5 text-right font-semibold text-[#59687A] w-24">Quantity</th>
                    <th className="p-2.5 text-right font-semibold text-[#59687A] w-40">Unit Price (IDR)</th>
                    <th className="p-2.5 text-right font-semibold text-[#59687A] w-36">Total Price</th>
                    <th className="p-2.5 text-center font-semibold text-[#59687A] w-12">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center p-4 text-[#59687A] italic bg-white">No products added. Click Add Product to start.</td>
                    </tr>
                  ) : (
                    formData.items.map((item, idx) => (
                      <tr key={idx} className="border-b bg-white">
                        <td className="p-2">
                          <Select 
                            value={item.product_id} 
                            onValueChange={(val) => handleItemChange(idx, "product_id", val)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select Product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(p => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.kode} - {p.nama}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input 
                            type="number" 
                            className="h-8 text-right text-xs" 
                            min="1"
                            value={item.qty_ordered}
                            onChange={(e) => handleItemChange(idx, "qty_ordered", Number(e.target.value))}
                          />
                        </td>
                        <td className="p-2">
                          <Input 
                            type="number" 
                            className="h-8 text-right text-xs" 
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                          />
                          {(() => {
                            const prod = products.find(p => String(p.id) === String(item.product_id));
                            if (prod && Number(item.unit_price) !== Number(prod.harga)) {
                              return (
                                <div className="text-[10px] text-right text-orange-600 mt-1 leading-tight font-medium">
                                  Harga Master: {formatRupiah(prod.harga)} <br/>
                                  Harga Kontrak: {formatRupiah(item.unit_price)}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </td>
                        <td className="p-2 text-right font-mono font-medium">
                          {formatRupiah(item.qty_ordered * item.unit_price)}
                        </td>
                        <td className="p-2 text-center">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700" onClick={() => handleRemoveItem(idx)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                  {formData.items.length > 0 && (
                    <tr className="bg-slate-50 font-semibold border-t">
                      <td colSpan="3" className="p-2 text-right text-xs">Computed Contract Value:</td>
                      <td className="p-2 text-right font-mono text-sm text-[#0A6ED1]">
                        {formatRupiah(formData.nilai)}
                      </td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button size="sm" className="bg-[#0A6ED1] hover:bg-[#0854A1]" onClick={handleCreate}>Save Draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sales Order: {selectedOrder?.no}</DialogTitle>
            <DialogDescription>Modify draft or rejected sales order information and items list.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>SO Number</Label>
              <Input value={formData.no} disabled className="bg-slate-50 font-mono-num" />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={formData.customer_id} onValueChange={(val) => setFormData(prev => ({ ...prev, customer_id: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SO Type</Label>
              <Select value={formData.so_type} onValueChange={(val) => setFormData(prev => ({ ...prev, so_type: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MTO">Make to Order (MTO)</SelectItem>
                  <SelectItem value="MTS">Make to Stock (MTS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.prioritas} onValueChange={(val) => setFormData(prev => ({ ...prev, prioritas: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rendah">Rendah</SelectItem>
                  <SelectItem value="Sedang">Sedang</SelectItem>
                  <SelectItem value="Tinggi">Tinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Delivery Target Date</Label>
              <Input type="date" value={formData.tgl_kirim} onChange={(e) => setFormData(prev => ({ ...prev, tgl_kirim: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.catatan} onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))} placeholder="..." />
            </div>
          </div>

          {/* Items */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#1C252E]">Ordered Products</span>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleAddItem}>
                <Plus className="w-3.5 h-3.5" /> Add Product
              </Button>
            </div>
            <div className="border rounded-md overflow-hidden bg-slate-50">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="p-2.5 text-left font-semibold text-[#59687A]">Product Name</th>
                    <th className="p-2.5 text-right font-semibold text-[#59687A] w-24">Quantity</th>
                    <th className="p-2.5 text-right font-semibold text-[#59687A] w-40">Unit Price (IDR)</th>
                    <th className="p-2.5 text-right font-semibold text-[#59687A] w-36">Total Price</th>
                    <th className="p-2.5 text-center font-semibold text-[#59687A] w-12">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, idx) => (
                    <tr key={idx} className="border-b bg-white">
                      <td className="p-2">
                        <Select value={item.product_id} onValueChange={(val) => handleItemChange(idx, "product_id", val)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select Product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={String(p.id)}>{p.kode} - {p.nama}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input type="number" className="h-8 text-right text-xs" value={item.qty_ordered} onChange={(e) => handleItemChange(idx, "qty_ordered", Number(e.target.value))} />
                      </td>
                      <td className="p-2">
                        <Input type="number" className="h-8 text-right text-xs" value={item.unit_price} onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))} />
                        {(() => {
                          const prod = products.find(p => String(p.id) === String(item.product_id));
                          if (prod && Number(item.unit_price) !== Number(prod.harga)) {
                            return (
                              <div className="text-[10px] text-right text-orange-600 mt-1 leading-tight font-medium">
                                Harga Master: {formatRupiah(prod.harga)} <br/>
                                Harga Kontrak: {formatRupiah(item.unit_price)}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </td>
                      <td className="p-2 text-right font-mono font-medium">{formatRupiah(item.qty_ordered * item.unit_price)}</td>
                      <td className="p-2 text-center">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleRemoveItem(idx)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {formData.items.length > 0 && (
                    <tr className="bg-slate-50 font-semibold border-t">
                      <td colSpan="3" className="p-2 text-right">Computed Contract Value:</td>
                      <td className="p-2 text-right font-mono text-sm text-[#0A6ED1]">{formatRupiah(formData.nilai)}</td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button size="sm" className="bg-[#0A6ED1] hover:bg-[#0854A1]" onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAIL MODAL WITH AUDIT TIMELINE */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2 font-display">
                Sales Order Detail: <span className="text-[#0A6ED1] font-mono">{selectedOrder?.no}</span>
              </DialogTitle>
              <DialogDescription>Detailed order information, items, snapshots, and action log timeline.</DialogDescription>
            </div>
            <div>
              <StatusBadge status={selectedOrder?.status} />
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
            {/* Metadata Info Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-md border border-[#EEF0F2]">
                <div>
                  <span className="text-xs text-[#59687A] block">Customer</span>
                  <span className="text-sm font-semibold text-[#1C252E]">{selectedOrder?.customer?.nama}</span>
                </div>
                <div>
                  <span className="text-xs text-[#59687A] block">SO Type</span>
                  <span className="text-sm font-semibold text-[#1C252E]">{selectedOrder?.so_type === "MTO" ? "Make to Order" : "Make to Stock"}</span>
                </div>
                <div>
                  <span className="text-xs text-[#59687A] block">Priority</span>
                  <span className="text-sm font-semibold text-[#1C252E]">{selectedOrder?.prioritas}</span>
                </div>
                <div>
                  <span className="text-xs text-[#59687A] block">Order Date</span>
                  <span className="text-sm font-semibold text-[#1C252E] font-mono-num">{selectedOrder?.tgl_order}</span>
                </div>
                <div>
                  <span className="text-xs text-[#59687A] block">Delivery Target</span>
                  <span className="text-sm font-semibold text-[#1C252E] font-mono-num">{selectedOrder?.tgl_kirim}</span>
                </div>
                <div>
                  <span className="text-xs text-[#59687A] block">Contract Value</span>
                  <span className="text-sm font-semibold text-[#0A6ED1] font-mono-num">{formatRupiah(selectedOrder?.nilai)}</span>
                </div>
                {selectedOrder?.catatan && (
                  <div className="col-span-full border-t pt-2 mt-2">
                    <span className="text-xs text-[#59687A] block">General Notes</span>
                    <p className="text-xs text-[#1C252E] whitespace-pre-wrap">{selectedOrder?.catatan}</p>
                  </div>
                )}
              </div>

              {/* Production Readiness Panel */}
              <div className="bg-white border border-[#DFE3E8] p-4 rounded-md shadow-sm space-y-3">
                <div className="text-sm font-semibold text-[#1C252E] border-b pb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#0A6ED1]" /> Production Readiness Gate
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {/* Product Master */}
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-[#1C252E]">Product Master</span>
                  </div>

                  {/* Customer */}
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-[#1C252E]">Customer</span>
                  </div>

                  {/* BOM Active */}
                  {(() => {
                    const allActive = selectedOrder?.items?.every(item => item.bom_health?.status === 'active');
                    const hasDraft = selectedOrder?.items?.some(item => item.bom_health?.status === 'draft');
                    if (allActive) {
                      return (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-[#1C252E]">BOM Active</span>
                        </div>
                      );
                    } else if (hasDraft) {
                      return (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="text-amber-700 font-medium">BOM Draft</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-700 font-medium">BOM Not Ready</span>
                        </div>
                      );
                    }
                  })()}

                  {/* Active BOM Locked */}
                  {(() => {
                    const allLocked = selectedOrder?.items?.every(item => item.bom_header_id !== null);
                    if (allLocked) {
                      return (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-[#1C252E]">Active BOM Locked</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-700 font-medium">BOM Not Locked</span>
                        </div>
                      );
                    }
                  })()}

                  {/* Material Formula */}
                  {(() => {
                    const allActive = selectedOrder?.items?.every(item => item.bom_health?.status === 'active');
                    if (allActive) {
                      return (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-[#1C252E]">Material Formula</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-700 font-medium">Formula Empty</span>
                        </div>
                      );
                    }
                  })()}

                  {/* Demand Not Generated */}
                  {selectedOrder?.demands?.length === 0 ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-[#1C252E]">Demand Not Generated</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800 font-medium">Demand Generated</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Snapshot Table */}
              <div>
                <span className="text-sm font-semibold text-[#1C252E] block mb-2">Ordered Items & Historical Snapshots</span>
                <div className="border border-[#DFE3E8] rounded-md overflow-hidden">
                  <table className="w-full text-xs bg-white">
                    <thead className="bg-[#F4F6F8] border-b">
                      <tr>
                        <th className="p-3 text-left font-semibold text-[#59687A]">Product Snapshot</th>
                        <th className="p-3 text-right font-semibold text-[#59687A] w-20">Qty</th>
                        <th className="p-3 text-right font-semibold text-[#59687A] w-28">Price Snapshot</th>
                        <th className="p-3 text-right font-semibold text-[#59687A] w-28">Est. Vol / Wt</th>
                        <th className="p-3 text-left font-semibold text-[#59687A] w-36">BOM Health Status</th>
                        <th className="p-3 text-center font-semibold text-[#59687A] w-24">BOM Lock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder?.items?.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-3">
                            <span className="font-mono text-xs font-semibold block text-[#1C252E]">
                              {item.product_code_snapshot || item.product?.kode}
                            </span>
                            <span className="text-xs text-[#59687A]">
                              {item.product_name_snapshot || item.product?.nama}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono-num font-semibold">
                            {Number(item.qty_ordered)} {item.unit_snapshot || item.product?.satuan}
                          </td>
                          <td className="p-3 text-right font-mono-num text-[#1C252E]">
                            {formatRupiah(item.unit_price)}
                          </td>
                          <td className="p-3 text-right text-xs">
                            <div className="font-mono-num text-[#1C252E]">{Number(item.estimated_volume || 0).toFixed(2)} m³</div>
                            <div className="font-mono-num text-[#59687A]">{Number(item.estimated_weight || 0).toLocaleString()} kg</div>
                          </td>
                          <td className="p-3">
                            {(() => {
                              const health = item.bom_health || { status: 'none', label: 'No Active BOM' };
                              if (health.status === 'active') {
                                return (
                                  <div>
                                    <span className="bg-[#E6F4EA] text-[#137333] px-2 py-0.5 rounded text-[10px] font-semibold border border-[#CEEAD6] inline-block mb-1">
                                      ✓ {health.label}
                                    </span>
                                  </div>
                                );
                              } else if (health.status === 'draft') {
                                return (
                                  <div>
                                    <span className="bg-[#FEF7E0] text-[#B06000] px-2 py-0.5 rounded text-[10px] font-semibold border border-[#FEEFC3] inline-block mb-1">
                                      ⚠ {health.label}
                                    </span>
                                  </div>
                                );
                              } else {
                                return (
                                  <div>
                                    <span className="bg-[#FCE8E6] text-[#C5221F] px-2 py-0.5 rounded text-[10px] font-semibold border border-[#FAD2CF] inline-block mb-1">
                                      ⚠ {health.label}
                                    </span>
                                  </div>
                                );
                              }
                            })()}
                          </td>

                          {/* BOM Lock column */}
                          <td className="p-3 text-center">
                            {item.bom_header_id ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <Lock className="w-5 h-5 text-green-600" />
                                <span className="text-[10px] text-green-700 font-semibold">
                                  {item.bom_version_snapshot ?? 'Locked'}
                                </span>
                              </div>
                            ) : item.bom_health?.status === 'active' && canManage && !['Planning','Production','Completed','Delivered','Cancelled'].includes(selectedOrder?.status) ? (
                              <button
                                onClick={() => handleLockBom(selectedOrder)}
                                title={`Klik untuk kunci BOM aktif ke item ini`}
                                className="flex flex-col items-center gap-0.5 group mx-auto"
                              >
                                <LockOpen className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" />
                                <span className="text-[10px] text-red-500 group-hover:text-red-700 font-semibold transition-colors">Klik Lock</span>
                              </button>
                            ) : (
                              <div className="flex flex-col items-center gap-0.5">
                                <LockOpen className="w-5 h-5 text-slate-300" />
                                <span className="text-[10px] text-slate-400">
                                  {item.bom_health?.status === 'draft' ? 'BOM Draft' : 'No BOM'}
                                </span>
                              </div>
                            )}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Timeline Audit Logs column */}
            <div className="border border-[#DFE3E8] p-4 rounded-md bg-slate-50 flex flex-col h-[480px] shadow-sm">
              <div className="flex items-center gap-1.5 border-b pb-2 mb-3">
                <History className="w-4 h-4 text-[#0A6ED1]" />
                <span className="text-sm font-semibold text-[#1C252E]">Audit & State Timeline</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {auditLogs.length === 0 ? (
                  <div className="text-center text-xs text-[#59687A] py-8 italic">No audit records found.</div>
                ) : (
                  auditLogs.map((log) => {
                    let logTitle = log.action;
                    let logColor = "bg-[#EEF0F2]";
                    
                    if (log.action === "sales_order.created") {
                      logTitle = "Draft Created";
                      logColor = "bg-slate-200 text-slate-800";
                    } else if (log.action === "sales_order.submitted") {
                      logTitle = "SO Submitted";
                      logColor = "bg-blue-100 text-blue-800";
                    } else if (log.action === "sales_order.approved") {
                      logTitle = "Approved by Manager";
                      logColor = "bg-green-100 text-green-800";
                    } else if (log.action === "sales_order.rejected") {
                      logTitle = "Rejected by Manager";
                      logColor = "bg-red-100 text-red-800";
                    } else if (log.action === "sales_order.planning_generated") {
                      logTitle = "PPIC Generated Demands";
                      logColor = "bg-purple-100 text-purple-800";
                    } else if (log.action === "sales_order.cancelled") {
                      logTitle = "SO Cancelled";
                      logColor = "bg-gray-200 text-gray-800";
                    } else if (log.action === "sales_order.demand_generation_failed") {
                      logTitle = "Demand Generation Failed";
                      logColor = "bg-rose-100 text-rose-800 border border-rose-200";
                    }

                    return (
                      <div key={log.id} className="relative pl-4 border-l border-slate-300 pb-1">
                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-400 border border-white" />
                        <div className="text-xs">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold block w-fit mb-1 ${logColor}`}>
                            {logTitle}
                          </span>
                          <span className="font-semibold text-[#1C252E] block">{log.user?.username || "System"}</span>
                          <span className="text-[10px] text-[#59687A] block font-mono-num">
                            {new Date(log.created_at).toLocaleString("id-ID")}
                          </span>
                          {log.new_values?.reason && (
                            <div className="mt-1 bg-red-50 text-red-700 p-1.5 rounded border border-red-100 text-[11px] font-medium leading-tight">
                              <strong>Detail:</strong> {log.new_values.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4 flex items-center justify-between sm:justify-between w-full">
            <div>
              {/* Creator Edit Trigger */}
              {canManage && ["Draft", "Rejected"].includes(selectedOrder?.status) && (
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(selectedOrder)}>
                  Edit Draft
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDetailDialog(false)}>
                Close
              </Button>

              {/* Creator Submission */}
              {canManage && ["Draft", "Rejected"].includes(selectedOrder?.status) && (
                <Button size="sm" className="bg-[#0A6ED1] text-white" onClick={() => handleSubmit(selectedOrder)}>
                  Submit for Approval
                </Button>
              )}

              {/* Manager Actions */}
              {canApprove && selectedOrder?.status === "Submitted" && (
                <>
                  <Button size="sm" variant="destructive" onClick={() => handleOpenReject(selectedOrder)}>
                    Reject
                  </Button>
                  <Button size="sm" className="bg-[#00A854] hover:bg-[#008F47] text-white" onClick={() => handleApprove(selectedOrder)}>
                    Approve
                  </Button>
                </>
              )}

              {/* PPIC Demand Action */}
              {canPlan && selectedOrder?.status === "Approved" && (
                <Button size="sm" className="bg-[#8A2BE2] hover:bg-[#7A1ED2] text-white" onClick={() => handleGenerateDemand(selectedOrder)}>
                  Generate Production Demands
                </Button>
              )}

              {/* Cancel Button */}
              {((canManage && ["Draft", "Submitted", "Rejected"].includes(selectedOrder?.status)) ||
                (canApprove && ["Approved"].includes(selectedOrder?.status))) && (
                <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700" onClick={() => handleCancel(selectedOrder)}>
                  Cancel Order
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECTION REASON DIALOG */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Sales Order</DialogTitle>
            <DialogDescription>Please provide the reasons for rejecting this sales order. The sales agent will be notified to correct it.</DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              required
              rows="3"
              className="mt-2 text-xs"
              placeholder="e.g. Contract value pricing incorrect, UOM quantities do not match active inventory capacity..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button size="sm" variant="destructive" onClick={handleReject}>Reject Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesOrders;
