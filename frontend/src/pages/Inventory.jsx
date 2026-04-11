// src/pages/Inventory.jsx
import { useState, useEffect } from 'react';
import { Plus, Filter, ArrowUpDown, Edit, Trash2, Loader2 } from 'lucide-react';
import ItemModal from '../components/ItemModal';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchInventory = async () => {
    setIsLoading(true);
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory`);
    const result = await response.json();
    if (result.status === 'success') setItems(result.data);
    setIsLoading(false);
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleSave = async (data, id) => {
    const url = id 
  ? `${import.meta.env.VITE_API_URL}/api/inventory/${id}` 
  : `${import.meta.env.VITE_API_URL}/api/inventory`;
    const method = id ? 'PUT' : 'POST';

    await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Inventory and Pricing</h1>
        <button onClick={() => { setSelectedItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-primaryBlue text-white px-5 py-2.5 rounded-xl font-medium">
          <Plus size={20} /> Add New Item
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-max">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="py-4 px-6 text-sm font-semibold text-gray-500">Item Name</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-500">Stock</th>
                {/* 1. Added Capital Header back here */}
                <th className="py-4 px-6 text-sm font-semibold text-gray-500">Capital</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-500">Selling Price</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primaryBlue" /></td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-800">{item.item_name}</td>
                  <td className={`py-4 px-6 font-bold ${item.quantity <= 5 ? 'text-red-500' : 'text-gray-700'}`}>{item.quantity}</td>
                  {/* 2. Added Capital Data back here */}
                  <td className="py-4 px-6 font-medium text-gray-500">PHP {item.capital.toFixed(2)}</td>
                  <td className="py-4 px-6 font-bold text-green-600">PHP {item.selling_price.toFixed(2)}</td>
                  <td className="py-4 px-6 text-right space-x-2">
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