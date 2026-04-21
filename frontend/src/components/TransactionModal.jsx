// src/components/TransactionModal.jsx
import { X, Search, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function TransactionModal({ isOpen, onClose, onSave, selectedDate, txnToEdit }) {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // NEW: A state to keep the dropdown open when you click the search box
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch items and pre-fill data if editing
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const token = localStorage.getItem('token'); 
      
      fetch(`${import.meta.env.VITE_API_URL}/api/inventory`, {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      })
        .then(res => res.json())
        .then(result => {
          if (result.status === 'success') {
            setItems(result.data);
            if (txnToEdit) {
              const item = result.data.find(i => i.id === txnToEdit.item_id);
              setSelectedItem(item);
              setQuantity(txnToEdit.quantity_sold);
              setSearchTerm(item?.item_name || '');
            } else {
              setSelectedItem(null);
              setQuantity(1);
              setSearchTerm('');
              setIsDropdownOpen(false); // Reset dropdown
            }
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, txnToEdit]);

  if (!isOpen) return null;

  // Filter items based on user search
 const filteredItems = items
    .filter(item => item.item_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.item_name.localeCompare(b.item_name));
    
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem) {
      toast.error("Please select an item from the list.");
      return;
    }
    
    onSave({
      item_id: selectedItem.id,
      quantity_sold: parseInt(quantity),
      transaction_date: selectedDate,
    }, txnToEdit?.id); 
  };

  const maxQty = selectedItem ? (txnToEdit ? selectedItem.quantity + txnToEdit.quantity_sold : selectedItem.quantity) : 0;

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
            
           {isLoading ? (
              <div className="flex items-center gap-2 text-primaryBlue p-3 border rounded-lg bg-gray-50 text-sm font-medium">
                <Loader2 className="animate-spin" size={18} /> Loading inventory...
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Click to see list or type to search..."
                  value={searchTerm}
                  onFocus={() => setIsDropdownOpen(true)} 
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedItem(null); 
                    setIsDropdownOpen(true);
                  }}
                  // I added pr-10 here so text doesn't overlap the new X button
                  className="w-full pl-10 pr-10 p-3 border rounded-lg outline-primaryBlue font-medium"
                />
                
                {/* NEW: The 'X' Clear Button */}
                {searchTerm && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedItem(null);
                      setIsDropdownOpen(true);
                      // Keep focus on the input after clearing
                      document.querySelector('input[placeholder="Click to see list or type to search..."]').focus();
                    }}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            
            {/* Show dropdown list if open AND no final item is selected */}
            {isDropdownOpen && !selectedItem && !isLoading && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredItems.length > 0 ? filteredItems.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      if (item.quantity === 0) return; // Prevent clicking out of stock
                      setSelectedItem(item);
                      setSearchTerm(item.item_name);
                      setIsDropdownOpen(false); // Close list
                    }}
                    className={`p-3 border-b last:border-0 flex justify-between ${item.quantity === 0 ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:bg-gray-50 cursor-pointer'}`}
                  >
                    <span className="font-medium">{item.item_name}</span>
                    <span className={`text-sm ${item.quantity === 0 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                      {item.quantity === 0 ? 'OUT OF STOCK' : `Stock: ${item.quantity} | ₱${item.selling_price}`}
                    </span>
                  </div>
                )) : (
                  <div className="p-3 text-sm text-gray-500">No items found.</div>
                )}
              </div>
            )}
            
            {/* Show selected price feedback */}
            {selectedItem && (
              <div className="mt-2 text-sm font-bold text-green-700 bg-green-50 p-2.5 rounded-lg border border-green-100">
                Selling Price: PHP {selectedItem.selling_price.toFixed(2)} each
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Sold</label>
            <input 
              type="number" 
              min="1" 
              max={maxQty}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required 
              className="w-full p-3 border rounded-lg outline-primaryBlue text-lg font-bold" 
            />
            {selectedItem && quantity > maxQty && (
              <p className="text-red-500 text-sm mt-1 font-medium">Exceeds available stock! (Max: {maxQty})</p>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={!selectedItem || quantity > maxQty}
            className="w-full bg-green-500 text-white py-3.5 rounded-xl font-bold hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mt-2 text-lg shadow-sm"
          >
            {txnToEdit ? 'Update Sale' : 'Record Sale'}
          </button>
        </form>
      </div>
    </div>
  );
}