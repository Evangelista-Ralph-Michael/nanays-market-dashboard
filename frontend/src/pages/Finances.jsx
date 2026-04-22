// src/pages/Finances.jsx
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Edit, Loader2, Filter, Receipt, Wallet } from 'lucide-react'; 
import toast from 'react-hot-toast';

export default function Finances() {
  const [finances, setFinances] = useState({ 
    gross_profit: 0, total_revenue: 0, total_cost: 0, profit_margin: 0, chart_data: [] 
  });
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const defaultExpenseForm = {
    id: null,
    expense_date: new Date().toISOString().split('T')[0],
    category: 'Supplies',
    description: '',
    amount: ''
  };
  const [expenseForm, setExpenseForm] = useState(defaultExpenseForm);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const formattedMonth = selectedMonth === "All" ? "All" : selectedMonth.padStart(2, '0');
      const [finRes, expRes] = await Promise.all([
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
      toast.error("Failed to load financial data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedYear, selectedMonth]);

  const filteredExpenses = expenses.filter(exp => {
    const d = new Date(exp.expense_date);
    if (selectedYear !== "All" && d.getFullYear().toString() !== selectedYear) return false;
    if (selectedMonth !== "All" && (d.getMonth() + 1).toString() !== selectedMonth) return false;
    return true;
  });

  const totalOperatingExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const trueNetProfit = finances.gross_profit - totalOperatingExpenses;

  const handleAddNewClick = () => {
    setExpenseForm(defaultExpenseForm);
    setIsModalOpen(true);
  };

  const handleEditClick = (exp) => {
    setExpenseForm({
      id: exp.id, expense_date: exp.expense_date, category: exp.category, description: exp.description || '', amount: exp.amount
    });
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('token');
    const method = expenseForm.id ? 'PUT' : 'POST';
    const url = expenseForm.id ? `${import.meta.env.VITE_API_URL}/api/expenses/${expenseForm.id}` : `${import.meta.env.VITE_API_URL}/api/expenses`;

    try {
      const response = await fetch(url, {
        method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...expenseForm, amount: parseFloat(expenseForm.amount) })
      });
      const result = await response.json();
      if (result.status === 'success') {
        toast.success(expenseForm.id ? "Expense updated!" : "Expense logged!");
        setIsModalOpen(false); setExpenseForm(defaultExpenseForm); fetchData();
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/expenses/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) { toast.success("Expense deleted."); fetchData(); }
    } catch (error) { toast.error("Failed to delete expense."); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-[80vh]"><Loader2 className="animate-spin text-primaryBlue w-12 h-12" /></div>;

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto px-2 sm:px-0 pb-10">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Wallet className="text-primaryBlue" size={32} />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors">Financial Report</h1>
        </div>
        
        {/* Added dark mode to filters */}
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <Filter size={18} className="text-gray-400 ml-2" />
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent font-medium text-gray-700 dark:text-gray-200 outline-none cursor-pointer">
            <option value="All">All Years</option>
            <option value={currentYear}>{currentYear}</option>
            <option value={(parseInt(currentYear) - 1).toString()}>{parseInt(currentYear) - 1}</option>
          </select>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent font-medium text-gray-700 dark:text-gray-200 outline-none cursor-pointer pr-2">
            <option value="All">All Months</option>
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
              <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SUMMARY METRICS - Adjusted bg color slightly so it pops on dark mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-500 dark:bg-blue-600 text-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center text-center transition-colors">
          <p className="text-sm font-medium text-white/80 mb-1">Total Revenue</p>
          <h3 className="text-2xl font-bold">₱{finances.total_revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-blue-500 dark:bg-blue-600 text-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center text-center transition-colors">
          <p className="text-sm font-medium text-white/80 mb-1">Total Capital Cost</p>
          <h3 className="text-2xl font-bold">₱{finances.total_cost.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-blue-500 dark:bg-blue-600 text-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center text-center transition-colors">
          <p className="text-sm font-medium text-white/80 mb-1">Gross Profit</p>
          <h3 className="text-2xl font-bold">₱{finances.gross_profit.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
        </div>
        <div className="bg-blue-500 dark:bg-blue-600 text-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center text-center transition-colors">
          <p className="text-sm font-medium text-white/80 mb-1">Profit Margin</p>
          <h3 className="text-2xl font-bold">{finances.profit_margin.toFixed(1)}%</h3>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 text-center mb-6 transition-colors">
          Revenue vs Cost ({selectedMonth !== "All" ? `Month ${selectedMonth}, ${selectedYear}` : selectedYear})
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={finances.chart_data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              {/* Changed stroke color to be visible in both modes */}
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4B5563" strokeOpacity={0.2} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `₱${value}`} />
              
              {/* Made tooltip dark/light responsive via inline styles */}
              <Tooltip 
                cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }} 
                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
                itemStyle={{ color: '#E5E7EB' }}
                formatter={(value) => [`₱${Number(value).toFixed(2)}`]} 
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ color: '#9CA3AF' }} />
              <Bar dataKey="cost" name="Capital Cost" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rev" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TRUE NET PROFIT & EXPENSES CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-colors">
          <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-xl text-red-500"><TrendingDown size={28} /></div>
          <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Operating Expenses</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₱{totalOperatingExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
        </div>
        <div className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 ${trueNetProfit >= 0 ? 'bg-gradient-to-br from-green-500 to-green-700 border-green-800' : 'bg-gradient-to-br from-red-600 to-red-800 border-red-900'}`}>
          <div className="bg-white/20 p-4 rounded-xl text-white"><DollarSign size={28} /></div>
          <div>
            <p className="text-sm font-semibold text-white/80">True Net Profit</p>
            <h3 className="text-2xl font-bold text-white">₱{trueNetProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
          </div>
        </div>
      </div>

      {/* EXPENSES TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Operating Expenses Log</h2>
          <button onClick={handleAddNewClick} className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors">
            <Plus size={20} /> Log Expense
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 transition-colors">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Category</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Description</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Amount</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <Receipt size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No expenses logged for this period.</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-700 dark:text-gray-200">{exp.expense_date}</td>
                    <td className="py-4 px-6">
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2.5 py-1 rounded-md text-sm font-medium">{exp.category}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400">{exp.description || '-'}</td>
                    <td className="py-4 px-6 text-right font-bold text-red-500 dark:text-red-400">₱{Number(exp.amount).toFixed(2)}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button onClick={() => handleEditClick(exp)} className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit Expense">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteExpense(exp.id)} className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete Expense">
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

      {/* EXPENSE MODAL - Dark Mode Applied */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden transition-colors">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{expenseForm.id ? "Edit Expense" : "Log an Expense"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input type="date" required value={expenseForm.expense_date} onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})} className="w-full border-gray-300 dark:border-gray-600 border rounded-xl px-4 py-2.5 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select value={expenseForm.category} onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full border-gray-300 dark:border-gray-600 border rounded-xl px-4 py-2.5 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input type="text" placeholder="e.g., Meralco Bill for May" value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full border-gray-300 dark:border-gray-600 border rounded-xl px-4 py-2.5 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Amount (₱)</label>
                <input type="number" step="0.01" min="0" required placeholder="0.00" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full border-gray-300 dark:border-gray-600 border rounded-xl px-4 py-2.5 outline-none font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 flex justify-center items-center">
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : (expenseForm.id ? 'Update Expense' : 'Save Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}