// src/components/layout/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Package, PieChart, Settings } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  // Navigation items based on your mockups
  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Daily Sales', path: '/sales', icon: CalendarDays },
    { name: 'Inventory & Pricing', path: '/inventory', icon: Package },
    { name: 'Financial Report', path: '/finances', icon: PieChart },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primaryBlue">Nanay's Market</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primaryBlue text-white' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-primaryBlue'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}