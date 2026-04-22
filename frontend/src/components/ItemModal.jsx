// src/components/ItemModal.jsx
import { X } from 'lucide-react';

export default function ItemModal({ isOpen, onClose, onSave, item }) {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      item_name: formData.get('item_name'),
      quantity: parseInt(formData.get('quantity')),
      capital: parseFloat(formData.get('capital')),
      selling_price: parseFloat(formData.get('selling_price')),
    };
    onSave(data, item?.id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-xl transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{item ? 'Edit Item' : 'Add New Item'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Item Name</label>
            <input name="item_name" defaultValue={item?.item_name} required className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-primaryBlue bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
              <input name="quantity" type="number" defaultValue={item?.quantity} required className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-primaryBlue bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Capital</label>
              <input name="capital" type="number" step="0.01" defaultValue={item?.capital} required className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-primaryBlue bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selling Price</label>
            <input name="selling_price" type="number" step="0.01" defaultValue={item?.selling_price} required className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-primaryBlue bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors" />
          </div>
          <button type="submit" className="w-full bg-primaryBlue text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors">
            {item ? 'Update Item' : 'Save Item'}
          </button>
        </form>
      </div>
    </div>
  );
}