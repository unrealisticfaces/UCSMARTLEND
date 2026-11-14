import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Package, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const { showToast, resetPassword } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    try { await resetPassword(email); showToast('Password reset link sent.'); navigate('/login'); }
    catch (error) { showToast(error.message, 'error'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Package className="w-10 h-10 text-tabler-primary mb-2" />
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Forgot password</h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border dark:border-gray-700">
          <form className="space-y-6" onSubmit={handleReset}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
            </div>
            <button type="submit" className="w-full bg-tabler-primary text-white py-2 rounded-md font-medium">Send new password</button>
          </form>
          <div className="mt-6 text-center text-sm"><Link to="/login" className="flex items-center justify-center gap-1 text-gray-500"><ArrowLeft className="w-4 h-4" /> Back to sign in</Link></div>
        </div>
      </div>
    </div>
  );
}