// src/pages/DailySales.jsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Loader2, Edit, Trash2, Search } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';

export default function DailySales() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txnToEdit, setTxnToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token'); // <-- Get Token
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}` // <-- Send Token
        }
      });
      const result = await response.json();
      if (result.status === 'success') setTransactions(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [selectedDate]);

  const filteredTransactions = transactions.filter(tx => 
    (tx.items?.item_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveTransaction = async (data, idToUpdate) => {
    const url = idToUpdate ? `${import.meta.env.VITE_API_URL}/api/transactions/${idToUpdate}` : `${import.meta.env.VITE_API_URL}/api/transactions`;
    const method = idToUpdate ? 'PUT' : 'POST';
    const token = localStorage.getItem('token'); // <-- Get Token

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // <-- Send Token
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.status === 'error') {
        alert("Action Failed: " + result.message);
        return; 
      }
      setIsModalOpen(false);
      fetchTransactions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this transaction? The sold items will be returned to inventory.")) {
      const token = localStorage.getItem('token'); // <-- Get Token
      await fetch(`${import.meta.env.VITE_API_URL}/api/transactions/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` // <-- Send Token
        }
      });
      fetchTransactions();
    }
  };

  const totalItemsSold = transactions.reduce((sum, tx) => sum + tx.quantity_sold, 0);
  const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.total_amount), 0);

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto px-2 sm:px-0">
      
      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Daily Sales</h1>
        <button 
          onClick={() => { setTxnToEdit(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm w-full sm:w-auto"
        >
          <Plus size={20} /> Log New Sale
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <div className="flex gap-1 md:gap-2">
            <button onClick={prevMonth} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
            <button onClick={nextMonth} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs md:text-sm">
          {daysOfWeek.map(day => <div key={day} className="font-semibold text-gray-400 py-2">{day}</div>)}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const formattedDate = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isActive = selectedDate === formattedDate;
            return (
              <button 
                key={day}
                onClick={() => setSelectedDate(formattedDate)}
                className={`p-2 md:p-3 rounded-lg md:rounded-xl font-medium transition-colors ${
                  isActive ? 'bg-primaryBlue text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        
        {/* Table Totals Header */}
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
          <div className="flex gap-4 sm:gap-6 w-full sm:w-auto order-2 sm:order-1 justify-between sm:justify-start">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Items Sold</p>
              <p className="text-lg sm:text-xl font-bold">{totalItemsSold}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Revenue</p>
              <p className="text-lg sm:text-xl font-bold text-green-600">PHP {totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Search Bar specific to the Table */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b gap-3">
          <h2 className="text-md sm:text-lg font-bold text-gray-800 uppercase tracking-wide">
             {selectedDate}
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter transactions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-xl outline-primaryBlue bg-gray-50 text-sm"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="border-b-2 border-gray-100 text-xs sm:text-sm text-gray-500 uppercase">
                <th className="py-3 px-2 sm:px-4">Qty</th>
                <th className="py-3 px-2 sm:px-4">Item Name</th>
                <th className="py-3 px-2 sm:px-4 text-right">Amount</th>
                <th className="py-3 px-2 sm:px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="4" className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primaryBlue" /></td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500 text-sm">No transactions found.</td></tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold">{tx.quantity_sold}</td>
                    <td className="py-3 sm:py-4 px-2 sm:px-4 font-medium">{tx.items?.item_name || 'Unknown'}</td>
                    <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold text-green-600 text-right whitespace-nowrap">PHP {Number(tx.total_amount).toFixed(2)}</td>
                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-right space-x-1 sm:space-x-2 whitespace-nowrap">
                      <button onClick={() => { setTxnToEdit(tx); setIsModalOpen(true); }} className="p-1.5 sm:p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(tx.id)} className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveTransaction}
        selectedDate={selectedDate}
        txnToEdit={txnToEdit}
      />
    </div>
  );
}