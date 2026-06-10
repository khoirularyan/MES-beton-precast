import { useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Search, Plus, Filter, Download, MoreVertical, Edit, CheckCircle, AlertCircle, Circle, Wrench } from "lucide-react";

// Mock data for Production Execution
const workOrders = [
  {
    no: "WO-2023-0891",
    produk: "PC Girder G40 High-Strength",
    batch: "Batch #A-22",
    qty: 120,
    status: "IN PROGRESS",
    progress: 75,
    startDate: "Oct 12",
    dueDate: "Oct 28",
    timeline: { start: "Oct 12", end: "Oct 28" },
    materials: [
      { name: "Cement Type V (High Res)", required: 24000, unit: "KG", status: "OK" },
      { name: "Steel Rebar Ø22mm", required: 12500, unit: "TONS", status: "OK" },
      { name: "Admixture Poly-88", required: 450, unit: "Liters", status: "SHORT", shortage: 20 }
    ],
    routingSteps: [
      { no: 1, name: "Reinforcement Cage Assembly", status: "completed" }
    ]
  },
  {
    no: "WO-2023-0892",
    produk: "Precast Pile D600",
    batch: "Project: LRT Jkt",
    qty: 450,
    status: "DELAYED",
    progress: 40,
    startDate: "Oct 10",
    dueDate: "Oct 20",
    timeline: { start: "Oct 10", end: "Oct 20" },
    materials: [
      { name: "Cement", required: 18000, unit: "KG", status: "OK" },
      { name: "Steel", required: 8500, unit: "TONS", status: "OK" }
    ],
    routingSteps: [
      { no: 1, name: "Batching", status: "completed" },
      { no: 2, name: "Casting", status: "in-progress" }
    ]
  },
  {
    no: "WO-2023-0895",
    produk: "Box Culvert 2000",
    batch: "Internal Stock",
    qty: 80,
    status: "SCHEDULED",
    progress: 0,
    startDate: "Oct 15",
    dueDate: "Nov 05",
    timeline: { start: "Oct 15", end: "Nov 05" },
    materials: [
      { name: "Cement", required: 12000, unit: "KG", status: "OK" }
    ],
    routingSteps: []
  },
  {
    no: "WO-2023-0901",
    produk: "U-Ditch 400×400",
    batch: "Batch: #S-12",
    qty: 1200,
    status: "QUEUED",
    progress: 0,
    startDate: "Oct 18",
    dueDate: "Nov 12",
    timeline: { start: "Oct 18", end: "Nov 12" },
    materials: [
      { name: "Cement", required: 15000, unit: "KG", status: "OK" }
    ],
    routingSteps: []
  }
];

const workOrderStats = {
  openWO: { value: 42, change: "+12% vs LW", trend: "up" },
  closedWO: { value: 128, target: "88% Target", progress: 88 },
  delayedWO: { value: 5, status: "Critical" },
  wipWO: { value: 24, status: "Active Lines" }
};

