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
const IAstedConfig = lazy(() => import("./pages/IAstedConfig"));
const IAstedPage = lazy(() => import("./pages/IAstedPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const IAstedConfigWizard = lazy(() => import("./pages/IAstedConfigWizard"));

const queryClient = new QueryClient();

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
