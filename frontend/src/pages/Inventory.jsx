// src/pages/Inventory.jsx
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, Search } from 'lucide-react';
import ItemModal from '../components/ItemModal';

export default function Inventory() {
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
  // ------------------------------------------

  // NEW: Filter items based on search bar
  const filteredItems = items.filter(item => 
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto px-2 sm:px-0">
      
      {/* RESPONSIVE HEADER: Stacks on mobile, side-by-side on web */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Inventory</h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Inventory Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-xl outline-primaryBlue bg-white shadow-sm"
            />
          </div>
          
          <button 
            onClick={() => { setSelectedItem(null); setIsModalOpen(true); }} 
            className="flex items-center justify-center gap-2 bg-primaryBlue text-white px-5 py-2.5 rounded-xl font-medium w-full sm:w-auto shadow-sm"
          >
            <Plus size={20} /> Add New Item
          </button>
        </div>
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
                <tr><td colSpan="5" className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primaryBlue" /></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500">No items found.</td></tr>
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