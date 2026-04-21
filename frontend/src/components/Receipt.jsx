// src/components/Receipt.jsx
import { forwardRef } from 'react';

const Receipt = forwardRef(({ transaction }, ref) => {
  if (!transaction) return null;

  // Grab the business name from the logged-in user!
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const businessName = user.business_name || "Nanay's Market";

  const date = new Date(transaction.transaction_date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div ref={ref} className="p-6 w-[80mm] text-black bg-white font-mono text-sm mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold uppercase mb-1">{businessName}</h2>
        <p className="text-xs text-gray-600">OFFICIAL RECEIPT</p>
        <p className="text-xs text-gray-600">{date}</p>
      </div>

      {/* Items Section */}
      <div className="border-t-2 border-b-2 border-dashed border-gray-400 py-4 mb-4">
        <div className="flex justify-between font-bold mb-2 text-xs uppercase">
          <span>Qty & Item</span>
          <span>Amount</span>
        </div>
        <div className="flex justify-between items-end mb-2">
          <span className="pr-2">{transaction.quantity_sold}x {transaction.items?.item_name}</span>
          <span className="whitespace-nowrap">₱{Number(transaction.total_amount).toFixed(2)}</span>
        </div>
      </div>

      {/* Total Section */}
      <div className="flex justify-between font-bold text-xl mb-6">
        <span>TOTAL</span>
        <span>₱{Number(transaction.total_amount).toFixed(2)}</span>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-xs text-gray-500">
        <p>Thank you for shopping!</p>
        <p>Please come again.</p>
        <p className="mt-3 text-[10px]">Powered by Market BI</p>
      </div>
    </div>
  );
});

export default Receipt;