import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
