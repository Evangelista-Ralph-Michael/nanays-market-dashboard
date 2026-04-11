// src/pages/Finances.jsx
import { useState, useEffect } from 'react';
import { CalendarDays, Download, Loader2, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Finances() {
  const [finances, setFinances] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // New State for Year AND Month
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('All');

  useEffect(() => {
    const fetchFinances = async () => {
      setIsLoading(true);
      try {
        // Send both Year and Month to our upgraded Python backend
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/finances?year=${selectedYear}&month=${selectedMonth}`);
        const result = await response.json();
        if (result.status === 'success') {
          setFinances(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch finances:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinances();
  }, [selectedYear, selectedMonth]); // Re-fetch whenever either one changes!

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Dynamic label: "Mar 2026" or "Day 02"
      const displayLabel = selectedMonth === 'All' ? `${label} ${selectedYear}` : `Day ${label}`;
      
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <p className="font-bold text-gray-800 mb-2">{displayLabel}</p>
          <p className="text-teal-500 font-medium">Revenue: {formatMoney(payload[0].value)}</p>
          <p className="text-blue-500 font-medium">Cost: {formatMoney(payload[1].value)}</p>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-green-600 font-bold">
              Profit: {formatMoney(payload[0].value - payload[1].value)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[80vh]"><Loader2 className="animate-spin text-primaryBlue w-12 h-12" /></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Financial Report</h1>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 bg-white border-2 border-primaryBlue text-primaryBlue hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
        >
          <Download size={20} />
          Download PDF
        </button>
      </div>

      {/* Dynamic Filters Section */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Year Picker */}
        <div className="flex items-center gap-3 border-2 border-gray-200 bg-white rounded-xl px-4 py-2 shadow-sm w-fit">
          <CalendarDays className="text-gray-500" size={20} />
          <span className="font-bold text-gray-800">Year</span>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-primaryBlue outline-none bg-transparent font-bold cursor-pointer"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        {/* New Month Picker */}
        <div className="flex items-center gap-3 border-2 border-primaryBlue bg-white rounded-xl px-4 py-2 shadow-sm w-fit">
          <Filter className="text-primaryBlue" size={20} />
          <span className="font-bold text-gray-800">Month</span>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-primaryBlue outline-none bg-transparent font-bold cursor-pointer"
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

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-primaryBlue text-white rounded-2xl p-6 shadow-md text-center">
          <h2 className="text-sm font-medium mb-2 opacity-90">Total Revenue</h2>
          <p className="text-3xl font-bold">{formatMoney(finances?.total_revenue)}</p>
        </div>
        <div className="bg-primaryBlue text-white rounded-2xl p-6 shadow-md text-center">
          <h2 className="text-sm font-medium mb-2 opacity-90">Total Capital Cost</h2>
          <p className="text-3xl font-bold">{formatMoney(finances?.total_cost)}</p>
        </div>
        <div className="bg-primaryBlue text-white rounded-2xl p-6 shadow-md text-center">
          <h2 className="text-sm font-medium mb-2 opacity-90">Gross Profit</h2>
          <p className="text-3xl font-bold">{formatMoney(finances?.gross_profit)}</p>
        </div>
        <div className="bg-primaryBlue text-white rounded-2xl p-6 shadow-md text-center">
          <h2 className="text-sm font-medium mb-2 opacity-90">Profit Margin</h2>
          <p className="text-3xl font-bold">{finances?.profit_margin.toFixed(1)}%</p>
        </div>
      </div>

      {/* Interactive Bar Chart Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
          Revenue vs Cost ({selectedMonth === 'All' ? selectedYear : `${selectedYear}-${selectedMonth}`})
        </h2>
        
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={finances?.chart_data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="label"  // This will dynamically be "Mar" or "02" based on what the backend sends!
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => `₱${value}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ paddingBottom: '20px' }}
              />
              <Bar 
                name="Revenue" 
                dataKey="rev" 
                fill="#14B8A6" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={50}
              />
              <Bar 
                name="Capital Cost" 
                dataKey="cost" 
                fill="#3B82F6" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}