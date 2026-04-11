# backend/seed.py
import pandas as pd
from database import supabase

def seed_items():
    print("Reading Excel file...")
    try:
        # Use read_excel and the openpyxl engine instead of read_csv
        df = pd.read_excel(
            "Business Intelligence1.xlsx - Sheet1.csv", 
            engine='openpyxl', # This forces pandas to decode the binary .xlsx format
            usecols=[0, 1, 2, 3], 
            names=["item_name", "quantity", "capital", "selling_price"],
            skiprows=1 
        )
        
        # Clean the data (remove empty rows)
        df = df.dropna(subset=['item_name', 'capital'])
        
        print(f"Found {len(df)} items to parse. Sending to Supabase...")
        
        items_inserted = 0
        for index, row in df.iterrows():
            # Convert item_name to string and check if it's a valid row
            item_name = str(row['item_name']).strip()
            if item_name == 'Total: ' or item_name == 'nan':
                continue
                
            try:
                item_data = {
                    "item_name": item_name,
                    "quantity": int(row['quantity']) if pd.notna(row['quantity']) else 0,
                    "capital": float(row['capital']),
                    "selling_price": float(row['selling_price'])
                }
                
                # Insert into Supabase
                supabase.table("items").insert(item_data).execute()
                items_inserted += 1
                print(f"Inserted: {item_name}")
                
            except ValueError as ve:
                print(f"⚠️ Skipped row {index + 2} ({item_name}): Could not format numbers.")
            
        print(f"\n✅ Success! {items_inserted} items added to the database.")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    seed_items()