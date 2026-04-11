// src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Wallet, Settings, ShieldAlert, X } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  // Grab the user from local storage to check their role
  const user = JSON.parse(localStorage.getItem('user') || '{}');

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

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-64 bg-white border-r border-gray-200 flex flex-col z-30 transition-transform duration-300 ease-in-out`}>
        
        {/* Sidebar Header with Close Button for Mobile */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-primaryBlue">Market BI</h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-500 hover:text-gray-800">
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
                    ? item.name === 'Admin Panel' ? 'bg-red-500 text-white shadow-md' : 'bg-primaryBlue text-white shadow-md'
                    : item.name === 'Admin Panel' ? 'text-red-500 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-50 hover:text-primaryBlue'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>
        
        {/* Bottom Footer */}
        <div className="p-6 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 text-center uppercase tracking-wider">
            v2.0 Multi-Tenant
          </p>
        </div>
      </div>
    </>
  );
}