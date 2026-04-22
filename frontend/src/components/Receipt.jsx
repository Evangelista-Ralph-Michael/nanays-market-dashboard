// src/components/Receipt.jsx

export default function Receipt({ transaction }) {
  if (!transaction) return null;

  // Grab the business name safely
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const businessName = user.business_name || "Nanay's Market";

  const date = new Date(transaction.transaction_date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  // Calculate the exact unit price
  const unitPrice = Number(transaction.total_amount) / transaction.quantity_sold;

  return (
    <div className="p-6 w-[80mm] text-[#000000] bg-[#ffffff] font-mono text-sm mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold uppercase mb-1">{businessName}</h2>
        <p className="text-xs text-[#4B5563]">OFFICIAL RECEIPT</p>
        <p className="text-xs text-[#4B5563]">{date}</p>
      </div>

      {/* Items Section */}
      <div className="border-t-2 border-b-2 border-dashed border-[#9CA3AF] py-4 mb-4">
        
        {/* NEW 3-COLUMN HEADER */}
        <div className="flex justify-between font-bold mb-2 text-xs uppercase">
          <span className="w-1/2 text-left">Qty & Item</span>
          <span className="w-1/4 text-center">Price</span>
          <span className="w-1/4 text-right">Amount</span>
        </div>
        
        {/* NEW 3-COLUMN DATA ROW (Removed the text underneath) */}
        <div className="flex justify-between items-start mb-2">
          <span className="w-1/2 text-left pr-2">{transaction.quantity_sold}x {transaction.items?.item_name}</span>
          <span className="w-1/4 text-center whitespace-nowrap">₱{unitPrice.toFixed(2)}</span>
          <span className="w-1/4 text-right whitespace-nowrap">₱{Number(transaction.total_amount).toFixed(2)}</span>
        </div>

      </div>

      {/* Total Section */}
      <div className="flex justify-between font-bold text-xl mb-6">
        <span>TOTAL</span>
        <span>₱{Number(transaction.total_amount).toFixed(2)}</span>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-xs text-[#6B7280]">
        <p>Thank you for shopping!</p>
        <p>Please come again.</p>
        <p className="mt-3 text-[10px]">Powered by Market BI</p>
      </div>
    </div>
  );
}