import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { Suspense, lazy } from "react";
import { ThemeProvider } from "next-themes";
import { LoadingScreen } from "@/components/ErrorBoundary";

// Lazy load all routes for better performance
const IndexFallback = lazy(() => import("./pages/IndexFallback"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Demo = lazy(() => import("./pages/Demo"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PresidentSpace = lazy(() => import("./pages/PresidentSpace"));
const CabinetDirectorSpace = lazy(() => import("./pages/CabinetDirectorSpace"));
const PrivateCabinetDirectorSpace = lazy(() => import("./pages/PrivateCabinetDirectorSpace"));
const SecretariatGeneralSpace = lazy(() => import("./pages/SecretariatGeneralSpace"));
const ServiceCourriersSpace = lazy(() => import("./pages/ServiceCourriersSpace"));
const ServiceReceptionSpace = lazy(() => import("./pages/ServiceReceptionSpace"));
const IAstedConfig = lazy(() => import("./pages/IAstedConfig"));
const IAstedPage = lazy(() => import("./pages/IAstedPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const IAstedConfigWizard = lazy(() => import("./pages/IAstedConfigWizard"));

// Configuration optimisée de React Query avec cache intelligent
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache les données pendant 5 minutes par défaut
      staleTime: 5 * 60 * 1000,
      // Garde les données en cache pendant 10 minutes même si non utilisées
      gcTime: 10 * 60 * 1000,
      // Réessayer 1 fois en cas d'échec
      retry: 1,
      // Ne pas refetch automatiquement au focus de la fenêtre (économise les appels)
      refetchOnWindowFocus: false,
      // Ne pas refetch automatiquement au reconnect
      refetchOnReconnect: false,
      // Refetch en arrière-plan uniquement si les données sont stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry les mutations une fois en cas d'échec
      retry: 1,
    },
  },
});

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<IndexFallback />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/president-space" element={<PresidentSpace />} />
              <Route path="/cabinet-director-space" element={<CabinetDirectorSpace />} />
              <Route path="/private-cabinet-director-space" element={<PrivateCabinetDirectorSpace />} />
              <Route path="/secretariat-general-space" element={<SecretariatGeneralSpace />} />
              <Route path="/service-courriers-space" element={<ServiceCourriersSpace />} />
              <Route path="/service-reception-space" element={<ServiceReceptionSpace />} />
              <Route path="/iasted-config" element={<IAstedConfig />} />
              <Route path="/iasted-setup" element={<IAstedConfigWizard />} />
              <Route path="/iasted" element={<IAstedPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
