// src/pages/DailySales.jsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Search, ShoppingCart, Download, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import TransactionModal from '../components/TransactionModal';
import { jsPDF } from 'jspdf';

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
      const token = localStorage.getItem('token'); 
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions?date=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
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

  // --- CART CHECKOUT HANDLER ---
  const handleSaveTransaction = async (cart, idToUpdate) => {
    const token = localStorage.getItem('token'); 
    setIsModalOpen(false);

    try {
      if (idToUpdate) {
        const cartItem = cart[0];
        await fetch(`${import.meta.env.VITE_API_URL}/api/transactions/${idToUpdate}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            item_id: cartItem.item_id,
            quantity_sold: cartItem.quantity,
            transaction_date: selectedDate
          }),
        });
      } else {
        // Save each item individually
        for (const cartItem of cart) {
          await fetch(`${import.meta.env.VITE_API_URL}/api/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              item_id: cartItem.item_id,
              quantity_sold: cartItem.quantity,
              transaction_date: selectedDate
            }),
          });
        }
        
        // Print the receipt!
        handleDownloadReceipt(cart);
      }
      
      toast.success(idToUpdate ? "Sale updated!" : "Checkout complete!");
      fetchTransactions();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during checkout.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this transaction? The sold items will be returned to inventory.")) {
      const token = localStorage.getItem('token'); 
      await fetch(`${import.meta.env.VITE_API_URL}/api/transactions/${id}`, { 
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTransactions();
    }
  };

  const handleExport = () => {
    if (filteredTransactions.length === 0) {
      toast.error("No transactions to export for this date!");
      return;
    }
    const csvData = filteredTransactions.map(tx => ({
      "Date": tx.transaction_date,
      "Item Name": tx.items?.item_name || 'Unknown',
      "Quantity Sold": tx.quantity_sold,
      "Revenue (PHP)": tx.total_amount
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(obj => Object.values(obj).map(val => `"${val}"`).join(',')).join('\n');
    
    const csvString = `${headers}\n${rows}`;
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Daily_Sales_${selectedDate}.csv`;
    a.click();
    toast.success("Sales exported successfully!");
  };
// ------------------------------------------------------------------
  // DIRECT PDF GENERATOR: POLISHED THERMAL RECEIPT LAYOUT
  // ------------------------------------------------------------------
  const handleDownloadReceipt = (cartArray) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const businessName = user.business_name || "Market BI";
      
      // Calculate dynamic height for the thermal paper
      const baseHeight = 70; 
      const itemHeight = 9; // Tighter vertical spacing per item
      const totalHeight = baseHeight + (cartArray.length * itemHeight);
      
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, totalHeight] });
      
      let y = 12;
      
      // --- HEADER SECTION ---
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(16);
      pdf.text(businessName, 40, y, { align: 'center' }); // Centered at X: 40mm (middle of 80mm)
      
      y += 5;
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(9);
      pdf.text("OFFICIAL RECEIPT", 40, y, { align: 'center' });
      
      y += 4;
      pdf.setFontSize(8);
      pdf.text(`Date: ${selectedDate}`, 40, y, { align: 'center' });
      
      y += 6;
      // Top dashed divider
      pdf.setLineDashPattern([1, 1], 0);
      pdf.setLineWidth(0.3);
      pdf.line(5, y, 75, y);
      
      // --- TABLE HEADERS ---
      y += 5;
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(9);
      pdf.text("QTY", 5, y);
      pdf.text("ITEM", 15, y);
      pdf.text("AMT(PHP)", 75, y, { align: 'right' }); // Right-aligned to X: 75mm
      
      y += 2;
      // Solid line under table headers for visual hierarchy
      pdf.setLineDashPattern([], 0); 
      pdf.setLineWidth(0.4);
      pdf.line(5, y, 75, y);
      
      y += 5;
      let grandTotal = 0;
      
      // --- DYNAMIC ITEMS LOOP ---
      cartArray.forEach(item => {
        const itemTotal = item.quantity * item.price;
        grandTotal += itemTotal;
        
        pdf.setFont('courier', 'bold');
        pdf.setFontSize(9);
        
        // Quantity
        pdf.text(item.quantity.toString(), 5, y);
        
        // Item Name (Truncated cleanly if too long)
        const shortName = item.item_name.length > 16 ? item.item_name.substring(0, 16) + "..." : item.item_name;
        pdf.text(shortName, 15, y);
        
        // Total Amount for this item row
        pdf.text(itemTotal.toFixed(2), 75, y, { align: 'right' });
        
        y += 4; // Small jump down for the sub-text
        
        // Unit Price calculation
        pdf.setFont('courier', 'normal');
        pdf.setFontSize(8);
        pdf.text(`@ ${Number(item.price).toFixed(2)}`, 17, y); // Indented perfectly under the item name
        
        y += 6; // Standard jump down for the next item in the cart
      });
      
      // --- TOTALS SECTION ---
      // Bottom dashed divider
      pdf.setLineDashPattern([1, 1], 0);
      pdf.setLineWidth(0.3);
      pdf.line(5, y, 75, y);
      
      y += 7;
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(12); // Larger font for the grand total
      pdf.text("TOTAL DUE:", 5, y);
      pdf.text(`PHP ${grandTotal.toFixed(2)}`, 75, y, { align: 'right' });
      
      // --- FOOTER SECTION ---
      y += 12;
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(8);
      pdf.text("Thank you for shopping with us!", 40, y, { align: 'center' });
      y += 4;
      pdf.setFontSize(7);
      pdf.text("Powered by Market BI POS", 40, y, { align: 'center' });
      
      // Save the resulting PDF
      pdf.save(`Receipt_${selectedDate}_${Date.now().toString().slice(-4)}.pdf`);
      
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error(`Print Failed: ${err.message}`);
    }
  };

  // Helper to re-print a single item from the table
  const printSingleItem = (tx) => {
    const pricePerItem = tx.quantity_sold > 0 ? Number(tx.total_amount) / tx.quantity_sold : 0;
    
    const fakeCartArray = [{
      item_name: tx.items?.item_name || 'Unknown',
      quantity: tx.quantity_sold,
      price: pricePerItem
    }];
    handleDownloadReceipt(fakeCartArray);
  };
  // ------------------------------------------------------------------

  const totalItemsSold = transactions.reduce((sum, tx) => sum + tx.quantity_sold, 0);
  const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.total_amount), 0);

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto px-2 sm:px-0 pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors">Daily Sales</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button onClick={handleExport} className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-5 py-2.5 rounded-xl font-medium shadow-sm w-full sm:w-auto transition-colors">
            <Download size={20} /> Export CSV
          </button>
          <button onClick={() => { setTxnToEdit(null); setIsModalOpen(true); }} className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm w-full sm:w-auto transition-colors">
            <ShoppingCart size={20} /> Open POS Checkout
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 overflow-hidden transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white transition-colors">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <div className="flex gap-1 md:gap-2">
            <button onClick={prevMonth} className="p-1.5 md:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={nextMonth} className="p-1.5 md:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs md:text-sm">
          {daysOfWeek.map(day => <div key={day} className="font-semibold text-gray-400 dark:text-gray-500 py-2">{day}</div>)}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const formattedDate = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isActive = selectedDate === formattedDate;
            return (
              <button 
                key={day}
                onClick={() => setSelectedDate(formattedDate)}
                className={`p-2 md:p-3 rounded-lg md:rounded-xl font-medium transition-colors ${
                  isActive ? 'bg-primaryBlue text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 transition-colors">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
          <div className="flex gap-4 sm:gap-6 w-full sm:w-auto order-2 sm:order-1 justify-between sm:justify-start">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Items Sold</p>
              <p className="text-lg sm:text-xl font-bold dark:text-white transition-colors">{totalItemsSold}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Revenue</p>
              <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 transition-colors">PHP {totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-700 gap-3 transition-colors">
          <h2 className="text-md sm:text-lg font-bold text-gray-800 dark:text-white uppercase tracking-wide transition-colors">
             {selectedDate}
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter transactions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl outline-primaryBlue bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="border-b-2 border-gray-100 dark:border-gray-700 text-xs sm:text-sm text-gray-500 dark:text-gray-400 uppercase transition-colors">
                <th className="py-3 px-2 sm:px-4">Qty</th>
                <th className="py-3 px-2 sm:px-4">Item Name</th>
                <th className="py-3 px-2 sm:px-4 text-right">Amount</th>
                <th className="py-3 px-2 sm:px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 animate-pulse">
                    <td className="py-4 px-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-8"></div></td>
                    <td className="py-4 px-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-48"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-24 ml-auto"></div></td>
                    <td className="py-4 px-4 text-right"><div className="flex justify-end gap-2"><div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div><div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div></div></td>
                  </tr>
                ))
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-full mb-4 border-2 border-dashed border-gray-200 dark:border-gray-700 transition-colors">
                        <ShoppingCart size={48} className="text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No sales for this date</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                        {searchTerm ? "No transactions match your search." : "You haven't recorded any sales for this day yet. Ready to make some money?"}
                      </p>
                      {!searchTerm && (
                        <button onClick={() => { setTxnToEdit(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-green-600 transition-colors">
                          <Plus size={20} /> Log a Sale
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold dark:text-gray-200">{tx.quantity_sold}</td>
                    <td className="py-3 sm:py-4 px-2 sm:px-4 font-medium dark:text-gray-200">{tx.items?.item_name || 'Unknown'}</td>
                    <td className="py-3 sm:py-4 px-2 sm:px-4 font-bold text-green-600 dark:text-green-400 text-right whitespace-nowrap">PHP {Number(tx.total_amount).toFixed(2)}</td>
                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-right space-x-1 sm:space-x-2 whitespace-nowrap">
                      <button onClick={() => printSingleItem(tx)} className="p-1.5 sm:p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white rounded-lg transition-colors" title="Download Receipt PDF">
                        <Printer size={16} />
                      </button>
                      <button onClick={() => { setTxnToEdit(tx); setIsModalOpen(true); }} className="p-1.5 sm:p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit Sale">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} className="p-1.5 sm:p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete Sale">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTransaction} selectedDate={selectedDate} txnToEdit={txnToEdit} />

      {/* Note: We have completely removed the hidden HTML receipt container and html2canvas! */}
    </div>
  );
}