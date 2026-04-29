import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { TeamProvider } from "@/contexts/TeamContext";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import DrillLibrary from "./pages/DrillLibrary";
import AutoPlan from "./pages/AutoPlan";
import Suggestions from "./pages/Suggestions";
import PracticePlan from "./pages/PracticePlan";
import RunPractice from "./pages/RunPractice";
import Feedback from "./pages/Feedback";
import Team from "./pages/Team";
import Discover from "./pages/Discover";
import Submit from "./pages/Submit";
import SettingsPage from "./pages/SettingsPage";
import DrillDetail from "./pages/DrillDetail";
import NotFound from "./pages/NotFound";
import UpgradePage from "./pages/UpgradePage";
import ResetPassword from "./pages/ResetPassword";
import PracticeTracker from "./pages/PracticeTracker";
const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/reset-password" element={<ResetPassword />} />    
    <Route
      path="/*"
      element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<AutoPlan />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/auto-plan" element={<Navigate to="/" replace />} />
              <Route path="/drills" element={<DrillLibrary />} />
              <Route path="/suggestions" element={<Suggestions />} />
              <Route path="/plan" element={<PracticePlan />} />
              <Route path="/run" element={<RunPractice />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/team" element={<Team />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/community" element={<Navigate to="/" replace />} />
              <Route path="/community/publish" element={<Navigate to="/" replace />} />
              <Route path="/community/profile/:userId" element={<Navigate to="/" replace />} />
              <Route path="/community/item/:itemId" element={<Navigate to="/" replace />} />
              <Route path="/submit" element={<Submit />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/practice-tracker" element={<PracticeTracker />} />              
              <Route path="/drill/:id" element={<DrillDetail />} />
              <Route path="/upgrade" element={<UpgradePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      }
    />   
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <TooltipProvider>
        <Toaster />
        <Sonner />
        {!isSupabaseConfigured ? (
          <div className="flex min-h-screen items-center justify-center bg-background px-6">
            <div className="max-w-lg rounded-lg border border-border bg-card p-6 text-center shadow-sm">
              <h1 className="text-2xl font-semibold text-foreground">Supabase configuration required</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                This app needs Supabase environment variables to load data and authenticate users. Set
                <span className="font-medium text-foreground"> VITE_SUPABASE_URL</span> and
                <span className="font-medium text-foreground"> VITE_SUPABASE_ANON_KEY</span>, then
                restart the dev server.
              </p>
            </div>
          </div>
        ) : (
          <BrowserRouter>
            <AuthProvider>
              <TeamProvider>
                <AppRoutes />
              </TeamProvider>
            </AuthProvider>
          </BrowserRouter>
        )}
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
