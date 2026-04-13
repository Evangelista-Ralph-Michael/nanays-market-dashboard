// src/components/TransactionModal.jsx
import { X, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TransactionModal({ isOpen, onClose, onSave, selectedDate, txnToEdit }) {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Fetch items and pre-fill data if editing
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('token'); // <-- 1. Get the token!
      
      // 2. Add the token to the headers and use the proper VITE_API_URL
      fetch(`${import.meta.env.VITE_API_URL}/api/inventory`, {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      })
        .then(res => res.json())
        .then(result => {
          if (result.status === 'success') {
            setItems(result.data);
            // If editing, find the item and set it
            if (txnToEdit) {
              const item = result.data.find(i => i.id === txnToEdit.item_id);
              setSelectedItem(item);
              setQuantity(txnToEdit.quantity_sold);
              setSearchTerm(item?.item_name || '');
            } else {
              setSelectedItem(null);
              setQuantity(1);
              setSearchTerm('');
            }
          }
        });
    }
  }, [isOpen, txnToEdit]);

  if (!isOpen) return null;

  // Filter items based on user search
  const filteredItems = items.filter(item => 
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem) return alert("Please select an item from the list.");
    
    onSave({
      item_id: selectedItem.id,
      quantity_sold: parseInt(quantity),
      transaction_date: selectedDate,
    }, txnToEdit?.id); // Pass the ID if we are updating!
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{txnToEdit ? 'Edit Transaction' : 'Log New Sale'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Custom Searchable Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search & Select Item</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Type to search inventory..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedItem(null); // Reset selection if they type something new
                }}
                className="w-full pl-10 p-2.5 border rounded-lg outline-primaryBlue"
              />
            </div>
            
            {/* Show dropdown list only if they are typing and haven't fully selected yet */}
            {searchTerm && !selectedItem && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredItems.length > 0 ? filteredItems.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      setSelectedItem(item);
                      setSearchTerm(item.item_name);
                    }}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex justify-between"
                  >
                    <span className="font-medium">{item.item_name}</span>
                    <span className="text-sm text-gray-500">Stock: {item.quantity}</span>
                  </div>
                )) : (
                  <div className="p-3 text-sm text-gray-500">No items found.</div>
                )}
              </div>
            )}
            
            {/* Show selected price feedback */}
            {selectedItem && (
              <p className="text-sm text-green-600 mt-2 font-medium">
                Selected: PHP {selectedItem.selling_price} each (Current Stock: {selectedItem.quantity})
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Sold</label>
            <input 
              type="number" 
              min="1" 
              // Set the absolute maximum they can type based on current stock
              max={selectedItem ? (txnToEdit ? selectedItem.quantity + txnToEdit.quantity_sold : selectedItem.quantity) : ""}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required 
              className="w-full p-2.5 border rounded-lg outline-primaryBlue text-lg font-bold" 
            />
            {/* Visual warning if they try to go over */}
            {selectedItem && quantity > (txnToEdit ? selectedItem.quantity + txnToEdit.quantity_sold : selectedItem.quantity) && (
              <p className="text-red-500 text-sm mt-1 font-medium">Exceeds available stock!</p>
            )}
          </div>
          
          <button 
            type="submit" 
            // Disable the button if they exceed the stock
            disabled={selectedItem && quantity > (txnToEdit ? selectedItem.quantity + txnToEdit.quantity_sold : selectedItem.quantity)}
            className="w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
          >
            {txnToEdit ? 'Update Sale' : 'Record Sale'}
          </button>
        </form>
      </div>
    </div>
  );
}