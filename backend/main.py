# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import supabase # Import our database client
import calendar

app = FastAPI(title="Nanay's Market API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Changed from just localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Nanay's Market Backend"}

# A test endpoint to check our database connection
@app.get("/test-db")
def test_db_connection():
    try:
        # We attempt to fetch the items table (which should be empty but exist)
        response = supabase.table("items").select("*").limit(1).execute()
        return {"status": "Success! Connected to Supabase.", "data": response.data}
    except Exception as e:
        return {"status": "Error connecting to Supabase", "details": str(e)}
    
@app.get("/api/inventory")
def get_inventory():
    try:
        # Fetch all records from the 'items' table, ordered by item_name
        response = supabase.table("items").select("*").order("item_name").execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    

# backend/main.py
from pydantic import BaseModel # Add this import at the top

# 1. Define a Pydantic model for data validation
class ItemCreate(BaseModel):
    item_name: str
    quantity: int
    capital: float
    selling_price: float

@app.post("/api/inventory")
def add_item(item: ItemCreate):
    try:
        data = supabase.table("items").insert(item.dict()).execute()
        return {"status": "success", "data": data.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.put("/api/inventory/{item_id}")
def update_item(item_id: str, item: ItemCreate):
    try:
        data = supabase.table("items").update(item.dict()).eq("id", item_id).execute()
        return {"status": "success", "data": data.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.delete("/api/inventory/{item_id}")
def delete_item(item_id: str):
    try:
        supabase.table("items").delete().eq("id", item_id).execute()
        return {"status": "success", "message": "Item deleted"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# backend/main.py
# (Keep all your existing code at the top!)

# 1. Add this new Pydantic model near your ItemCreate model
class TransactionCreate(BaseModel):
    item_id: str
    transaction_date: str # e.g., "2026-03-02"
    quantity_sold: int

# 2. Add the GET endpoint to fetch transactions (with an optional date filter)
@app.get("/api/transactions")
def get_transactions(date: str = None):
    try:
        # We use a join here: "items(item_name)" pulls the name from the items table!
        query = supabase.table("transactions").select("*, items(item_name)")
        
        if date:
            query = query.eq("transaction_date", date)
            
        response = query.execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 3. Add the POST endpoint to create a new transaction
# backend/main.py (Replace your POST and PUT endpoints)

@app.post("/api/transactions")
def add_transaction(txn: TransactionCreate):
    try:
        item_response = supabase.table("items").select("selling_price, quantity").eq("id", txn.item_id).single().execute()
        item_data = item_response.data
        
        # --- NEW SECURITY CHECK ---
        if txn.quantity_sold > item_data["quantity"]:
            return {"status": "error", "message": f"Not enough stock! Only {item_data['quantity']} available."}
        # --------------------------

        total_amount = item_data["selling_price"] * txn.quantity_sold
        new_txn = {
            "item_id": txn.item_id,
            "transaction_date": txn.transaction_date,
            "quantity_sold": txn.quantity_sold,
            "total_amount": total_amount
        }
        transaction_response = supabase.table("transactions").insert(new_txn).execute()
        
        new_stock = item_data["quantity"] - txn.quantity_sold
        supabase.table("items").update({"quantity": new_stock}).eq("id", txn.item_id).execute()
        
        return {"status": "success", "data": transaction_response.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.put("/api/transactions/{txn_id}")
def update_transaction(txn_id: str, txn: TransactionCreate):
    try:
        old_txn = supabase.table("transactions").select("*").eq("id", txn_id).single().execute().data
        item_data = supabase.table("items").select("*").eq("id", txn.item_id).single().execute().data
        
        qty_diff = old_txn["quantity_sold"] - txn.quantity_sold
        new_stock = item_data["quantity"] + qty_diff
        
        # --- NEW SECURITY CHECK ---
        if new_stock < 0:
            return {"status": "error", "message": "Cannot update. This exceeds your available inventory stock."}
        # --------------------------

        new_total_amount = item_data["selling_price"] * txn.quantity_sold
        
        supabase.table("transactions").update({
            "item_id": txn.item_id,
            "transaction_date": txn.transaction_date,
            "quantity_sold": txn.quantity_sold,
            "total_amount": new_total_amount
        }).eq("id", txn_id).execute()
        
        supabase.table("items").update({"quantity": new_stock}).eq("id", txn.item_id).execute()
        
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    

@app.delete("/api/transactions/{txn_id}")
def delete_transaction(txn_id: str):
    try:
        # 1. Get the transaction before deleting it
        old_txn = supabase.table("transactions").select("*").eq("id", txn_id).single().execute().data
        
        # 2. Get current stock
        item_data = supabase.table("items").select("quantity").eq("id", old_txn["item_id"]).single().execute().data
        
        # 3. Add the sold quantity BACK into inventory
        new_stock = item_data["quantity"] + old_txn["quantity_sold"]
        supabase.table("items").update({"quantity": new_stock}).eq("id", old_txn["item_id"]).execute()
        
        # 4. Delete the transaction
        supabase.table("transactions").delete().eq("id", txn_id).execute()
        
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# backend/main.py
# ... (keep your existing code above) ...

# backend/main.py (Update the get_analytics function)

@app.get("/api/analytics")
def get_analytics():
    try:
        txn_response = supabase.table("transactions").select("transaction_date, quantity_sold, total_amount, items(capital)").execute()
        transactions = txn_response.data
        
        total_revenue = 0
        total_cost = 0
        daily_revenue = {} # Dictionary to hold our chart data
        
        for txn in transactions:
            total_revenue += txn["total_amount"]
            item_capital = txn["items"]["capital"] if txn["items"] else 0
            total_cost += (item_capital * txn["quantity_sold"])
            
            # Group revenue by date for the chart
            date = txn["transaction_date"]
            if date in daily_revenue:
                daily_revenue[date] += txn["total_amount"]
            else:
                daily_revenue[date] = txn["total_amount"]
            
        gross_profit = total_revenue - total_cost
        net_profit = gross_profit 
        
        alerts_response = supabase.table("items").select("item_name, quantity").lte("quantity", 5).order("quantity").execute()
        
        # Format the daily revenue for Recharts
        # Converts {"2026-03-01": 500} into [{"date": "2026-03-01", "revenue": 500}]
        chart_data = [{"date": k, "revenue": v} for k, v in sorted(daily_revenue.items())]
        
        return {
            "status": "success",
            "data": {
                "total_revenue": total_revenue,
                "total_cost": total_cost,
                "gross_profit": gross_profit,
                "net_profit": net_profit,
                "stock_alerts": alerts_response.data,
                "chart_data": chart_data # Send the new chart data!
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# backend/main.py
# ... (keep all your existing code above) ...

# backend/main.py (Replace the get_finances function)

# backend/main.py (Replace the get_finances function)

@app.get("/api/finances")
def get_finances(year: str = "2026", month: str = "All"):
    try:
        # 1. Use proper Date Ranges (>= start_date AND <= end_date) instead of text matching
        if month == "All":
            start_date = f"{year}-01-01"
            end_date = f"{year}-12-31"
        else:
            # calendar.monthrange figures out exactly how many days are in that specific month
            num_days = calendar.monthrange(int(year), int(month))[1]
            start_date = f"{year}-{month}-01"
            end_date = f"{year}-{month}-{num_days}"
            
        # Use .gte (Greater Than or Equal) and .lte (Less Than or Equal)
        txn_response = supabase.table("transactions")\
            .select("transaction_date, quantity_sold, total_amount, items(capital)")\
            .gte("transaction_date", start_date)\
            .lte("transaction_date", end_date)\
            .execute()
            
        transactions = txn_response.data
        
        total_revenue = 0
        total_cost = 0
        chart_dict = {}
        
        # 2. Prepare the empty chart data
        if month == "All":
            months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            chart_dict = {m: {"label": m, "rev": 0, "cost": 0} for m in months}
        else:
            for d in range(1, num_days + 1):
                day_str = str(d).zfill(2)
                full_date = f"{year}-{month}-{day_str}"
                chart_dict[full_date] = {"label": day_str, "rev": 0, "cost": 0}

        # 3. Process the transactions
        for txn in transactions:
            total_revenue += txn["total_amount"]
            item_capital = txn["items"]["capital"] if txn["items"] else 0
            cost = item_capital * txn["quantity_sold"]
            total_cost += cost
            
            date_str = txn["transaction_date"]
            
            # 4. Group the data appropriately
            if month == "All":
                month_idx = int(date_str.split("-")[1]) - 1
                label = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month_idx]
                chart_dict[label]["rev"] += txn["total_amount"]
                chart_dict[label]["cost"] += cost
            else:
                if date_str in chart_dict:
                    chart_dict[date_str]["rev"] += txn["total_amount"]
                    chart_dict[date_str]["cost"] += cost
            
        gross_profit = total_revenue - total_cost
        profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        return {
            "status": "success",
            "data": {
                "total_revenue": total_revenue,
                "total_cost": total_cost,
                "gross_profit": gross_profit,
                "profit_margin": profit_margin,
                "chart_data": list(chart_dict.values())
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}