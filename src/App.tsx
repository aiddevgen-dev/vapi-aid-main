import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { EcommerceLayout } from "./components/EcommerceLayout";
import { UnifiedAgentDashboard } from "./components/UnifiedAgentDashboard";
import { CompanyDashboard } from "./pages/CompanyDashboard";
import { PinkMobileDashboard } from "./pages/PinkMobileDashboard";
import { Auth } from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute requiredRole="customer">
                <EcommerceLayout />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/agent"
            element={
              <ProtectedRoute requiredRole="agent">
                <UnifiedAgentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company"
            element={
              <ProtectedRoute requiredRole="company">
                <CompanyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pink-mobile"
            element={
              <ProtectedRoute requiredRole="agent">
                <PinkMobileDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
