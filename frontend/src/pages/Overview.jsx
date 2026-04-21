// src/pages/Overview.jsx
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Package, ShoppingCart, DollarSign, Loader2, AlertCircle, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Overview() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Date Picker States
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      try {
        const [txRes, invRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/transactions`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${import.meta.env.VITE_API_URL}/api/inventory`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const txData = await txRes.json();
        const invData = await invRes.json();

        if (txData.status === 'success') setTransactions(txData.data);
        if (invData.status === 'success') setInventory(invData.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- FILTER DATA BASED ON DATE PICKER ---
  const filteredTransactions = transactions.filter(tx => {
    const date = new Date(tx.transaction_date);
    const txYear = date.getFullYear().toString();
    const txMonth = (date.getMonth() + 1).toString();
    
    if (selectedYear !== "All" && txYear !== selectedYear) return false;
    if (selectedMonth !== "All" && txMonth !== selectedMonth) return false;
    return true;
  });

  // --- TREND ANALYSIS (Summary Stats) ---
  const totalRevenue = filteredTransactions.reduce((sum, tx) => sum + Number(tx.total_amount), 0);
  const totalItemsSold = filteredTransactions.reduce((sum, tx) => sum + tx.quantity_sold, 0);
  
  // Calculate estimated Gross Profit (Revenue - Capital)
  const grossProfit = filteredTransactions.reduce((sum, tx) => {
    const item = inventory.find(i => i.id === tx.item_id);
    const capitalCost = item ? (item.capital * tx.quantity_sold) : 0;
    return sum + (Number(tx.total_amount) - capitalCost);
  }, 0);

  // --- DYNAMIC CHART DATA (Adaptive based on Date Picker) ---
  const dynamicChartData = [];
  const yearForChart = selectedYear === "All" ? currentYear : selectedYear;

  if (selectedMonth !== "All") {
    // 1. ZOOM IN: Show every day of the selected month
    const daysInMonth = new Date(yearForChart, selectedMonth, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearForChart}-${selectedMonth.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dailyRev = transactions
        .filter(tx => tx.transaction_date === dateStr)
        .reduce((sum, tx) => sum + Number(tx.total_amount), 0);
      
      dynamicChartData.push({ 
        name: day.toString(), 
        revenue: dailyRev 
      });
    }
  } else {
    // 2. ZOOM OUT: Show 12 months of the selected year
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    monthLabels.forEach((month, index) => {
      const monthNum = (index + 1).toString();
      const monthlyRev = transactions
        .filter(tx => {
          const d = new Date(tx.transaction_date);
          return d.getFullYear().toString() === yearForChart && (d.getMonth() + 1).toString() === monthNum;
        })
        .reduce((sum, tx) => sum + Number(tx.total_amount), 0);
        
      dynamicChartData.push({ name: month, revenue: monthlyRev });
    });
  }

  // --- CHART DATA: TOP ITEMS ---
  const itemSales = {};
  filteredTransactions.forEach(tx => {
    const name = tx.items?.item_name || 'Unknown';
    itemSales[name] = (itemSales[name] || 0) + tx.quantity_sold;
  });
  const topItemsData = Object.keys(itemSales)
    .map(name => ({ name, value: itemSales[name] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4); 
  const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'];

  // --- STOCK ALERTS (Low Inventory) ---
  const lowStockItems = inventory.filter(item => item.quantity <= 10).sort((a, b) => a.quantity - b.quantity);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="animate-spin text-primaryBlue w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto px-2 sm:px-0 pb-10">
      
      {/* HEADER & DATE PICKER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-primaryBlue" size={32} />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <Filter size={18} className="text-gray-400 ml-2" />
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)} 
            className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer"
          >
            <option value="All">All Years</option>
            <option value={currentYear}>{currentYear}</option>
            <option value={(parseInt(currentYear) - 1).toString()}>{parseInt(currentYear) - 1}</option>
          </select>
          <div className="w-px h-6 bg-gray-200"></div>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
            className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer pr-2"
          >
            <option value="All">All Months</option>
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
              <option key={m} value={(i + 1).toString()}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TREND ANALYSIS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-green-50 p-4 rounded-xl text-green-600"><DollarSign size={28} /></div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Filtered Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900">₱{totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-50 p-4 rounded-xl text-primaryBlue"><ShoppingCart size={28} /></div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Filtered Items Sold</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalItemsSold} Units</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-orange-50 p-4 rounded-xl text-orange-500"><TrendingUp size={28} /></div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Est. Gross Profit</p>
            <h3 className="text-2xl font-bold text-gray-900">₱{grossProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BAR CHART: DYNAMIC TREND */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            {selectedMonth !== "All" 
              ? `Daily Revenue: ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(selectedMonth) - 1]} ${yearForChart}` 
              : `Monthly Revenue Trend (${yearForChart})`}
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 10 }} 
                  dy={10} 
                  interval={selectedMonth !== "All" ? 2 : 0} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                  formatter={(value) => [`₱${value.toFixed(2)}`, 'Revenue']} 
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]} 
                  barSize={selectedMonth !== "All" ? 15 : 30} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* PIE CHART: TOP ITEMS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Top Selling Items</h3>
          {topItemsData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topItemsData} cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {topItemsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} Units Sold`, 'Quantity']} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#4B5563' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-72 text-center text-gray-500">
              <Package size={48} className="text-gray-300 mb-3" />
              <p>No sales data yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* STOCK ALERTS (CLICKABLE!) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <AlertCircle className="text-red-500" size={24} />
          <h2 className="text-lg font-bold text-gray-800">Low Stock Alerts</h2>
          <span className="ml-auto bg-red-50 text-red-600 py-1 px-3 rounded-full text-sm font-bold">{lowStockItems.length} Items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Item Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Current Stock</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.length === 0 ? (
                <tr><td colSpan="3" className="text-center py-8 text-gray-500">All items are sufficiently stocked!</td></tr>
              ) : (
                lowStockItems.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => navigate('/inventory', { state: { editItem: item } })}
                    className="border-b border-gray-100 hover:bg-red-50 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-6 font-bold text-gray-800 group-hover:text-red-600">{item.item_name}</td>
                    <td className="py-4 px-6">
                      <span className={`font-bold px-2 py-1 rounded ${item.quantity === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                        {item.quantity} Left
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-sm font-medium text-blue-500 group-hover:text-blue-700">
                      Click to Restock &rarr;
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}