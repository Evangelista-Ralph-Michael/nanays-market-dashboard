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
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token'); 
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.status === 'success') setItems(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  useEffect(() => {
    if (location.state?.editItem) {
      setSelectedItem(location.state.editItem);
      setIsModalOpen(true);
      window.history.replaceState({}, document.title); 
    }
  }, [location.state]);

  const filteredItems = items
    .filter(item => item.item_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.item_name.localeCompare(b.item_name));

  const handleSave = async (data, id) => {
    const url = id ? `${import.meta.env.VITE_API_URL}/api/inventory/${id}` : `${import.meta.env.VITE_API_URL}/api/inventory`;
    const method = id ? 'PUT' : 'POST';
    const token = localStorage.getItem('token'); 

    await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

  const handleExport = () => {
    if (filteredItems.length === 0) {
      toast.error("No inventory to export!");
      return;
    }
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
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors">Inventory Management</h1>
        
        {/* NEW: Added Search bar specific to Inventory! */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search inventory..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl outline-primaryBlue bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors text-sm"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button onClick={handleExport} className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-5 py-2.5 rounded-xl font-medium shadow-sm w-full sm:w-auto transition-colors">
            <Download size={20} /> Export CSV
          </button>
          <button onClick={() => { setSelectedItem(null); setIsModalOpen(true); }} className="flex items-center justify-center gap-2 bg-primaryBlue hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium w-full sm:w-auto shadow-sm transition-colors">
            <Plus size={20} /> Add New Item
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 transition-colors">
              <tr>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Item Name</th>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-500 dark:text-gray-400">Stock</th>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-500 dark:text-gray-400">Capital</th>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Selling Price</th>
                <th className="py-4 px-4 sm:px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 animate-pulse">
                    <td className="py-4 px-6"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 mb-2"></div><div className="h-3 bg-gray-100 dark:bg-gray-600 rounded-md w-1/2"></div></td>
                    <td className="py-4 px-6"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-16"></div></td>
                    <td className="py-4 px-6"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-16"></div></td>
                    <td className="py-4 px-6"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-12"></div></td>
                    <td className="py-4 px-6 text-right"><div className="flex justify-end gap-2"><div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div><div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div></div></td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-full mb-4 border-2 border-dashed border-gray-200 dark:border-gray-700 transition-colors">
                        <Package size={48} className="text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Your inventory is empty</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                        {searchTerm ? "No items match your search." : "Get started by adding your first product to track your stock and capital."}
                      </p>
                      {!searchTerm && (
                        <button onClick={() => { setSelectedItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-primaryBlue text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-blue-600 transition-colors">
                          <Plus size={20} /> Add First Item
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="py-4 px-4 sm:px-6 font-medium text-gray-800 dark:text-gray-200">{item.item_name}</td>
                  <td className={`py-4 px-4 sm:px-6 font-bold ${item.quantity <= 5 ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{item.quantity}</td>
                  <td className="py-4 px-4 sm:px-6 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">PHP {item.capital.toFixed(2)}</td>
                  <td className="py-4 px-4 sm:px-6 font-bold text-green-600 dark:text-green-400 whitespace-nowrap">PHP {item.selling_price.toFixed(2)}</td>
                  <td className="py-4 px-4 sm:px-6 text-right space-x-1 sm:space-x-2 whitespace-nowrap">
                    <button onClick={() => { setSelectedItem(item); setIsModalOpen(true); }} className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} item={selectedItem} />
    </div>
  );
}