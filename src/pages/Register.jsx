import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Library, Eye, EyeOff, ShieldCheck, X, FileText } from 'lucide-react';

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
  
  // NEW: Terms Modal State
  const [isTermsOpen, setIsTermsOpen] = useState(false);

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
    if (!agree) return showToast('You must agree to the Terms and Conditions to proceed.', 'warning');
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

  const acceptTerms = () => {
    setAgree(true);
    setIsTermsOpen(false);
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
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700 relative z-10">
          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:border-tabler-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none cursor-pointer">
                <option value="student">Student Account</option>
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
            <div className="flex items-center pt-2">
              <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-tabler-primary cursor-pointer" />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                I agree to the <button type="button" onClick={() => setIsTermsOpen(true)} className="text-tabler-primary font-medium hover:underline outline-none focus:ring-2 focus:ring-tabler-primary/20 rounded">Terms and Conditions</button>.
              </label>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-tabler-primary text-white py-2 rounded-md hover:bg-[#1d5fb3] font-medium transition-colors disabled:opacity-70 shadow-sm mt-4">
              {isLoading ? 'Processing...' : 'Create account'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">Already have an account? <Link to="/login" className="font-medium text-tabler-primary hover:underline">Sign in</Link></div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {isTermsOpen && (
        <div className="fixed inset-0 bg-gray-900/70 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-lg shadow-2xl max-w-xl w-full flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-gray-200 dark:border-tabler-border flex justify-between items-center bg-gray-50 dark:bg-tabler-body/50 shrink-0">
              <div className="flex items-center gap-2 text-tabler-primary">
                <FileText className="w-5 h-5" />
                <h3 className="font-bold text-gray-900 dark:text-white">SmartLend Terms & Conditions</h3>
              </div>
              <button onClick={() => setIsTermsOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white p-1 rounded-full hover:bg-gray-200 dark:hover:bg-tabler-border/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-700 dark:text-gray-300 space-y-5">
              <p>Welcome to SmartLend. By registering an account and utilizing our system, you agree to be bound by the following terms and conditions governing the borrowing of physical assets from the Student Affairs Office (SAO).</p>
              
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">1. User Identity & Account Responsibility</h4>
                <p>Your account is strictly tied to your official Identification Number. You are solely responsible for maintaining the confidentiality of your login credentials. Any materials borrowed under your account are your direct liability.</p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">2. Asset Liability & Damages</h4>
                <p>All books, modules, and physical items must be returned on or before the expected return date in their original physical condition. The SAO reserves the right to evaluate returning items for damages. If an item is declared lost or damaged, you will be subject to penalties, replacement fees, or clearance holds.</p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">3. Non-Reservation Clause</h4>
                <p>Submitting a borrow request through the system does <strong className="text-tabler-warning dark:text-tabler-warning">not</strong> guarantee the physical reservation of an item. Approvals and final handovers are strictly conducted on a first-come, first-served basis upon your physical arrival at the SAO desk.</p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">4. Data Privacy</h4>
                <p>In accordance with the Data Privacy Act of 2012, your personal information (Name, Email, and ID Number) will be collected and processed solely for the operational management of the library and SAO records. We will never share or sell your data to third parties.</p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-tabler-body/50 border-t border-gray-200 dark:border-tabler-border flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsTermsOpen(false)} className="px-5 py-2.5 text-sm font-medium border border-gray-300 dark:border-tabler-border rounded-md hover:bg-gray-100 dark:hover:bg-tabler-border/50 text-gray-700 dark:text-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={acceptTerms} className="px-5 py-2.5 text-sm font-bold text-white bg-tabler-primary rounded-md hover:bg-[#1d5fb3] transition-colors shadow-sm">
                I Understand & Agree
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}