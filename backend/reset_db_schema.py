from sqlalchemy import create_engine, text
from .models import Base
from .database import engine

def reset_schema():
    print("Resetting database schema...")
    
    # List of tables to drop in order (child first)
    tables_to_drop = [
        "employee_transfers",
        "attendance_records",
        "payrolls", 
        "leave_requests",
        "employee_positions",
        "employee_contacts",
        "applications",
        "candidates",
        "jobs",
        "employees",
        "departments",
        # "users", # Keep users and roles for now unless necessary
        # "user_roles",
        # "roles"
    ]
    
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        for table in tables_to_drop:
            print(f"Dropping table {table}...")
            conn.execute(text(f"DROP TABLE IF EXISTS {table};"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        conn.commit()
        
    print("Creating all tables from models...")
    Base.metadata.create_all(bind=engine)
    print("Schema reset complete.")

if __name__ == "__main__":
    reset_schema()
