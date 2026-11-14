import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Library, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function Register() {
  const { registerUser, showToast, isLoading, hasAdmin } = useApp();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student'); 
  const [agree, setAgree] = useState(false);

  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length > 5) score += 1;
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };
  const strength = calculateStrength(password);
  const strengthColors = ['bg-gray-200', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-tabler-success', 'bg-green-600'];

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!agree) return showToast('You must agree to the terms.', 'warning');
    if (password.length < 6) return showToast('Password must be at least 6 characters.', 'error');

    try {
      await registerUser(name, idNumber, email, password, role);
      showToast('Account successfully created! Logging you in...');
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      if (error.message === 'admin-exists') showToast('An Administrator already exists. Master account creation is locked.', 'error');
      else if (error.code === 'auth/email-already-in-use') showToast('This email is already registered. Please log in instead.', 'error');
      else if (error.code === 'auth/invalid-email') showToast('The email address is formatted incorrectly.', 'error');
      else showToast(`Registration failed: ${error.message}`, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="bg-gradient-to-br from-tabler-primary to-[#8b5cf6] text-white p-2 rounded-lg shadow-md mb-4">
          <Library className="w-8 h-8" />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Create new account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-tabler-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none cursor-pointer">
                <option value="student">Student Account</option>
                <option value="sao">SAO Staff Account</option>
                {!hasAdmin && <option value="admin">System Administrator (Setup)</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Identification Number (ID#)</label>
              <input type="text" placeholder="e.g. BSIT-12345" required value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full pl-3 pr-10 py-2 border rounded-md dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:border-tabler-primary transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-tabler-primary">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div key={level} className={`flex-1 h-full transition-all duration-300 ${strength >= level ? strengthColors[strength] : 'bg-transparent'}`}></div>
                    ))}
                  </div>
                  {strength >= 4 && <ShieldCheck className="w-3.5 h-3.5 text-tabler-success shrink-0" />}
                </div>
              )}
            </div>
            <div className="flex items-center">
              <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-tabler-primary cursor-pointer" />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Agree to the terms.</label>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-tabler-primary text-white py-2 rounded-md hover:bg-[#1d5fb3] font-medium transition-colors disabled:opacity-70 shadow-sm">
              {isLoading ? 'Processing...' : 'Create account'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500"><Link to="/login" className="font-medium text-tabler-primary hover:underline">Sign in</Link></div>
        </div>
      </div>
    </div>
  );
}