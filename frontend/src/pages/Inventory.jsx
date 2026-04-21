// src/pages/Inventory.jsx
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package, Loader2, Download } from 'lucide-react';

import toast from 'react-hot-toast';
import ItemModal from '../components/ItemModal';

export default function Inventory() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // NEW: Search state

  // 1. Update the GET fetch
 const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token'); 
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory`, {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });
      const result = await response.json();
      if (result.status === 'success') setItems(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // ---> ADD THIS MISSING BLOCK RIGHT HERE <---
  useEffect(() => { 
    fetchInventory(); 
  }, []);

  // --- 2. ADD THIS NEW BLOCK TO CATCH THE CLICK! ---
  useEffect(() => {
    if (location.state?.editItem) {
      setSelectedItem(location.state.editItem); // Select the clicked item
      setIsModalOpen(true);                     // Open the modal automatically
      
      // Clear the message so it doesn't keep opening if you refresh the page
      window.history.replaceState({}, document.title); 
    }
  }, [location.state]);

  // -----------------------------------------

  // NEW: Filter items based on search bar
const filteredItems = items
    .filter(item => item.item_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.item_name.localeCompare(b.item_name));

const handleSave = async (data, id) => {
    const url = id ? `${import.meta.env.VITE_API_URL}/api/inventory/${id}` : `${import.meta.env.VITE_API_URL}/api/inventory`;
    const method = id ? 'PUT' : 'POST';
    const token = localStorage.getItem('token'); // Get token

    await fetch(url, {
      method: method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Send the VIP pass!
      },
      body: JSON.stringify(data),
    });
    setIsModalOpen(false);
    fetchInventory();
  };
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/${id}`, { method: 'DELETE' });
      fetchInventory();
    }
  };

  // NEW: Export Inventory to CSV
  const handleExport = () => {
    if (filteredItems.length === 0) {
      toast.error("No inventory to export!");
      return;
    }

    // Format data (we even calculate Total Stock Value for them!)
    const csvData = filteredItems.map(item => ({
      "Item Name": item.item_name,
      "Stock Quantity": item.quantity,
      "Capital (PHP)": item.capital,
      "Selling Price (PHP)": item.selling_price,
      "Total Value (PHP)": item.quantity * item.selling_price
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(obj => Object.values(obj).map(val => `"${val}"`).join(',')).join('\n');
    
    const csvString = `${headers}\n${rows}`;
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Inventory_Report.csv`;
    a.click();
    
    toast.success("Inventory exported successfully!");
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto px-2 sm:px-0">
      
      {/* RESPONSIVE HEADER: Stacks on mobile, side-by-side on web */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Inventory Management</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-medium shadow-sm w-full sm:w-auto transition-colors"
          >
            <Download size={20} /> Export CSV
          </button>
          <button 
            onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-primaryBlue hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm w-full sm:w-auto transition-colors"
          >
            <Plus size={20} /> Add New Item
          </button>
        </div>
          
          <button 
            onClick={() => { setSelectedItem(null); setIsModalOpen(true); }} 
            className="flex items-center justify-center gap-2 bg-primaryBlue text-white px-5 py-2.5 rounded-xl font-medium w-full sm:w-auto shadow-sm"
          >
            <Plus size={20} /> Add New Item
          </button>
        </div>


      {/* RESPONSIVE TABLE CONTAINER: Scrolls horizontally on small screens */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-500 whitespace-nowrap">Item Name</th>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-500">Stock</th>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-500">Capital</th>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-500 whitespace-nowrap">Selling Price</th>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Generate 5 fake rows to shimmer while loading
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-gray-100 animate-pulse">
                    <td className="py-4 px-6">
                      <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded-md w-1/2"></div>
                    </td>
                    <td className="py-4 px-6"><div className="h-5 bg-gray-200 rounded-md w-16"></div></td>
                    <td className="py-4 px-6"><div className="h-5 bg-gray-200 rounded-md w-16"></div></td>
                    <td className="py-4 px-6">
                      <div className="h-6 bg-gray-200 rounded-full w-12"></div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
  <tr>
    <td colSpan="5" className="py-16">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="bg-gray-50 p-6 rounded-full mb-4 border-2 border-dashed border-gray-200">
          <Package size={48} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Your inventory is empty</h3>
        <p className="text-gray-500 mb-6 max-w-sm">
          {searchTerm ? "No items match your search." : "Get started by adding your first product to track your stock and capital."}
        </p>
        {!searchTerm && (
          <button 
            onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primaryBlue text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-blue-600 transition-colors"
          >
            <Plus size={20} /> Add First Item
          </button>
        )}
      </div>
    </td>
  </tr>
) : filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 sm:px-6 font-medium text-gray-800">{item.item_name}</td>
                  <td className={`py-4 px-4 sm:px-6 font-bold ${item.quantity <= 5 ? 'text-red-500' : 'text-gray-700'}`}>{item.quantity}</td>
                  <td className="py-4 px-4 sm:px-6 font-medium text-gray-500 whitespace-nowrap">PHP {item.capital.toFixed(2)}</td>
                  <td className="py-4 px-4 sm:px-6 font-bold text-green-600 whitespace-nowrap">PHP {item.selling_price.toFixed(2)}</td>
                  <td className="py-4 px-4 sm:px-6 text-right space-x-1 sm:space-x-2 whitespace-nowrap">
                    <button onClick={() => { setSelectedItem(item); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ItemModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        item={selectedItem} 
      />
    </div>
  );
}