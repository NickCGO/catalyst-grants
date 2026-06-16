import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useAnalytics } from "./hooks/useAnalytics";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import GrantsPage from "./pages/GrantsPage";
import FunderDetailPage from "./pages/FunderDetailPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import ProposalListPage from "./pages/ProposalListPage";
import ProposalEditorPage from "./pages/ProposalEditorPage";
import ReportsPage from "./pages/ReportsPage";
import EmailHubPage from "./pages/EmailHubPage";
import NewsPage from "./pages/NewsPage";
import SettingsPage from "./pages/SettingsPage";
import TeamManagementPage from "./pages/TeamManagementPage";
import TasksPage from "./pages/TasksPage";
import CRMPage from "./pages/CRMPage";
import CRMDetailPage from "./pages/CRMDetailPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import PartnershipsPage from "./pages/PartnershipsPage";
import PartnershipWorkspacePage from "./pages/PartnershipWorkspacePage";
import NGOPublicProfilePage from "./pages/NGOPublicProfilePage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import SupportChatWidget from "./components/SupportChatWidget";
import InboxPage from "./pages/InboxPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import HelpFloatingButton from "./components/HelpFloatingButton";
import ProductTour from "./components/ProductTour";
import HelpLayout from "./pages/help/HelpLayout";
import HelpOverview from "./pages/help/HelpOverview";
import {
  HelpDashboard, HelpGrants, HelpApplications, HelpProposals, HelpTasks,
  HelpCRM, HelpInbox, HelpReports, HelpTeam, HelpSettings, HelpFAQ,
} from "./pages/help/HelpPages";
import PricingPage from "./pages/PricingPage";
import CheckoutReturnPage from "./pages/CheckoutReturnPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";

const queryClient = new QueryClient();

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/privacy", "/terms"];

const AnalyticsTracker = () => {
  useAnalytics();
  return null;
};

const PublicChatMount = () => {
  const location = useLocation();
  if (!PUBLIC_ROUTES.includes(location.pathname)) return null;
  return <SupportChatWidget />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnalyticsTracker />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />

          {/* Onboarding */}
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/onboarding/complete" element={<OnboardingPage />} />

          {/* Core App */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/grants" element={<GrantsPage />} />
          <Route path="/grants/:id" element={<FunderDetailPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/writer" element={<ProposalListPage />} />
          <Route path="/writer/new" element={<ProposalEditorPage />} />
          <Route path="/writer/:id" element={<ProposalEditorPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/new" element={<ReportsPage />} />
          <Route path="/reports/:id" element={<ReportsPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/email" element={<EmailHubPage />} />

          {/* Phase 3 */}
          <Route path="/crm" element={<CRMPage />} />
          <Route path="/crm/:funderId" element={<CRMDetailPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/partnerships" element={<PartnershipsPage />} />
          <Route path="/partnerships/discover" element={<PartnershipsPage />} />
          <Route path="/partnerships/requests" element={<PartnershipsPage />} />
          <Route path="/partnerships/new" element={<PartnershipsPage />} />
          <Route path="/partnerships/profile/:orgId" element={<NGOPublicProfilePage />} />
          <Route path="/partnerships/:id" element={<PartnershipWorkspacePage />} />

          {/* Inbox */}
          <Route path="/inbox" element={<InboxPage />} />

          {/* Settings */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/team" element={<TeamManagementPage />} />
          <Route path="/settings/notifications" element={<SettingsPage />} />
          <Route path="/settings/ai" element={<SettingsPage />} />
          <Route path="/settings/modules" element={<SettingsPage />} />
          <Route path="/settings/billing" element={<SettingsPage />} />

          {/* Legacy routes */}
          <Route path="/team" element={<TeamManagementPage />} />
          <Route path="/tasks" element={<TasksPage />} />

          {/* Invitations */}
          <Route path="/accept-invite" element={<AcceptInvitePage />} />

          {/* Billing */}
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/checkout/return" element={<CheckoutReturnPage />} />

          {/* Legal */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Help center */}
          <Route path="/help" element={<HelpLayout />}>
            <Route index element={<HelpOverview />} />
            <Route path="dashboard" element={<HelpDashboard />} />
            <Route path="grants" element={<HelpGrants />} />
            <Route path="applications" element={<HelpApplications />} />
            <Route path="proposals" element={<HelpProposals />} />
            <Route path="tasks" element={<HelpTasks />} />
            <Route path="crm" element={<HelpCRM />} />
            <Route path="inbox" element={<HelpInbox />} />
            <Route path="reports" element={<HelpReports />} />
            <Route path="team" element={<HelpTeam />} />
            <Route path="settings" element={<HelpSettings />} />
            <Route path="faq" element={<HelpFAQ />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<AdminPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        <PublicChatMount />
        <HelpFloatingButton />
        <ProductTour />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
