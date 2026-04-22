// src/pages/Signup.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, Briefcase, Eye, EyeOff, Loader2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.status === 'success') {
        toast.success("Account created! Please log in.");
        navigate('/login'); 
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row-reverse bg-gray-50 dark:bg-gray-900 transition-colors">
      
      {/* RIGHT SIDE: Branding Panel (Reversed for visual variation from login) */}
      <div className="hidden md:flex flex-col justify-center w-1/2 bg-gradient-to-br from-blue-900 to-blue-600 text-white p-12 lg:p-24 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white p-3 rounded-2xl shadow-lg">
              <TrendingUp className="text-blue-600" size={32} />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Market BI</h1>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Start scaling your <br/>business today.
          </h2>
          <div className="space-y-4 text-blue-100 text-lg max-w-md">
            <p className="flex items-center gap-2">✨ Track your true Net Profit</p>
            <p className="flex items-center gap-2">📦 Smart Inventory Alerts</p>
            <p className="flex items-center gap-2">🧾 Instant PDF Receipts</p>
          </div>
        </div>
      </div>

      {/* LEFT SIDE: Form Panel */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-24 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          
          <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="bg-primaryBlue p-2 rounded-xl">
              <TrendingUp className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Market BI</h1>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create an account</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Join thousands of smart business owners.</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && <div className="bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 p-4 rounded-xl text-sm font-semibold border border-red-100 dark:border-red-900/50">{error}</div>}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input name="full_name" required placeholder="Full Name" className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl outline-primaryBlue bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors text-sm" />
              </div>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input name="username" required placeholder="Username" className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl outline-primaryBlue bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors text-sm" />
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input name="email" type="email" required placeholder="Email Address" className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl outline-primaryBlue bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors" />
            </div>

            <div className="relative">
              <Briefcase className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input name="business_name" required placeholder="Business Name (e.g. Nanay's Market)" className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl outline-primaryBlue bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors" />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                required 
                placeholder="Password (Min 8 chars, 1 Upper, 1 Lower, 1 Num)" 
                className="w-full pl-11 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl outline-primaryBlue bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors text-sm font-medium" 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input 
                name="confirm_password" 
                type={showConfirmPassword ? "text" : "password"} 
                required 
                placeholder="Confirm Password" 
                className="w-full pl-11 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl outline-primaryBlue bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors text-sm font-medium" 
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full mt-2 bg-primaryBlue text-white py-3.5 rounded-xl font-bold hover:bg-blue-600 transition-all disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-md hover:shadow-lg"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account? <Link to="/login" className="font-bold text-primaryBlue hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}