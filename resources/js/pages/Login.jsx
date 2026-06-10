import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Factory, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Login = () => {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <div className="text-sm text-[#59687A]">Checking user session...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={location.state?.from?.pathname ?? "/"} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(form);
      toast.success("Login successful", { description: "Your session and module access are active." });
      navigate(location.state?.from?.pathname ?? "/", { replace: true });
    } catch (error) {
      toast.error("Login failed", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F6F8] grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden lg:flex flex-col justify-between bg-[#0A6ED1] text-white p-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-white/15 flex items-center justify-center">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold leading-tight">PrecastMESSSS</div>
            <div className="text-xs text-white/75 uppercase tracking-wider">Manufacturing Execution System</div>
          </div>
        </div>
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded bg-white/12 px-3 py-1.5 text-xs font-medium mb-5">
            <ShieldCheck className="w-4 h-4" />
            Authentication & RBAC
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-normal">
            Plant operations access is controlled by role and responsibility.
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/80">
            Super admin manages all system, QC focuses on quality workflows, and standard users access daily operations.
          </p>
        </div>
        <div className="text-xs text-white/65">PT Megacon Bangun Perkasa</div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-[#DFE3E8] rounded-lg shadow-sm">
          <div className="p-6 border-b border-[#DFE3E8]">
            <div className="lg:hidden w-10 h-10 rounded bg-[#0A6ED1] text-white flex items-center justify-center mb-4">
              <Factory className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-[#1C252E]">Sign in to MES</h2>
            <p className="text-sm text-[#59687A] mt-1">Use a registered account to open modules based on your role.</p>
          </div>

          <form onSubmit={submit} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#59687A]" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="pl-9"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#59687A]" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="pl-9"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  required
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#59687A]">
              <Checkbox
                checked={form.remember}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, remember: Boolean(checked) }))}
              />
              Remember this session
            </label>
            <Button type="submit" className="w-full bg-[#0A6ED1] hover:bg-[#085caf]" disabled={submitting}>
              {submitting ? "Processing..." : "Sign In"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Login;
