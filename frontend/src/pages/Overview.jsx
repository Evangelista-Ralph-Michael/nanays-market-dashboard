// src/pages/Overview.jsx
import { useState, useEffect } from 'react';
import { CalendarDays, AlertCircle, TrendingUp, Loader2, Filter } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Overview() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('All');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token'); // <-- Get Token
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics?year=${selectedYear}&month=${selectedMonth}`, {
          headers: {
            'Authorization': `Bearer ${token}` // <-- Send Token
          }
        });
        const result = await response.json();
        if (result.status === 'success') {
          setAnalytics(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedYear, selectedMonth]); 

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
  };

  if (isLoading && !analytics) {
    return <div className="flex items-center justify-center h-[80vh]"><Loader2 className="animate-spin text-primaryBlue w-12 h-12" /></div>;
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto px-2 sm:px-0">
      
      {/* Header & Dynamic Date Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Overview</h1>
        
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 border-2 border-gray-200 bg-white rounded-xl px-3 py-2 shadow-sm w-fit">
            <CalendarDays className="text-gray-500" size={18} />
            <span className="font-bold text-gray-800 hidden sm:inline">Year</span>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-primaryBlue outline-none bg-transparent font-bold cursor-pointer text-sm md:text-base"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <div className="flex items-center gap-2 md:gap-3 border-2 border-primaryBlue bg-white rounded-xl px-3 py-2 shadow-sm w-fit">
            <Filter className="text-primaryBlue" size={18} />
            <span className="font-bold text-gray-800 hidden sm:inline">Month</span>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-primaryBlue outline-none bg-transparent font-bold cursor-pointer text-sm md:text-base"
            >
              <option value="All">All Year</option>
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-primaryBlue text-white rounded-2xl p-6 md:p-8 shadow-md flex flex-col items-center justify-center text-center">
          <h2 className="text-lg md:text-xl font-medium mb-2 opacity-90">Gross Profit</h2>
          <p className="text-4xl md:text-5xl font-bold tracking-tight">{formatMoney(analytics?.gross_profit)}</p>
        </div>

        <div className="bg-primaryBlue text-white rounded-2xl p-6 md:p-8 shadow-md flex flex-col items-center justify-center text-center">
          <h2 className="text-lg md:text-xl font-medium mb-2 opacity-90">Net Profit</h2>
          <p className="text-4xl md:text-5xl font-bold tracking-tight">{formatMoney(analytics?.net_profit)}</p>
        </div>
      </div>

      {/* Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Stock Alerts Panel */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4 border-b pb-4">
            <AlertCircle className="text-red-500" size={20} />
            <h2 className="text-lg md:text-xl font-bold text-gray-800">Stock alert</h2>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            <div className="grid grid-cols-3 text-xs md:text-sm font-semibold text-gray-500 px-2">
              <span>Item Name</span>
              <span className="text-center">Stock</span>
              <span className="text-right">Notes</span>
            </div>
            
            {analytics?.stock_alerts.length === 0 ? (
              <p className="text-center text-gray-500 py-4 font-medium text-sm">All stock is healthy! ✅</p>
            ) : (
              analytics?.stock_alerts.map((item, index) => (
                <div key={index} className="grid grid-cols-3 items-center bg-gray-50 p-2 md:p-3 rounded-lg border border-gray-100 text-sm">
                  <span className="font-medium text-gray-800 truncate pr-2">{item.item_name}</span>
                  <span className="text-center font-bold text-red-500">{item.quantity}</span>
                  <span className={`text-right font-medium text-xs md:text-sm ${item.quantity === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                    {item.quantity === 0 ? 'Out of Stock' : 'Low stock'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trend Analysis Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b pb-4 gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-500" size={20} />
              <h2 className="text-lg md:text-xl font-bold text-gray-800 uppercase tracking-wide">
                Trend Analysis {selectedMonth !== 'All' && `(${selectedYear}-${selectedMonth})`}
              </h2>
            </div>
            <p className="text-sm md:text-base text-gray-500 font-medium">
              Total Revenue: <span className="text-green-600 font-bold">{formatMoney(analytics?.total_revenue)}</span>
            </p>
          </div>
          
          <div className="flex-1 w-full min-h-[250px] md:min-h-[300px]">
            {analytics?.chart_data && analytics.chart_data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.chart_data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }} 
                    dy={10}
                    tickFormatter={(tick) => {
                      if (selectedMonth === 'All') return tick;
                      const date = new Date(tick);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(tick) => `₱${tick}`}
                    width={60}
                  />
                  <Tooltip 
                    formatter={(value) => [`₱${value.toFixed(2)}`, 'Revenue']}
                    labelFormatter={(label) => {
                      if (selectedMonth === 'All') return `${label} ${selectedYear}`;
                      return new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                    }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl border border-dashed border-gray-300">
                 <p className="text-gray-500 font-medium">Log some sales to see your revenue trends!</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}