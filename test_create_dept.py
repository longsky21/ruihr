
import sys
import os
from datetime import date

# Add project root to path to allow imports from 'backend'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database import SessionLocal
from backend.schemas import DepartmentCreate
from backend.crud import create_department

def run_department_creation_test():
    """
    A test script to directly invoke the CRUD function for creating a department,
    bypassing the API layer to isolate and debug the database insertion logic.
    """
    db = SessionLocal()
    try:
        print("--- Starting Department Creation Test ---")

        # Data based on the user's screenshot
        department_payload = DepartmentCreate(
            parent_id=11,
            name="汪汪队",
            code="11001",
            manager_name="王志刚",
            category="小组",
            status="active",
            established_date=date(2026, 3, 16),
            description="王志刚小组测试",
            # Optional fields are omitted, letting the database/model defaults apply
            is_virtual=False
        )

        print(f"\nAttempting to create with payload:\n{department_payload.dict()}\n")

        # Directly call the CRUD function
        new_department = create_department(db=db, dept=department_payload)

        print("--- SUCCESS ---")
        print("Department created successfully in the database.")
        print(f"  ID: {new_department.id}")
        print(f"  Name: {new_department.name}")
        print(f"  Path: {new_department.path}")
        print(f"  Level: {new_department.level}")
        print(f"  Parent ID: {new_department.parent_id}")

    except Exception as e:
        print("--- FAILURE ---")
        print(f"An error occurred during department creation: {e}")
        import traceback
        traceback.print_exc()

    finally:
        print("\n--- Test Finished ---")
        db.close()

if __name__ == "__main__":
    run_department_creation_test()
