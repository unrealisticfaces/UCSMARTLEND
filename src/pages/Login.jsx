import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, showToast, isLoading } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);
  const panelRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await login(email, password);
      if (userData && userData.role) {
        showToast(`Welcome back, ${userData.name.split(' ')[0]}!`);
        navigate(`/${userData.role}`);
      }
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') showToast('Incorrect email or password.', 'error');
      else if (err.code === 'auth/too-many-requests') showToast('Too many failed attempts. Try again later.', 'warning');
      else showToast(err.message || 'Authentication failed.', 'error');
    }
  };

  const handleMouseMove = (e) => {
    if (!panelRef.current || isSpinning) return;
    const rect = panelRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPct = (x / rect.width - 0.5) * 30; 
    const yPct = (y / rect.height - 0.5) * -30; 
    setTilt({ x: xPct, y: yPct });
  };

  const handleMouseLeave = () => {
    if(!isSpinning) setTilt({ x: 0, y: 0 });
  };

  const handleLogoClick = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSpinRotation(prev => prev + 360); 
    setTilt({ x: 0, y: 0 }); 
    setTimeout(() => setIsSpinning(false), 1000);
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#182433] font-sans transition-colors duration-200">
      
      {/* Left Panel: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 xl:px-24 z-20 bg-white dark:bg-[#182433] shadow-[10px_0_30px_rgba(0,0,0,0.1)]">
        <div className="max-w-[380px] w-full mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <img src="https://uc.edu.ph/wp-content/uploads/2026/06/uc-logo-scaled-1-scaled.webp" alt="UC Logo" className="h-14 w-auto object-contain" />
            <div className="h-10 w-px bg-gray-300 dark:bg-gray-700"></div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-tabler-primary to-[#8b5cf6] tracking-tight leading-none">SmartLend</span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-tabler-muted tracking-widest uppercase mt-1">Student & SAO Portal</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 tracking-tight">Login to your account</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@uc.edu.ph" className="w-full px-3 py-2 bg-white dark:bg-[#1f2d3d] border border-gray-300 dark:border-[#2f3e4e] rounded-md text-sm focus:border-tabler-primary outline-none text-gray-900 dark:text-white transition-colors" required disabled={isLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="w-full pl-3 pr-10 py-2 bg-white dark:bg-[#1f2d3d] border border-gray-300 dark:border-[#2f3e4e] rounded-md text-sm focus:border-tabler-primary outline-none text-gray-900 dark:text-white transition-colors" required disabled={isLoading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-tabler-primary">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full mt-6 bg-tabler-primary text-white py-2.5 rounded-md text-sm font-medium hover:bg-[#1d5fb3] disabled:opacity-70 transition-colors shadow-sm">
              {isLoading ? 'Authenticating...' : 'Sign in'}
            </button>
          </form>
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-tabler-muted">
            Don't have an account yet? <Link to="/register" className="text-tabler-primary hover:underline font-medium">Sign up</Link>
          </div>
        </div>
      </div>

      {/* Right Panel: Interactive 3D Canvas with Aurora Background */}
      <div 
        ref={panelRef}
        className="hidden lg:flex lg:w-1/2 relative bg-[#060c17] overflow-hidden items-center justify-center perspective-1000"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <style>
          {`
            @keyframes blob {
              0% { transform: translate(0px, 0px) scale(1); }
              33% { transform: translate(30px, -50px) scale(1.1); }
              66% { transform: translate(-20px, 20px) scale(0.9); }
              100% { transform: translate(0px, 0px) scale(1); }
            }
            .animate-blob { animation: blob 10s infinite alternate; }
            .animation-delay-2000 { animation-delay: 2s; }
            .animation-delay-4000 { animation-delay: 4s; }
            .perspective-1000 { perspective: 1000px; }
          `}
        </style>
        
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#206bc4] rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-[#8b5cf6] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-[#1d5fb3] rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob animation-delay-4000 pointer-events-none"></div>

        <div 
          className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300" 
          style={{ background: `radial-gradient(800px circle at ${tilt.x * 10 + 50}% ${tilt.y * -10 + 50}%, rgba(255,255,255,0.03), transparent 40%)` }}
        ></div>

        <div 
          onClick={handleLogoClick}
          className="relative z-10 cursor-pointer transform-gpu preserve-3d group"
          style={{
            transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x + spinRotation}deg) scale(${isSpinning ? 0.85 : 1})`,
            transition: isSpinning ? 'transform 1000ms cubic-bezier(0.4, 0, 0.2, 1)' : 'transform 200ms ease-out',
            transformStyle: 'preserve-3d'
          }}
        >
          <div className="absolute inset-0 bg-white/5 blur-[60px] rounded-full transform -translate-z-12 group-hover:bg-white/10 transition-colors duration-500"></div>
          
          <img 
            src="https://uc.edu.ph/wp-content/uploads/2026/06/uc-logo-scaled-1-scaled.webp" 
            alt="Interactive UC Logo" 
            className="w-[450px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] select-none pointer-events-none"
          />
        </div>

        <div className="absolute bottom-12 text-white/30 text-xs font-bold tracking-[0.2em] uppercase animate-pulse pointer-events-none">
          Click to Interact
        </div>

      </div>
    </div>
  );
}