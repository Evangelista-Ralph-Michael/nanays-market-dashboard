// src/pages/DailySales.jsx
import { useState, useEffect } from 'react';
import { Download, ChevronLeft, ChevronRight, Plus, Loader2, Edit, Trash2 } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';

export default function DailySales() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txnToEdit, setTxnToEdit] = useState(null);

  // --- DYNAMIC CALENDAR LOGIC ---
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Tracks the month shown in the calendar
  
  // Format dates cleanly for API (YYYY-MM-DD)
  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date())); // Defaults to TODAY

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // Get days in the current viewing month
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  // Change month handlers
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  // ------------------------------

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions?date=${selectedDate}`);
      const result = await response.json();
      if (result.status === 'success') setTransactions(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [selectedDate]);

  // Handle Save (Add or Edit)
  // src/pages/DailySales.jsx (Update just this function)

  const handleSaveTransaction = async (data, idToUpdate) => {
    const url = idToUpdate 
  ? `${import.meta.env.VITE_API_URL}/api/transactions/${idToUpdate}` 
  : `${import.meta.env.VITE_API_URL}/api/transactions`;
    const method = idToUpdate ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      // Check if the backend threw our new stock error
      if (result.status === 'error') {
        alert("Action Failed: " + result.message);
        return; // Stop here, do not close the modal
      }

      setIsModalOpen(false);
      fetchTransactions();
    } catch (error) {
      console.error("Failed to save transaction:", error);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (window.confirm("Delete this transaction? The sold items will be returned to inventory.")) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/transactions/${id}`, { method: 'DELETE' });
      fetchTransactions();
    }
  };

  const totalItemsSold = transactions.reduce((sum, tx) => sum + tx.quantity_sold, 0);
  const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.total_amount), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Daily Sales</h1>
        <button 
          onClick={() => { setTxnToEdit(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm"
        >
          <Plus size={20} /> Log New Sale
        </button>
      </div>

      {/* Dynamic Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center">
          {daysOfWeek.map(day => <div key={day} className="text-sm font-semibold text-gray-400 py-2">{day}</div>)}
          
          {/* Empty slots for the first day offset */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
          
          {/* Actual days */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const formattedDate = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isActive = selectedDate === formattedDate;
            
            return (
              <button 
                key={day}
                onClick={() => setSelectedDate(formattedDate)}
                className={`p-3 rounded-xl font-medium transition-colors ${
                  isActive ? 'bg-primaryBlue text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between mb-6 border-b pb-4">
          <h2 className="text-lg font-bold text-gray-800 uppercase">Transactions for {selectedDate}</h2>
          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-sm text-gray-500">Items Sold</p>
              <p className="text-xl font-bold">{totalItemsSold}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-xl font-bold text-green-600">PHP {totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-gray-100 text-sm text-gray-500 uppercase">
              <th className="py-3 px-4">Qty</th>
              <th className="py-3 px-4">Item Name</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="4" className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primaryBlue" /></td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-8 text-gray-500">No transactions today.</td></tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 font-bold">{tx.quantity_sold}</td>
                  <td className="py-4 px-4 font-medium">{tx.items?.item_name || 'Unknown'}</td>
                  <td className="py-4 px-4 font-bold text-green-600 text-right">PHP {Number(tx.total_amount).toFixed(2)}</td>
                  <td className="py-4 px-4 text-right space-x-2">
                    <button onClick={() => { setTxnToEdit(tx); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(tx.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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