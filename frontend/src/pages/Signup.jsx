// src/pages/Signup.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.status === 'success') {
        alert("Account created! Please log in.");
        navigate('/login'); // Send them to login page
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
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or <Link to="/login" className="font-medium text-primaryBlue hover:text-blue-500">sign in to an existing account</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-medium">{error}</div>}
            
            <input name="full_name" required placeholder="Full Name" className="w-full p-3 border rounded-xl outline-primaryBlue" />
            <input name="username" required placeholder="Username" className="w-full p-3 border rounded-xl outline-primaryBlue" />
            <input name="email" type="email" required placeholder="Email Address" className="w-full p-3 border rounded-xl outline-primaryBlue" />
            <input name="business_name" required placeholder="Business Name (e.g. Nanay's Market)" className="w-full p-3 border rounded-xl outline-primaryBlue" />
            <input name="password" type="password" required placeholder="Password (Min 8 chars, 1 Upper, 1 Lower, 1 Num)" className="w-full p-3 border rounded-xl outline-primaryBlue" />
            <input name="confirm_password" type="password" required placeholder="Confirm Password" className="w-full p-3 border rounded-xl outline-primaryBlue" />

            <button type="submit" disabled={isLoading} className="w-full bg-primaryBlue text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:bg-gray-400">
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}