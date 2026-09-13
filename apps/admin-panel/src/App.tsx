import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Rides from './pages/Rides';
import Drivers from './pages/Drivers';
import Places from './pages/Places';
import Pricing from './pages/Pricing';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import './index.css';

const queryClient = new QueryClient();

function ProtectedRoute() {
  const { admin, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-text-muted tracking-widest font-pixel text-xs">// INITIALIZING...</div>;
  if (!admin) return <Navigate to="/login" replace />;
  return <Layout />;
}

function PublicRoute() {
  const { admin } = useAuth();
  if (admin) return <Navigate to="/" replace />;
  return <Login />;
}

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/rides" element={<Rides />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/places" element={<Places />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
