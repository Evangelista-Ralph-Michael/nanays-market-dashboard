// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        // Save the secret token and user details to the browser!
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Refresh the app to load the dashboard
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-4xl font-extrabold text-primaryBlue mb-2">Market BI</h1>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to your dashboard</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-medium">{error}</div>}
            
            <input name="username" required placeholder="Username" className="w-full p-3 border rounded-xl outline-primaryBlue" />
            <input name="password" type="password" required placeholder="Password" className="w-full p-3 border rounded-xl outline-primaryBlue" />

            <button type="submit" disabled={isLoading} className="w-full bg-primaryBlue text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:bg-gray-400">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account? <Link to="/signup" className="font-medium text-primaryBlue hover:text-blue-500">Sign up here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}