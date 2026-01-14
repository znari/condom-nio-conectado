import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Public pages
import Auth from "./pages/Auth";
import Register from "./pages/Register";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCondominiums from "./pages/admin/AdminCondominiums";

// Manager pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import Providers from "./pages/manager/Providers";
import ServiceCalls from "./pages/manager/ServiceCalls";
import ServiceCallNew from "./pages/manager/ServiceCallNew";
import ServiceCallDetails from "./pages/manager/ServiceCallDetails";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cadastro" element={<Register />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/condominios"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <AdminCondominiums />
                </ProtectedRoute>
              }
            />

            {/* Manager Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chamados"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <ServiceCalls />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chamados/novo"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <ServiceCallNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chamados/:id"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <ServiceCallDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prestadores"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <Providers />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
