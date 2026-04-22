# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import supabase # Import our database client
import calendar
import bcrypt  # <-- We are using this directly now!
import jwt
from datetime import datetime, timedelta
import re
from fastapi import Header, HTTPException
from pydantic import BaseModel
from fastapi import Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

app = FastAPI()

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
    
# --- AUTHENTICATION SETUP ---
SECRET_KEY = "your-super-secret-key-change-this-later" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# ---> PASTE THESE CLASSES RIGHT HERE <---
class UserSignup(BaseModel):
    full_name: str
    username: str
    email: str
    business_name: str
    password: str
    confirm_password: str

class UserLogin(BaseModel):
    username: str
    password: str

class AccountUpdate(BaseModel):
    full_name: str
    username: str
    business_name: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_new_password: str

class PasswordReset(BaseModel):
    username: str
    email: str
    new_password: str
    confirm_password: str
# ----------------------------------------

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    # Safely convert to bytes, generate a salt, and hash using native bcrypt
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# This tells FastAPI to look for the "Authorization: Bearer <token>" header
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        # Decode the token using your secret key
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id # Returns the UUID of the logged-in user!
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")



@app.get("/api/inventory")
def get_inventory(user_id: str = Depends(get_current_user)): # <-- 1. Require Token
    try:
        # 2. Filter the database to ONLY show this user's items
        response = supabase.table("items").select("*").eq("user_id", user_id).order("id").execute()
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

class ExpenseCreate(BaseModel):
    expense_date: str
    category: str
    description: str = ""
    amount: float
# backend/main.py

@app.post("/api/inventory")
def create_item(item: dict, user_id: str = Depends(get_current_user)): 
    try:
        # 1. Search to see if this user already has an item with this exact name (case-insensitive)
        existing = supabase.table("items").select("*").eq("user_id", user_id).ilike("item_name", item["item_name"]).execute()
        
        if len(existing.data) > 0:
            # 2. SMART RESTOCK: The item exists! Let's combine them instead of throwing an error.
            old_item = existing.data[0]
            new_qty = old_item["quantity"] + item["quantity"]
            
            # Update the old item with the new quantity and any new prices you typed
            response = supabase.table("items").update({
                "quantity": new_qty,
                "capital": item["capital"],
                "selling_price": item["selling_price"]
            }).eq("id", old_item["id"]).execute()
            
            return {"status": "success", "data": response.data}
        else:
            # 3. NORMAL ADD: The item doesn't exist yet, so we create a brand new row.
            item["user_id"] = user_id 
            response = supabase.table("items").insert(item).execute()
            return {"status": "success", "data": response.data}
            
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
def get_transactions(date: str = None, user_id: str = Depends(get_current_user)): # Require Token
    try:
        # Add .eq("user_id", user_id) to only get this user's sales
        query = supabase.table("transactions").select("*, items(item_name)").eq("user_id", user_id)
        if date:
            query = query.eq("transaction_date", date)
            
        response = query.execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/transactions")
