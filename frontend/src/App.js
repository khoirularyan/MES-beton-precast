import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import MasterData from "@/pages/MasterData";
import ProductionPlanning from "@/pages/ProductionPlanning";
import ProductionOrders from "@/pages/ProductionOrders";
import ProductionExecution from "@/pages/ProductionExecution";
import CuringManagement from "@/pages/CuringManagement";
import QualityControl from "@/pages/QualityControl";
import Inventory from "@/pages/Inventory";
import Reports from "@/pages/Reports";
import MasterProcess from "@/pages/MasterProcess";
import BusinessFlow from "@/pages/BusinessFlow";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/business-flow" element={<BusinessFlow />} />
            <Route path="/master-data" element={<MasterData />} />
            <Route path="/master-process" element={<MasterProcess />} />
            <Route path="/planning" element={<ProductionPlanning />} />
            <Route path="/production-orders" element={<ProductionOrders />} />
            <Route path="/production-execution" element={<ProductionExecution />} />
            <Route path="/curing" element={<CuringManagement />} />
            <Route path="/quality" element={<QualityControl />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}

export default App;
