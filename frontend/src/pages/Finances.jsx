// src/pages/Finances.jsx
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Loader2, Filter, Receipt, Wallet, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Finances() {
  const [finances, setFinances] = useState({ 
    gross_profit: 0, 
    total_revenue: 0, 
    total_cost: 0, 
    profit_margin: 0,
    chart_data: [] 
  });
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category: 'Supplies',
    description: '',
    amount: ''
  });

 const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      // NEW: Ensure single-digit months have a leading zero (e.g., "3" becomes "03")
      const formattedMonth = selectedMonth === "All" ? "All" : selectedMonth.padStart(2, '0');

      const [finRes, expRes] = await Promise.all([
        // Pass the formattedMonth to the URL!
        fetch(`${import.meta.env.VITE_API_URL}/api/finances?year=${selectedYear}&month=${formattedMonth}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/expenses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      const finData = await finRes.json();
      const expData = await expRes.json();

      if (finData.status === 'success') setFinances(finData.data);
      if (expData.status === 'success') setExpenses(expData.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load financial data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  // --- CALCULATIONS ---
  const filteredExpenses = expenses.filter(exp => {
    const d = new Date(exp.expense_date);
    const expYear = d.getFullYear().toString();
    const expMonth = (d.getMonth() + 1).toString();
    
    if (selectedYear !== "All" && expYear !== selectedYear) return false;
    if (selectedMonth !== "All" && expMonth !== selectedMonth) return false;
    return true;
  });

  const totalOperatingExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const trueNetProfit = finances.gross_profit - totalOperatingExpenses;

  // --- HANDLERS ---
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...expenseForm, amount: parseFloat(expenseForm.amount) })
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        toast.success("Expense logged!");
        setIsModalOpen(false);
        setExpenseForm({ ...expenseForm, description: '', amount: '' });
        fetchData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to save expense.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/expenses/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success("Expense deleted.");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to delete expense.");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[80vh]"><Loader2 className="animate-spin text-primaryBlue w-12 h-12" /></div>;
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto px-2 sm:px-0 pb-10">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Wallet className="text-primaryBlue" size={32} />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Financial Report</h1>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <Filter size={18} className="text-gray-400 ml-2" />
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer">
            <option value="All">All Years</option>
            <option value={currentYear}>{currentYear}</option>
            <option value={(parseInt(currentYear) - 1).toString()}>{parseInt(currentYear) - 1}</option>
          </select>
          <div className="w-px h-6 bg-gray-200"></div>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer pr-2">
            <option value="All">All Months</option>
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
              <option key={m} value={(i + 1).toString()}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 1: THE OLD SUMMARY (4 Blue Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#4a90e2] text-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-white/80 mb-1">Total Revenue</p>
          <h3 className="text-2xl font-bold">₱{finances.total_revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-[#4a90e2] text-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-white/80 mb-1">Total Capital Cost</p>
          <h3 className="text-2xl font-bold">₱{finances.total_cost.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-[#4a90e2] text-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-white/80 mb-1">Gross Profit</p>
          <h3 className="text-2xl font-bold">₱{finances.gross_profit.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-[#4a90e2] text-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-white/80 mb-1">Profit Margin</p>
          <h3 className="text-2xl font-bold">{finances.profit_margin.toFixed(1)}%</h3>
        </div>
      </div>

      {/* SECTION 2: THE BAR CHART */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 text-center mb-6">
          Revenue vs Cost ({selectedMonth !== "All" ? `Month ${selectedMonth}, ${selectedYear}` : selectedYear})
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={finances.chart_data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `₱${value}`} />
              <Tooltip 
                cursor={{ fill: '#F3F4F6' }} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value) => [`₱${Number(value).toFixed(2)}`]}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              {/* Blue for Cost, Teal for Revenue just like the picture! */}
              <Bar dataKey="cost" name="Capital Cost" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rev" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 3: TRUE NET PROFIT & EXPENSES CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expenses Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-red-50 p-4 rounded-xl text-red-500"><TrendingDown size={28} /></div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Operating Expenses</p>
            <h3 className="text-2xl font-bold text-gray-900">₱{totalOperatingExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 ${trueNetProfit >= 0 ? 'bg-gradient-to-br from-green-500 to-green-700 border-green-800' : 'bg-gradient-to-br from-red-600 to-red-800 border-red-900'}`}>
          <div className="bg-white/20 p-4 rounded-xl text-white"><DollarSign size={28} /></div>
          <div>
            <p className="text-sm font-semibold text-white/80">True Net Profit</p>
            <h3 className="text-2xl font-bold text-white">₱{trueNetProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
        </div>
      </div>

      {/* SECTION 4: EXPENSES TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-800">Operating Expenses Log</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors"
          >
            <Plus size={20} /> Log Expense
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Amount</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <Receipt size={48} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No expenses logged for this period.</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-700">{exp.expense_date}</td>
                    <td className="py-4 px-6">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-sm font-medium">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{exp.description || '-'}</td>
                    <td className="py-4 px-6 text-right font-bold text-red-500">
                      ₱{Number(exp.amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button onClick={() => handleDeleteExpense(exp.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Log an Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                <input 
                  type="date" required
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})}
                  className="w-full border-gray-300 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primaryBlue outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select 
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                  className="w-full border-gray-300 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primaryBlue outline-none bg-white"
                >
                  <option value="Supplies">Supplies & Materials</option>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities (Water, Elec, Internet)</option>
                  <option value="Salary">Employee Salary</option>
                  <option value="Maintenance">Repairs & Maintenance</option>
                  <option value="Marketing">Marketing / Ads</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input 
                  type="text" placeholder="e.g., Meralco Bill for May"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  className="w-full border-gray-300 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primaryBlue outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (₱)</label>
                <input 
                  type="number" step="0.01" min="0" required placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  className="w-full border-gray-300 border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primaryBlue outline-none font-medium"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors flex justify-center items-center">
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}