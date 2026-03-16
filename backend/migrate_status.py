import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Employee

def migrate_employee_status():
    db = SessionLocal()
    try:
        employees = db.query(Employee).all()
        print(f"Found {len(employees)} employees")
        
        status_mapping = {
            "在职": 1,
            "离职": 0,
            "active": 1,
            "inactive": 0
        }
        
        updated_count = 0
        for emp in employees:
            if emp.status in status_mapping:
                old_status = emp.status
                emp.status = status_mapping[emp.status]
                print(f"Employee {emp.id} ({emp.name}): '{old_status}' -> {emp.status}")
                updated_count += 1
            elif isinstance(emp.status, int):
                print(f"Employee {emp.id} ({emp.name}): already integer: {emp.status}")
            else:
                print(f"Employee {emp.id} ({emp.name}): unknown status '{emp.status}', setting to 0")
                emp.status = 0
        
        db.commit()
        print(f"\nMigration complete! Updated {updated_count} employees.")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_employee_status()