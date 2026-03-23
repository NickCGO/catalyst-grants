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
import ApplicationsPage from "./pages/ApplicationsPage";
import ProposalListPage from "./pages/ProposalListPage";
import ProposalEditorPage from "./pages/ProposalEditorPage";
import ReportsPage from "./pages/ReportsPage";
import EmailHubPage from "./pages/EmailHubPage";
import NewsPage from "./pages/NewsPage";
import SettingsPage from "./pages/SettingsPage";
import TeamManagementPage from "./pages/TeamManagementPage";
import TasksPage from "./pages/TasksPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/grants" element={<GrantsPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/writer" element={<ProposalListPage />} />
          <Route path="/writer/new" element={<ProposalEditorPage />} />
          <Route path="/writer/:id" element={<ProposalEditorPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/email" element={<EmailHubPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/team" element={<TeamManagementPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
