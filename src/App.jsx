import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Check, AlertTriangle, AlertCircle, Library, X } from 'lucide-react';

import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import SaoDashboard from './pages/SaoDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Profile from './pages/Profile';

// Global Overlays: Handles the Loading Screen and Toasts across ALL routes
const GlobalOverlays = () => {
  const { toast, clearToast, isAuthReady } = useApp();
  
  return (
    <>
      {/* Smooth Branded Loading Screen (Replaces White Flash) */}
      {!isAuthReady && (
        <div className="fixed inset-0 z-[300] bg-gray-50 dark:bg-[#182433] flex flex-col items-center justify-center transition-colors">
          <div className="bg-gradient-to-br from-tabler-primary to-[#8b5cf6] text-white p-3 rounded-2xl shadow-lg mb-6 animate-pulse">
            <Library className="w-10 h-10" />
          </div>
          <div className="w-48 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-tabler-primary w-1/2 rounded-full animate-[ping_1.5s_ease-in-out_infinite] origin-left"></div>
          </div>
          <p className="mt-4 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase">Initializing Workspace...</p>
        </div>
      )}

      {/* UPGRADED: Modern Non-Blocking Bottom-Right Toast System */}
      {toast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[200] animate-in slide-in-from-bottom-5 sm:slide-in-from-right-8 fade-in duration-300">
          <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-xl p-4 flex items-start gap-4 max-w-sm w-full pointer-events-auto">
            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              toast.type === 'success' ? 'bg-tabler-success/10 text-tabler-success' : 
              toast.type === 'warning' ? 'bg-tabler-warning/10 text-tabler-warning' : 
              'bg-tabler-danger/10 text-tabler-danger'
            }`}>
              {toast.type === 'success' ? <Check className="w-5 h-5" /> : toast.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {toast.type === 'success' ? 'Success' : toast.type === 'warning' ? 'Attention' : 'Error'}
              </h3>
              <p className="text-xs text-gray-600 dark:text-tabler-muted mt-1 leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={clearToast} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Route Guards uses isAuthReady instead of isLoading
const ProtectedRoute = ({ children }) => {
  const { user, isAuthReady } = useApp();
  if (!isAuthReady) return null; // Overlays handles visual loading
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AuthRoute = ({ children }) => {
  const { user, isAuthReady } = useApp();
  if (!isAuthReady) return null; // Prevents unmounting Login mid-flight
  if (user) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

const HomeRedirect = () => {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
};

export default function App() {
  return (
    <AppProvider>
      <GlobalOverlays />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/sao" element={<SaoDashboard />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}