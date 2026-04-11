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