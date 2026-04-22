// src/components/Sidebar.jsx
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Wallet, Settings, ShieldAlert, X, Sun, Moon } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  // Grab the user from local storage to check their role
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // --- DARK MODE LOGIC ---
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage or system preference when the app loads
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };
  // -----------------------

  const navItems = [
    { name: 'Overview', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Inventory', path: '/inventory', icon: <Package size={20} /> },
    { name: 'Daily Sales', path: '/sales', icon: <ShoppingCart size={20} /> },
    { name: 'Finances', path: '/finances', icon: <Wallet size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  // If the user is an admin, add the admin panel to the navigation
  if (user.role === 'admin') {
    navItems.push({ name: 'Admin Panel', path: '/admin', icon: <ShieldAlert size={20} /> });
  }

  return (
    <>
      {/* Mobile Dark Overlay Background */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container - Added dark classes */}
      <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-30 transition-colors transition-transform duration-300 ease-in-out`}>
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center transition-colors">
          <h1 className="text-2xl font-extrabold text-primaryBlue dark:text-blue-400">Market BI</h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)} 
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? item.name === 'Admin Panel' 
                        ? 'bg-red-500 text-white shadow-md' 
                        : 'bg-primaryBlue text-white shadow-md'
                    : item.name === 'Admin Panel' 
                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primaryBlue dark:hover:text-blue-400'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>
        
        {/* Bottom Footer WITH DARK MODE TOGGLE */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-4 transition-colors">
          
          {/* THE TOGGLE BUTTON */}
          <button 
            onClick={toggleDarkMode}
            className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
          >
            <span className="font-medium text-sm">Dark Mode</span>
            {isDarkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-gray-500" />}
          </button>

          <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 text-center uppercase tracking-wider">
            v2.0 Multi-Tenant
          </p>
        </div>
      </div>
    </>
  );
}