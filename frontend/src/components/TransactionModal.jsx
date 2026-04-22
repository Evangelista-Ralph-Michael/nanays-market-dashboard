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
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const token = localStorage.getItem('token'); 
      
      fetch(`${import.meta.env.VITE_API_URL}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
              setIsDropdownOpen(false); 
            }
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, txnToEdit]);

  if (!isOpen) return null;

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
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-xl transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{txnToEdit ? 'Edit Transaction' : 'Log New Sale'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search & Select Item</label>
            
           {isLoading ? (
              <div className="flex items-center gap-2 text-primaryBlue p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-sm font-medium transition-colors">
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
                  className="w-full pl-10 pr-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-primaryBlue font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                />
                
                {searchTerm && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedItem(null);
                      setIsDropdownOpen(true);
                      document.querySelector('input[placeholder="Click to see list or type to search..."]').focus();
                    }}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            
            {isDropdownOpen && !selectedItem && !isLoading && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto transition-colors">
                {filteredItems.length > 0 ? filteredItems.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      if (item.quantity === 0) return; 
                      setSelectedItem(item);
                      setSearchTerm(item.item_name);
                      setIsDropdownOpen(false); 
                    }}
                    className={`p-3 border-b border-gray-100 dark:border-gray-600 last:border-0 flex justify-between ${item.quantity === 0 ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60' : 'hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer'} text-gray-900 dark:text-white transition-colors`}
                  >
                    <span className="font-medium">{item.item_name}</span>
                    <span className={`text-sm ${item.quantity === 0 ? 'text-red-500 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-300'}`}>
                      {item.quantity === 0 ? 'OUT OF STOCK' : `Stock: ${item.quantity} | ₱${item.selling_price}`}
                    </span>
                  </div>
                )) : (
                  <div className="p-3 text-sm text-gray-500 dark:text-gray-400">No items found.</div>
                )}
              </div>
            )}
            
            {selectedItem && (
              <div className="mt-2 text-sm font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 p-2.5 rounded-lg border border-green-100 dark:border-green-800 transition-colors">
                Selling Price: PHP {selectedItem.selling_price.toFixed(2)} each
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity Sold</label>
            <input 
              type="number" 
              min="1" 
              max={maxQty}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required 
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-primaryBlue text-lg font-bold bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors" 
            />
            {selectedItem && quantity > maxQty && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1 font-medium">Exceeds available stock! (Max: {maxQty})</p>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={!selectedItem || quantity > maxQty}
            className="w-full bg-green-500 text-white py-3.5 rounded-xl font-bold hover:bg-green-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed mt-2 text-lg shadow-sm"
          >
            {txnToEdit ? 'Update Sale' : 'Record Sale'}
          </button>
        </form>
      </div>
    </div>
  );
}