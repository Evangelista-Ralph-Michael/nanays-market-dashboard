// src/App.jsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react'; // <-- Imported the Hamburger Menu icon
import Login from './pages/Login';
import Signup from './pages/Signup';
import Overview from './pages/Overview';
import Inventory from './pages/Inventory';
import DailySales from './pages/DailySales';
import Finances from './pages/Finances';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const DashboardLayout = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const navigate = useNavigate(); // <-- ADD THIS LINE

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login'); // <-- CHANGE THIS LINE (Smooth React routing!)
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* Pass the state to the Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Dynamic Header */}
        <header className="bg-white shadow-sm z-10 border-b border-gray-200 shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            
            {/* Left Side: Hamburger + Business Name */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="md:hidden p-1 text-gray-600 hover:text-primaryBlue hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate max-w-[150px] sm:max-w-xs">
                {user.business_name || "My Business"}
              </h1>
            </div>

            {/* Right Side: User Info & Logout */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 hidden sm:block truncate max-w-[150px]">
                {user.full_name}
              </span>
              <button onClick={handleLogout} className="text-sm text-red-500 font-bold hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                Logout
              </button>
            </div>

          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/" element={<ProtectedRoute><DashboardLayout><Overview /></DashboardLayout></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><DashboardLayout><Inventory /></DashboardLayout></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><DashboardLayout><DailySales /></DashboardLayout></ProtectedRoute>} />
        <Route path="/finances" element={<ProtectedRoute><DashboardLayout><Finances /></DashboardLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}