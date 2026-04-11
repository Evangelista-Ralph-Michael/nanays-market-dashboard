// src/components/layout/Layout.jsx
import Sidebar from './Sidebar';
import { Search, UserCircle } from 'lucide-react';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-lightBg">
      {/* Sidebar is fixed, so we don't put it in the main flex column */}
      <Sidebar />

      {/* Main Content Area - margin left to account for fixed 64-width (16rem) sidebar */}
      <div className="flex-1 ml-64 flex flex-col">
        
        {/* Topbar */}
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-8">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryBlue"
            />
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <UserCircle size={24} className="text-primaryBlue" />
            <span className="font-medium">Welcome, Admin!</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}