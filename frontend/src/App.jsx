// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

import Overview from './pages/Overview';
import DailySales from './pages/DailySales';
import Inventory from './pages/Inventory'; // 1. Import Inventory
import Finances from './pages/Finances';   // 2. Import Finances

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/sales" element={<DailySales />} />
          <Route path="/inventory" element={<Inventory />} /> {/* 3. Update route */}
          <Route path="/finances" element={<Finances />} />   {/* 4. Update route */}
          {/* Optional: Add Settings placeholder if you want it to stop saying "Coming Soon" */}
          <Route path="/settings" element={<div><h1 className="text-3xl font-bold text-gray-800">Settings Configuration</h1></div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;