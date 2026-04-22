// src/components/Sidebar.jsx
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Wallet, Settings, ShieldAlert, X, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Sidebar({ isOpen, setIsOpen }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // --- DARK MODE LOGIC ---
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
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

  // --- 🚀 RANDOM EASTER EGG LOGIC 🚀 ---
  const [clickCount, setClickCount] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  
  // FIX 1: Create TWO separate states for the two memes!
  const [currentMeme1, setCurrentMeme1] = useState('');
  const [currentMeme2, setCurrentMeme2] = useState('');

  const easterEggImages = [
    'nero.jpg',
    'nero2.jpg',
    'nero3.jpg',
    'nero4.jpg',
    'nero5.jpg',
    'nero6.jpg',
    'nero7.jpg',
    'nero8.jpg',
    'nero9.jpg',
    'nero10.jpg',
    'nero11.jpg', // Fixed the missing dot here!
    'nero12.jpg',
    'nero13.jpg',
    'karl1.jpg',
  ];

  const handleLogoClick = () => {
    if (isFlying) return; 

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount === 5) {
      // FIX 2: Generate TWO different indexes!
      const index1 = Math.floor(Math.random() * easterEggImages.length);
      let index2 = Math.floor(Math.random() * easterEggImages.length);
      
      // Make sure the second image isn't the same as the first
      if (index1 === index2) {
        index2 = (index2 + 1) % easterEggImages.length;
      }
      
      setCurrentMeme1(`/easter-eggs/${easterEggImages[index1]}`);
      setCurrentMeme2(`/easter-eggs/${easterEggImages[index2]}`);

      setIsFlying(true);
      setClickCount(0); 
      toast("🚀 SECRET MODE ACTIVATED! 📈", { icon: '🤑', duration: 4000 });
      
      setTimeout(() => {
        setIsFlying(false);
      }, 15000);
    }
  };
  // -------------------------------

  const navItems = [
    { name: 'Overview', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Inventory', path: '/inventory', icon: <Package size={20} /> },
    { name: 'Daily Sales', path: '/sales', icon: <ShoppingCart size={20} /> },
    { name: 'Finances', path: '/finances', icon: <Wallet size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  if (user.role === 'admin') {
    navItems.push({ name: 'Admin Panel', path: '/admin', icon: <ShieldAlert size={20} /> });
  }

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-30 transition-colors transition-transform duration-300 ease-in-out`}>
        
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center transition-colors">
          <h1 
            onClick={handleLogoClick}
            className="text-2xl font-extrabold text-primaryBlue dark:text-blue-400 cursor-pointer select-none"
            title="Keep clicking... I dare you."
          >
            Market BI
          </h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>
        
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
        
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-4 transition-colors">
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

      {/* --- SECRET EASTER EGG RENDER ZONE --- */}
      {isFlying && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          <style>
            {`
              @keyframes crazyFly1 {
                0% { transform: translate(-20vw, 110vh) rotate(0deg) scale(0.5); }
                20% { transform: translate(40vw, 20vh) rotate(90deg) scale(1.5); }
                40% { transform: translate(90vw, 70vh) rotate(180deg) scale(0.8); }
                60% { transform: translate(30vw, 10vh) rotate(270deg) scale(1.2); }
                80% { transform: translate(80vw, 90vh) rotate(360deg) scale(2); }
                100% { transform: translate(120vw, -20vh) rotate(450deg) scale(1); }
              }
              @keyframes crazyFly2 {
                0% { transform: translate(120vw, 50vh) rotate(0deg) scale(1); }
                25% { transform: translate(50vw, 90vh) rotate(-90deg) scale(2); }
                50% { transform: translate(10vw, 10vh) rotate(-180deg) scale(0.5); }
                75% { transform: translate(70vw, 40vh) rotate(-270deg) scale(1.5); }
                100% { transform: translate(-20vw, 80vh) rotate(-360deg) scale(1); }
              }
              .stonks-1 {
                animation: crazyFly1 4s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
                position: absolute; top: 0; left: 0;
              }
              .stonks-2 {
                animation: crazyFly2 3s linear infinite;
                position: absolute; top: 0; left: 0;
              }
              .stonks-3 {
                animation: crazyFly1 5s ease-in-out infinite;
                position: absolute; top: 0; left: 0;
              } 
            `}
          </style>
          
          <img 
            src={currentMeme1} 
            alt="Easter Egg 1" 
            className="stonks-1 w-48 h-48 md:w-72 md:h-72 object-contain rounded-xl shadow-2xl"
          />
           <img 
            src={currentMeme2} 
            alt="Easter Egg 2" 
            className="stonks-3 w-48 h-48 md:w-72 md:h-72 object-contain rounded-xl shadow-2xl"
          />
          <div className="stonks-2 text-[60px] md:text-[100px] font-extrabold text-red-500 drop-shadow-[0_5px_5px_rgba(255,255,255,0.8)]">
            <p>Kupal na nero</p>
          </div>
        </div>
      )}
    </>
  );
}