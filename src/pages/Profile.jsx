import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Lock, Eye, EyeOff, ShieldCheck, Mail, Hash } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile, changePassword, showToast } = useApp();
  
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [isUpdating, setIsUpdating] = useState(false);

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

  const strength = calculateStrength(newPassword);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const strengthColors = ['bg-gray-200', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-tabler-success', 'bg-green-600'];

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      // Profile Name Update
      if (name !== user.name) {
        await updateProfile({ name, avatar: `https://ui-avatars.com/api/?name=${name.replace(/ /g, '+')}&background=random&color=fff` });
      }
      
      // Secure Password Update Workflow
      if (newPassword || currentPassword || confirmPassword) {
        if (!currentPassword) throw new Error('Please enter your current password to authorize security changes.');
        if (newPassword.length < 6) throw new Error('New password must be at least 6 characters long.');
        if (newPassword !== confirmPassword) throw new Error('New passwords do not match. Please verify your typing.');
        
        await changePassword(currentPassword, newPassword);
        
        // Clear forms on success
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-sans text-gray-900 dark:text-gray-100 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-tabler-border pb-6">
        <div className="w-16 h-16 rounded-full bg-tabler-primary/10 flex items-center justify-center text-tabler-primary">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
          <p className="text-sm text-gray-500 dark:text-tabler-muted">Manage your personal information and security protocols.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-tabler-card border border-gray-200 dark:border-tabler-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-start">
          
          {/* Left Avatar Panel */}
          <div className="flex flex-col items-center space-y-3 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 dark:border-tabler-border pb-6 md:pb-0 pr-0 md:pr-6">
            <img src={user?.avatar} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-gray-50 dark:border-tabler-body shadow-sm" />
            <div className="text-center">
              <div className="font-bold text-lg">{user?.name}</div>
              <div className="text-[10px] font-bold text-tabler-primary uppercase tracking-widest bg-tabler-primary/10 px-3 py-1 rounded-full mt-2 inline-block">
                {user?.role} Account
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <form onSubmit={handleUpdateProfile} className="flex-1 space-y-5 w-full">
            
            {/* UPGRADE: Full width Email to prevent truncation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-tabler-muted mb-1.5 uppercase tracking-wide">System ID</label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={user?.id || ''} disabled className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-tabler-body border border-gray-200 dark:border-tabler-border rounded text-sm text-gray-500 cursor-not-allowed font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-tabler-muted mb-1.5 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-tabler-body border border-gray-300 dark:border-tabler-border rounded text-sm focus:border-tabler-primary outline-none transition-colors" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-tabler-muted mb-1.5 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={user?.email || ''} disabled className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-tabler-body border border-gray-200 dark:border-tabler-border rounded text-sm text-gray-500 cursor-not-allowed w-full overflow-hidden text-ellipsis" />
              </div>
            </div>

            {/* UPGRADE: Secure Password Flow */}
            <div className="pt-4 border-t border-gray-100 dark:border-tabler-border space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-tabler-muted mb-1.5 uppercase tracking-wide">Change Password</label>
                <p className="text-xs text-gray-500 dark:text-tabler-muted mb-3">Leave these fields blank if you do not wish to change your password.</p>
                
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type={showCurrent ? "text" : "password"} 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    placeholder="Current Password" 
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-tabler-body border border-gray-300 dark:border-tabler-border rounded text-sm focus:border-tabler-primary outline-none transition-colors" 
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-tabler-primary transition-colors">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type={showNew ? "text" : "password"} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="New Password" 
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-tabler-body border border-gray-300 dark:border-tabler-border rounded text-sm focus:border-tabler-primary outline-none transition-colors" 
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-tabler-primary transition-colors">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type={showConfirm ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm New Password" 
                    className={`w-full pl-10 pr-10 py-2.5 bg-white dark:bg-tabler-body border ${confirmPassword && newPassword !== confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-tabler-border focus:border-tabler-primary'} rounded text-sm outline-none transition-colors`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-tabler-primary transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Live Password Strength Meter */}
              {newPassword && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                  <div className="flex gap-1 h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div key={level} className={`flex-1 h-full transition-all duration-300 ${strength >= level ? strengthColors[strength] : 'bg-transparent'}`}></div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-1.5 px-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${strength > 2 ? 'text-tabler-success' : 'text-gray-500'}`}>
                      {strengthLabels[strength]}
                    </span>
                    {strength >= 4 && <ShieldCheck className="w-3.5 h-3.5 text-tabler-success" />}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={isUpdating} className="px-6 py-2.5 bg-tabler-primary hover:bg-[#1d5fb3] text-white rounded-md text-sm font-bold transition-colors disabled:opacity-70 shadow-sm flex items-center gap-2">
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}