import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { useAuth } from "./hooks/useAuth";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminProjectManagement from "@/pages/admin/ProjectManagement";
import AdminSupportAdministration from "@/pages/admin/SupportAdministration";
import AdminUserManagement from "@/pages/admin/UserManagement";
import AdminPartnerManagement from "@/pages/admin/PartnerManagement";
import AnalyticsDashboard from "@/pages/admin/AnalyticsDashboard";
import ClientDashboard from "@/pages/ClientDashboard";
import PartnerDashboard from "@/pages/PartnerDashboard";
import PortfolioAdmin from "@/pages/PortfolioAdmin";
import ProjectsManagement from "@/pages/client/ProjectsManagement";
import SupportCenter from "@/pages/client/SupportCenter";
import BillingDashboard from "@/pages/client/BillingDashboard";
import EarningsManagement from "@/pages/partner/EarningsManagement";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import NotFound from "@/pages/not-found";
import { lazy } from "react";
import WorkModalitiesManagement from "@/pages/admin/WorkModalitiesManagement";
import InvoiceManagement from "@/pages/admin/InvoiceManagement";
import CompanyBillingInfo from "@/pages/admin/CompanyBillingInfo";
// Import the new BillingInformation component
import BillingInformation from "@/pages/client/BillingInformation";

function Router() {
  const { user, isLoading, error, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Clear invalid tokens
  if (error && localStorage.getItem("auth_token")) {
    localStorage.removeItem("auth_token");
    window.location.reload();
    return null;
  }

  return (
    <Switch>
      {/* Legal pages with Layout - MUST be before other routes */}
      <Route path="/terminos" component={TermsOfService} />
      <Route path="/privacidad" component={PrivacyPolicy} />
      <Route path="/cookies" component={CookiePolicy} />

      {/* Admin routes - NO Layout (they use DashboardLayout) */}
      <Route path="/admin/portfolio" component={() => <PortfolioAdmin />} />
      <Route path="/admin/work-modalities" component={() => <WorkModalitiesManagement />} />
      <Route path="/admin/analytics" component={() => <AnalyticsDashboard />} />
      <Route path="/admin/projects" component={AdminProjectManagement} />
      <Route path="/admin/support" component={AdminSupportAdministration} />
      <Route path="/admin/users" component={AdminUserManagement} />
      <Route path="/admin/partners" component={AdminPartnerManagement} />
      <Route path="/admin/invoices" component={() => <InvoiceManagement />} />
      <Route path="/admin/company-billing" component={() => <CompanyBillingInfo />} />
      <Route path="/admin" component={AdminDashboard} />

      {/* Client routes - NO Layout (they use DashboardLayout) */}
      <Route path="/client/projects" component={ProjectsManagement} />
      <Route path="/client/support" component={SupportCenter} />
      {/* Updated billing routes */}
      <Route path="/client/billing" component={BillingDashboard} />
      <Route path="/client/billing-info" component={BillingInformation} />
      <Route path="/client" component={ClientDashboard} />

      {/* Partner routes - NO Layout (they use DashboardLayout) */}
      <Route path="/partner/earnings" component={EarningsManagement} />
      <Route path="/partner" component={PartnerDashboard} />

      {/* Home page - MUST be last specific route */}
      {!user ? (
        <Route path="/" component={Landing} />
      ) : (
        <Route path="/" component={Dashboard} />
      )}

      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen">
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;