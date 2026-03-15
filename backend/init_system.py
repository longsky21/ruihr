import os
import sys

# Add parent directory to path so we can import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.reset_db_schema import reset_schema
from backend.services.import_service import import_departments, import_employees

def init_system():
    # 1. Reset Schema
    reset_schema()
    
    db = SessionLocal()
    try:
        base_path = os.getcwd()
        # Adjust paths based on where the script is run. Assuming run from root.
        dept_csv = os.path.join(base_path, '组织架构.csv')
        emp_csv = os.path.join(base_path, '导出的员工信息数据.csv')
        
        if os.path.exists(dept_csv):
            print(f"Importing departments from {dept_csv}...")
            try:
                count = import_departments(db, dept_csv)
                print(f"Imported {count} department records.")
            except Exception as e:
                print(f"Failed to import departments: {e}")
                import traceback
                traceback.print_exc()
        else:
            print(f"Warning: {dept_csv} not found.")
            
        if os.path.exists(emp_csv):
            print(f"Importing employees from {emp_csv}...")
            try:
                count = import_employees(db, emp_csv)
                print(f"Imported {count} employee records.")
            except Exception as e:
                print(f"Failed to import employees: {e}")
                import traceback
                traceback.print_exc()
        else:
            print(f"Warning: {emp_csv} not found.")
            
    except Exception as e:
        print(f"Error during initialization: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    init_system()
