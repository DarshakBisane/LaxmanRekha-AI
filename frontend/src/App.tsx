import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Core Eager Pages
import { LoginPage } from './features/auth/LoginPage';
import { LandingPage } from './features/landing/LandingPage';
import { DashboardPage } from './features/dashboard/DashboardPage';

// Lazy Loaded Secondary Routes (Code Splitting)
const CasesListPage = lazy(() => import('./features/cases/CasesListPage').then(m => ({ default: m.CasesListPage })));
const CreateCasePage = lazy(() => import('./features/cases/CreateCasePage').then(m => ({ default: m.CreateCasePage })));
const CaseDetailPage = lazy(() => import('./features/cases/CaseDetailPage').then(m => ({ default: m.CaseDetailPage })));
const ReviewsPage = lazy(() => import('./features/reviews/ReviewsPage').then(m => ({ default: m.ReviewsPage })));
const AnalyticsPage = lazy(() => import('./features/analytics/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const AuditPage = lazy(() => import('./features/audit/AuditPage').then(m => ({ default: m.AuditPage })));
const UsersPage = lazy(() => import('./features/admin/UsersPage').then(m => ({ default: m.UsersPage })));
const SystemHealthPage = lazy(() => import('./features/admin/SystemHealthPage').then(m => ({ default: m.SystemHealthPage })));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));

const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center space-y-3 text-xs text-[#64748b]">
      <div className="w-8 h-8 border-3 border-[#4338ca] border-t-transparent rounded-full animate-spin"></div>
      <span>Loading module...</span>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-[#64748b]">
        Verifying bank officer session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#edf2f7] text-[#0f172a]">
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Auth & Portal */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />

            {/* Protected Bank Officer Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/cases" element={<ProtectedRoute><CasesListPage /></ProtectedRoute>} />
            <Route path="/cases/new" element={<ProtectedRoute><CreateCasePage /></ProtectedRoute>} />
            <Route path="/cases/:id" element={<ProtectedRoute><CaseDetailPage /></ProtectedRoute>} />
            <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute><AuditPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><UsersPage /></ProtectedRoute>} />
            <Route path="/admin/health" element={<ProtectedRoute><SystemHealthPage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