const ProductionWorkOrder = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWO, setSelectedWO] = useState(null);
  const [showWODetail, setShowWODetail] = useState(false);
  const [showCreateWO, setShowCreateWO] = useState(false);

  const handleViewDetails = (wo) => {
    setSelectedWO(wo);
    setShowWODetail(true);
  };

  const handleCreateWO = () => {
    setShowCreateWO(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "IN PROGRESS": return <Wrench className="w-4 h-4 text-blue-600" />;
      case "DELAYED": return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "SCHEDULED": return <Circle className="w-4 h-4 text-gray-400" />;
      case "QUEUED": return <Circle className="w-4 h-4 text-gray-400" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "IN PROGRESS": return "default";
      case "DELAYED": return "destructive";
      case "SCHEDULED": return "secondary";
      case "QUEUED": return "outline";
      default: return "outline";
    }
  };

  return (
    <div>
      <PageHeader
        title="Production Execution"
        subtitle="Manage and track concrete precast manufacturing cycles"
        breadcrumbs={["Home", "Production", "Production Execution"]}
        testId="work-order-page-header"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
            <Button 
              size="sm" 
              className="bg-[#1E293B] hover:bg-[#0F172A] text-white"
              onClick={handleCreateWO}
            >
              <Plus className="w-3.5 h-3.5" />
              New Production Execution
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-600 mb-1">Open WO</div>
                <div className="text-3xl font-bold text-[#1E293B]">{workOrderStats.openWO.value}</div>
                <div className="text-xs text-green-600 mt-1 font-medium">{workOrderStats.openWO.change}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                {getStatusIcon("IN PROGRESS")}
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-white border-green-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-600 mb-1">Closed WO</div>
                <div className="text-3xl font-bold text-[#1E293B]">{workOrderStats.closedWO.value}</div>
                <div className="text-xs text-gray-600 mt-1">{workOrderStats.closedWO.target}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-red-50 to-white border-red-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-600 mb-1">Delayed WO</div>
                <div className="text-3xl font-bold text-[#1E293B]">{workOrderStats.delayedWO.value}</div>
                <div className="text-xs text-red-600 mt-1 font-medium">{workOrderStats.delayedWO.status}</div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-white border-purple-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-600 mb-1">WIP WO</div>
                <div className="text-3xl font-bold text-[#1E293B]">{workOrderStats.wipWO.value}</div>
                <div className="text-xs text-gray-600 mt-1">{workOrderStats.wipWO.status}</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Production Execution Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                ACTIVE PRODUCTION EXECUTION
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search Production Execution, Products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-64 text-sm"
                />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    WO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {workOrders.map((wo, index) => (
                  <tr 
                    key={wo.no} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(wo)}
                  >
                    <td className="px-4 py-4">
                      <div className="font-mono font-semibold text-sm text-blue-600">{wo.no}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-sm text-gray-900">{wo.produk}</div>
                      <div className="text-xs text-gray-500">{wo.batch}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-mono font-semibold text-sm">{wo.qty}</div>
                      <div className="text-xs text-gray-500">Units</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-gray-600">▶ {wo.startDate}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-red-600">🕒 {wo.dueDate}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              wo.status === "DELAYED" ? "bg-red-500" : 
                              wo.progress >= 75 ? "bg-green-500" : 
                              wo.progress > 0 ? "bg-blue-500" : "bg-gray-300"
                            }`}
                            style={{ width: `${wo.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold font-mono w-10 text-right">{wo.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={getStatusBadgeVariant(wo.status)} className="font-medium">
                        {wo.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(wo);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Work Order Detail Dialog */}
      <Dialog open={showWODetail} onOpenChange={setShowWODetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedWO && (
            <>
              <DialogHeader className="bg-gradient-to-r from-gray-900 to-gray-700 text-white p-6 -m-6 mb-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-2xl font-bold">{selectedWO.no}</DialogTitle>
                    <DialogDescription className="text-gray-300 mt-1">
                      {selectedWO.produk} | {selectedWO.batch}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="materials">Materials</TabsTrigger>
                  <TabsTrigger value="routing">Routing</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="text-xs text-gray-600 mb-2">Quantity</div>
                      <div className="text-2xl font-bold">{selectedWO.qty} Units</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-xs text-gray-600 mb-2">Progress</div>
                      <div className="text-2xl font-bold">{selectedWO.progress}%</div>
                      <Progress value={selectedWO.progress} className="mt-2" />
                    </Card>
                  </div>

                  <Card className="p-4">
                    <div className="text-sm font-semibold mb-3">Timeline</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-gray-600">Start Date</div>
                        <div className="font-medium">{selectedWO.startDate}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Due Date</div>
                        <div className="font-medium">{selectedWO.dueDate}</div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="text-sm font-semibold mb-3">Status</div>
                    <Badge variant={getStatusBadgeVariant(selectedWO.status)} className="text-sm">
                      {selectedWO.status}
                    </Badge>
                  </Card>
                </TabsContent>

                <TabsContent value="materials" className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold">📦 MATERIAL REQUIREMENT</div>
                    <Button variant="outline" size="sm">Auto-populate from BOM</Button>
                  </div>
                  
                  {selectedWO.materials.map((material, idx) => (
                    <Card key={idx} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{material.name}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            REQ: {material.required.toLocaleString()} {material.unit}
                          </div>
                        </div>
                        <div>
                          {material.status === "OK" ? (
                            <Badge variant="success" className="bg-green-100 text-green-700">
                              ✓ IN STOCK
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-100 text-red-700">
                              SHORT {material.shortage}L
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="routing" className="space-y-3">
                  <div className="text-sm font-semibold mb-3">🛣️ ROUTING STEPS</div>
                  
                  {selectedWO.routingSteps.length > 0 ? (
                    selectedWO.routingSteps.map((step, idx) => (
                      <Card key={idx} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {step.no}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{step.name}</div>
                          </div>
                          <div>
                            {step.status === "completed" ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : step.status === "in-progress" ? (
                              <Wrench className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No routing steps defined yet
                    </div>
                  )}

                  <Button variant="outline" className="w-full">
                    Report Output
                  </Button>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Work Order Dialog */}
      <Dialog open={showCreateWO} onOpenChange={setShowCreateWO}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Work Order</DialogTitle>
            <DialogDescription>
              Configure production parameters and verify material availability.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Work Order Number</Label>
                <Input 
                  value="WO-2026-0624-001" 
                  disabled 
                  className="bg-gray-100"
                />
                <div className="text-xs text-gray-500">System generated unique identifier.</div>
              </div>
              <div className="space-y-2">
                <Label>Plant Selection *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plant..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plant1">Plant 1 - Cikarang</SelectItem>
                    <SelectItem value="plant2">Plant 2 - Karawang</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Product Selection *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Search product..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product1">Precast Concrete U-Ditch 600×600×1200</SelectItem>
                  <SelectItem value="product2">PC Girder G40</SelectItem>
                  <SelectItem value="product3">Box Culvert 2000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity (Units) *</Label>
                <Input type="number" placeholder="250" />
              </div>
              <div className="space-y-2">
                <Label>Priority Level</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">NORMAL</Button>
                  <Button variant="outline" size="sm" className="flex-1">HIGH</Button>
                  <Button variant="outline" size="sm" className="flex-1 border-red-500 text-red-600">URGENT</Button>
                </div>
              </div>
            </div>

            <Card className="p-4 bg-gray-900 text-white">
              <div className="text-sm font-semibold mb-3">PLANT CAPACITY</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div>Line A (Heavy Precast)</div>
                  <div className="font-mono">82%</div>
                </div>
                <Progress value={82} className="h-2" />
                
                <div className="flex items-center justify-between text-sm mt-3">
                  <div>Line B (Drainage)</div>
                  <div className="font-mono">45%</div>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div className="text-xs text-gray-400 mt-3">
                * Plant 1 has optimized throughput for U-Ditch variants. Allocation will prioritize Line B.
              </div>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateWO(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#1E293B] hover:bg-[#0F172A]"
              onClick={() => {
                toast.success("Work Order created successfully");
                setShowCreateWO(false);
              }}
            >
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductionWorkOrder;
