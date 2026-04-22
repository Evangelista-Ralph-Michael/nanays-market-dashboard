// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Loader2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // NEW: Password toggle state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.status === 'success') {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        window.location.href = '/'; 
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast("Forgot password functionality coming soon!", { icon: '🛠️' });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 transition-colors">
      
      {/* LEFT SIDE: Branding Panel (Hidden on mobile) */}
      <div className="hidden md:flex flex-col justify-center w-1/2 bg-gradient-to-br from-blue-600 to-blue-900 text-white p-12 lg:p-24 relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white p-3 rounded-2xl shadow-lg">
              <TrendingUp className="text-blue-600" size={32} />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Market BI</h1>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Manage your business <br/>with confidence.
          </h2>
          <p className="text-blue-100 text-lg max-w-md">
            The all-in-one POS, inventory, and financial intelligence platform designed for modern business owners.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Form Panel */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-24">
        <div className="w-full max-w-md mx-auto">
          
          {/* Mobile Header (Only shows on small screens) */}
          <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="bg-primaryBlue p-2 rounded-xl">
              <TrendingUp className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Market BI</h1>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Please enter your details to sign in.</p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && <div className="bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 p-4 rounded-xl text-sm font-semibold border border-red-100 dark:border-red-900/50">{error}</div>}
            
            {/* Username Input */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  name="username" 
                  required 
                  placeholder="Enter your username" 
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl outline-primaryBlue bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors" 
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="••••••••" 
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl outline-primaryBlue bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors font-medium tracking-wide" 
                />
                {/* NEW: Password Toggle Button */}
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Row */}
            <div className="flex items-center justify-end">
              <button type="button" onClick={handleForgotPassword} className="text-sm font-semibold text-primaryBlue hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-primaryBlue text-white py-3.5 rounded-xl font-bold hover:bg-blue-600 transition-all disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-md hover:shadow-lg"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account? <Link to="/signup" className="font-bold text-primaryBlue hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Sign up for free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}