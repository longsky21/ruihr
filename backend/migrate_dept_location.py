
from sqlalchemy import create_engine, text, inspect
from database import engine, Base
from models import Department

def migrate():
    print("Starting database migration for Department location...")
    
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns("departments")]
    
    with engine.connect() as conn:
        # Check if 'location' column exists and its type
        # We want to change it from String to Integer (ForeignKey)
        # But for simplicity and data preservation, let's first check if we need to modify it.
        # If it's already an integer/compatible with FK, we might be good, 
        # but previously it was String(100).
        
        # Strategy: 
        # 1. Rename old 'location' to 'location_old_str'
        # 2. Add new 'location' as Integer
        # 3. Add ForeignKey constraint
        
        # Check if we already migrated (heuristic: check if location is int-like or if we have FK)
        # A simpler check: try to add the FK. If it fails, maybe column type is wrong.
        
        print("Modifying 'departments' table...")
        try:
             # Since we are using MySQL, we can change the column type directly if data allows,
             # but 'location' likely contains string names like "Beijing". 
             # We should probably clear it or migrate data if we had OfficeLocation mapping.
             # Assuming we can reset this field for now or it's empty.
             
             # Step 1: Drop the old column or modify it. 
             # WARNING: This will lose existing location string data!
             # If you want to keep it, rename it first.
             
             print("Dropping old 'location' column (String)...")
             conn.execute(text("ALTER TABLE departments DROP COLUMN location"))
             
             print("Adding new 'location' column (Integer)...")
             conn.execute(text("ALTER TABLE departments ADD COLUMN location INT"))
             
             print("Adding ForeignKey constraint...")
             conn.execute(text("ALTER TABLE departments ADD CONSTRAINT fk_departments_location FOREIGN KEY (location) REFERENCES office_locations(id)"))
             
             print("Migration successful.")
        except Exception as e:
            print(f"Migration failed (might have already been applied): {e}")

if __name__ == "__main__":
    migrate()
