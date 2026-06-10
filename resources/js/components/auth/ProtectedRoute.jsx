import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const ProtectedRoute = ({ permission }) => {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <div className="text-sm text-[#59687A]">Checking user session...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasPermission(permission)) {
    return (
      <div className="min-h-full bg-[#F4F6F8] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-[#DFE3E8] rounded-lg p-6 text-center shadow-sm">
          <div className="w-11 h-11 rounded bg-[#FFF4E5] text-[#E9730C] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-semibold text-[#1C252E]">Module Access Restricted</h1>
          <p className="text-sm text-[#59687A] mt-2">
            Your role does not have permission to open this page.
          </p>
          <Button className="mt-5 bg-[#0A6ED1] hover:bg-[#085caf]" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
