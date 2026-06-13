import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import MasterData from "@/pages/MasterData";
import MasterBOM from "@/pages/MasterBOM";
import ProductionPlanning from "@/pages/ProductionPlanning";
import SalesOrders from "@/pages/SalesOrders";
import DeliveryOrders from "@/pages/DeliveryOrders";
import ProductionExecution from "@/pages/ProductionExecution";
import ProductionWorkOrder from "@/pages/ProductionWorkOrder";
import CuringManagement from "@/pages/CuringManagement";
import QualityControl from "@/pages/QualityControl";
import Inventory from "@/pages/Inventory";
import Reports from "@/pages/Reports";
import MasterProcess from "@/pages/MasterProcess";
import UserAccessManagement from "@/pages/UserAccessManagement";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route element={<ProtectedRoute permission="dashboard.view" />}>
                <Route path="/" element={<Dashboard />} />
              </Route>
              <Route element={<ProtectedRoute permission="master-data.view" />}>
                <Route path="/master-data" element={<MasterData />} />
              </Route>
              <Route element={<ProtectedRoute permission="master-bom.view" />}>
                <Route path="/master-bom" element={<MasterBOM />} />
              </Route>
              <Route element={<ProtectedRoute permission="master-process.view" />}>
                <Route path="/master-process" element={<MasterProcess />} />
              </Route>
              <Route element={<ProtectedRoute permission="planning.view" />}>
                <Route path="/planning" element={<ProductionPlanning />} />
              </Route>
              <Route element={<ProtectedRoute permission="work-orders.view" />}>
                <Route path="/work-orders" element={<ProductionExecution />} />
              </Route>
              <Route element={<ProtectedRoute permission="sales.view" />}>
                <Route path="/sales" element={<SalesOrders />} />
              </Route>
              <Route element={<ProtectedRoute permission="delivery.view" />}>
                <Route path="/delivery" element={<DeliveryOrders />} />
              </Route>
              <Route element={<ProtectedRoute permission="production-execution.view" />}>
                <Route path="/production-execution" element={<ProductionWorkOrder />} />
              </Route>
              <Route element={<ProtectedRoute permission="curing.view" />}>
                <Route path="/curing" element={<CuringManagement />} />
              </Route>
              <Route element={<ProtectedRoute permission="quality.view" />}>
                <Route path="/quality" element={<QualityControl />} />
              </Route>
              <Route element={<ProtectedRoute permission="inventory.view" />}>
                <Route path="/inventory" element={<Inventory />} />
              </Route>
              <Route element={<ProtectedRoute permission="reports.view" />}>
                <Route path="/reports" element={<Reports />} />
              </Route>
              <Route element={<ProtectedRoute permission="user-access.manage" />}>
                <Route path="/user-access" element={<UserAccessManagement />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}

export default App;