def add_transaction(txn: TransactionCreate, user_id: str = Depends(get_current_user)): # Require Token
    try:
        item_response = supabase.table("items").select("selling_price, quantity").eq("id", txn.item_id).single().execute()
        item_data = item_response.data
        
        if txn.quantity_sold > item_data["quantity"]:
            return {"status": "error", "message": f"Not enough stock! Only {item_data['quantity']} available."}

        total_amount = item_data["selling_price"] * txn.quantity_sold
        new_txn = {
            "item_id": txn.item_id,
            "transaction_date": txn.transaction_date,
            "quantity_sold": txn.quantity_sold,
            "total_amount": total_amount,
            "user_id": user_id # Attach the user ID here!
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
def get_analytics(year: str = "2026", month: str = "All", user_id: str = Depends(get_current_user)): # Require Token
    try:
        import calendar
        if month == "All":
            start_date = f"{year}-01-01"
            end_date = f"{year}-12-31"
        else:
            num_days = calendar.monthrange(int(year), int(month))[1]
            start_date = f"{year}-{month}-01"
            end_date = f"{year}-{month}-{num_days}"
            
        # Add .eq("user_id", user_id)
        txn_response = supabase.table("transactions")\
            .select("transaction_date, quantity_sold, total_amount, items(capital)")\
            .gte("transaction_date", start_date)\
            .lte("transaction_date", end_date)\
            .eq("user_id", user_id)\
            .execute()
            
        transactions = txn_response.data
        
        # ... (Keep all your chart_dict and loop logic exactly the same) ...
        total_revenue = 0
        total_cost = 0
        chart_dict = {}
        
        if month == "All":
            months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            chart_dict = {m: {"date": m, "revenue": 0} for m in months}
        else:
            num_days = calendar.monthrange(int(year), int(month))[1]
            for d in range(1, num_days + 1):
                day_str = str(d).zfill(2)
                full_date = f"{year}-{month}-{day_str}"
                chart_dict[full_date] = {"date": full_date, "revenue": 0}

        for txn in transactions:
            total_revenue += txn["total_amount"]
            item_capital = txn["items"]["capital"] if txn["items"] else 0
            total_cost += (item_capital * txn["quantity_sold"])
            
            date_str = txn["transaction_date"]
            if month == "All":
                month_idx = int(date_str.split("-")[1]) - 1
                label = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month_idx]
                chart_dict[label]["revenue"] += txn["total_amount"]
            else:
                if date_str in chart_dict:
                    chart_dict[date_str]["revenue"] += txn["total_amount"]
            
        gross_profit = total_revenue - total_cost
        net_profit = gross_profit 
        
        # Add .eq("user_id", user_id) to stock alerts
        alerts_response = supabase.table("items").select("item_name, quantity").lte("quantity", 5).eq("user_id", user_id).order("quantity").execute()
        
        return {
            "status": "success",
            "data": {
                "total_revenue": total_revenue, "total_cost": total_cost,
                "gross_profit": gross_profit, "net_profit": net_profit,
                "stock_alerts": alerts_response.data, "chart_data": list(chart_dict.values())
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
# backend/main.py
# ... (keep all your existing code above) ...

# backend/main.py (Replace the get_finances function)

# backend/main.py (Replace the get_finances function)

@app.get("/api/finances")
def get_finances(year: str = "2026", month: str = "All", user_id: str = Depends(get_current_user)): # <-- 1. Require Token
    try:
        import calendar
        if month == "All":
            start_date = f"{year}-01-01"
            end_date = f"{year}-12-31"
        else:
            num_days = calendar.monthrange(int(year), int(month))[1]
            start_date = f"{year}-{month}-01"
            end_date = f"{year}-{month}-{num_days}"
            
        # 2. Add .eq("user_id", user_id) to only get this user's data
        txn_response = supabase.table("transactions")\
            .select("transaction_date, quantity_sold, total_amount, items(capital)")\
            .gte("transaction_date", start_date)\
            .lte("transaction_date", end_date)\
            .eq("user_id", user_id)\
            .execute()
            
        transactions = txn_response.data
        
        total_revenue = 0
        total_cost = 0
        chart_dict = {}
        
        if month == "All":
            months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            chart_dict = {m: {"label": m, "rev": 0, "cost": 0} for m in months}
        else:
            for d in range(1, num_days + 1):
                day_str = str(d).zfill(2)
                full_date = f"{year}-{month}-{day_str}"
                chart_dict[full_date] = {"label": day_str, "rev": 0, "cost": 0}

        for txn in transactions:
            total_revenue += txn["total_amount"]
            item_capital = txn["items"]["capital"] if txn["items"] else 0
            cost = item_capital * txn["quantity_sold"]
            total_cost += cost
            
            date_str = txn["transaction_date"]
            
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
    

# --- EXPENSE ENDPOINTS ---

@app.get("/api/expenses")
def get_expenses(user_id: str = Depends(get_current_user)):
    try:
        # Fetch only the logged-in user's expenses, sorted by date
        response = supabase.table("expenses").select("*").eq("user_id", user_id).order("expense_date", desc=True).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/expenses")
def add_expense(expense: ExpenseCreate, user_id: str = Depends(get_current_user)):
    try:
        new_expense = {
            "user_id": user_id,
            "expense_date": expense.expense_date,
            "category": expense.category,
            "description": expense.description,
            "amount": expense.amount
        }
        response = supabase.table("expenses").insert(new_expense).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
@app.put("/api/expenses/{expense_id}")
def update_expense(expense_id: str, expense: ExpenseCreate, user_id: str = Depends(get_current_user)):
    try:
        updated_data = {
            "expense_date": expense.expense_date,
            "category": expense.category,
            "description": expense.description,
            "amount": expense.amount
        }
        # Security check: .eq("user_id", user_id) ensures they can only edit THEIR OWN expenses!
        response = supabase.table("expenses").update(updated_data).eq("id", expense_id).eq("user_id", user_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.delete("/api/expenses/{expense_id}")
def delete_expense(expense_id: str, user_id: str = Depends(get_current_user)):
    try:
        # Delete the expense (ensuring it belongs to this user!)
        supabase.table("expenses").delete().eq("id", expense_id).eq("user_id", user_id).execute()
        return {"status": "success", "message": "Expense deleted"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# --- AUTH ENDPOINTS ---
# (Leave your /api/auth/signup and /api/auth/login endpoints exactly as they are!)

# --- AUTH ENDPOINTS ---

@app.post("/api/auth/signup")
def signup(user: UserSignup):
    # 1. Validate Passwords Match
    if user.password != user.confirm_password:
        return {"status": "error", "message": "Passwords do not match."}
    
    # 2. Validate Password Strength (Regex: 8 chars, 1 Upper, 1 Lower, 1 Number)
    if not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$", user.password):
        return {"status": "error", "message": "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, and a number."}

    try:
        # 3. Check if username or email already exists
        existing_user = supabase.table("users").select("*").or_(f"username.eq.{user.username},email.eq.{user.email}").execute()
        if len(existing_user.data) > 0:
            return {"status": "error", "message": "Username or Email already taken."}

        # 4. Create User
        hashed_pw = get_password_hash(user.password)
        new_user = {
            "full_name": user.full_name,
            "username": user.username,
            "email": user.email,
            "business_name": user.business_name,
            "password_hash": hashed_pw,
            "role": "user" # Default role
        }
        
        response = supabase.table("users").insert(new_user).execute()
        return {"status": "success", "message": "Account created successfully!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/auth/login")
def login(user: UserLogin):
    try:
        # 1. Find user by username
        response = supabase.table("users").select("*").eq("username", user.username).execute()
        if len(response.data) == 0:
            return {"status": "error", "message": "Invalid username or password."}
            
        db_user = response.data[0]
        
        # 2. Verify password
        if not verify_password(user.password, db_user["password_hash"]):
            return {"status": "error", "message": "Invalid username or password."}
            
        # 3. Generate JWT Token
        access_token = create_access_token(data={
            "sub": db_user["id"], 
            "username": db_user["username"],
            "business_name": db_user["business_name"],
            "role": db_user["role"]
        })
        
        return {
            "status": "success", 
            "token": access_token,
            "user": {
                "id": db_user["id"],
                "business_name": db_user["business_name"],
                "full_name": db_user["full_name"],
                "role": db_user["role"]
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/auth/reset-password")
def reset_password(data: PasswordReset):
    # 1. Check if passwords match
    if data.new_password != data.confirm_password:
        return {"status": "error", "message": "Passwords do not match."}
        
    # 2. Check password strength
    if not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$", data.new_password):
        return {"status": "error", "message": "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, and a number."}

    try:
        # 3. Security Check: Verify user exists with this exact username AND email
        response = supabase.table("users").select("id").eq("username", data.username).eq("email", data.email).execute()
        
        if len(response.data) == 0:
            return {"status": "error", "message": "Account verification failed. Invalid username or email."}
            
        user_id = response.data[0]["id"]
        
        # 4. Hash the new password and update the database
        new_hash = get_password_hash(data.new_password)
        supabase.table("users").update({"password_hash": new_hash}).eq("id", user_id).execute()
        
        return {"status": "success", "message": "Password reset successfully! You can now log in."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.put("/api/auth/update-account")
def update_account(data: AccountUpdate, user_id: str = Depends(get_current_user)):
    try:
        # Check if the new username is already taken by a different user
        existing = supabase.table("users").select("id").eq("username", data.username).neq("id", user_id).execute()
        if len(existing.data) > 0:
            return {"status": "error", "message": "Username is already taken by someone else."}
            
        # Update the user's data
        response = supabase.table("users").update({
            "full_name": data.full_name,
            "username": data.username,
            "business_name": data.business_name
        }).eq("id", user_id).execute()
        
        return {"status": "success", "data": response.data[0]}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.put("/api/auth/change-password")
def change_password(data: PasswordChange, user_id: str = Depends(get_current_user)):
    if data.new_password != data.confirm_new_password:
        return {"status": "error", "message": "New passwords do not match."}
        
    # Validate new password strength
    if not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$", data.new_password):
        return {"status": "error", "message": "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, and a number."}

    try:
        # Get the current password hash from the database
        user_res = supabase.table("users").select("password_hash").eq("id", user_id).single().execute()
        
        # Verify the old password is correct
        if not verify_password(data.current_password, user_res.data["password_hash"]):
            return {"status": "error", "message": "Incorrect current password."}
            
        # Hash and save the new password
        new_hash = get_password_hash(data.new_password)
        supabase.table("users").update({"password_hash": new_hash}).eq("id", user_id).execute()
        
        return {"status": "success", "message": "Password updated successfully!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# --- ADMIN ENDPOINTS ---

@app.get("/api/admin/users")
def get_all_users(user_id: str = Depends(get_current_user)):
    try:
        # 1. SECURITY CHECK: Verify this user is actually an admin
        admin_check = supabase.table("users").select("role").eq("id", user_id).single().execute()
        if admin_check.data.get("role") != "admin":
            return {"status": "error", "message": "Unauthorized. Admin access required."}
            
        # 2. Fetch all users (excluding their passwords for safety!)
        response = supabase.table("users").select("id, full_name, username, email, business_name, role, created_at").order("created_at", desc=True).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.delete("/api/admin/users/{target_user_id}")
def delete_user(target_user_id: str, user_id: str = Depends(get_current_user)):
    try:
        # 1. SECURITY CHECK: Verify this user is an admin
        admin_check = supabase.table("users").select("role").eq("id", user_id).single().execute()
        if admin_check.data.get("role") != "admin":
            return {"status": "error", "message": "Unauthorized. Admin access required."}
            
        # 2. Prevent the admin from accidentally deleting themselves!
        if target_user_id == user_id:
            return {"status": "error", "message": "You cannot delete your own admin account."}
            
        # 3. Delete the user (Because we set ON DELETE CASCADE in SQL, 
        # this will automatically delete all their items and transactions too!)
        supabase.table("users").delete().eq("id", target_user_id).execute()
        return {"status": "success", "message": "User and all associated data deleted."}
    except Exception as e:
        return {"status": "error", "message": str(e)}