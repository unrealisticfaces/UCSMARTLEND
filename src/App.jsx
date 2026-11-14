import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Check, AlertTriangle, AlertCircle, Library } from 'lucide-react';

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

      {/* Global Toast System (Now visible on Login/Register) */}
      {toast && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in pointer-events-auto">
          <div className="bg-white border rounded-xl shadow-2xl max-w-sm w-full p-6 flex flex-col items-center text-center dark:bg-tabler-card dark:border-tabler-border animate-in zoom-in-95">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
              toast.type === 'success' ? 'bg-tabler-success/10 text-tabler-success' : 
              toast.type === 'warning' ? 'bg-tabler-warning/10 text-tabler-warning' : 
              'bg-tabler-danger/10 text-tabler-danger'
            }`}>
              {toast.type === 'success' ? <Check className="w-7 h-7" /> : toast.type === 'warning' ? <AlertTriangle className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{toast.type === 'success' ? 'Success!' : toast.type === 'warning' ? 'Attention' : 'Error'}</h3>
            <p className="text-sm text-gray-600 dark:text-tabler-muted mb-8">{toast.message}</p>
            <button onClick={clearToast} className="w-full py-2.5 bg-gray-100 dark:bg-tabler-body hover:bg-gray-200 dark:hover:bg-tabler-border/50 text-gray-800 dark:text-gray-200 rounded-md text-sm font-bold transition-colors">Continue</button>
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