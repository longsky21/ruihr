
from sqlalchemy import create_engine, text, inspect
from database import engine, Base
from models import OfficeLocation, Employee

def migrate():
    print("Starting database migration...")
    
    # 1. Create office_locations table if it doesn't exist
    inspector = inspect(engine)
    if not inspector.has_table("office_locations"):
        print("Creating table 'office_locations'...")
        OfficeLocation.__table__.create(engine)
        print("Table 'office_locations' created.")
    else:
        print("Table 'office_locations' already exists.")

    # 2. Add office_location_id to employees table if it doesn't exist
    with engine.connect() as conn:
        columns = [col['name'] for col in inspector.get_columns("employees")]
        if "office_location_id" not in columns:
            print("Adding column 'office_location_id' to 'employees' table...")
            conn.execute(text("ALTER TABLE employees ADD COLUMN office_location_id INT"))
            conn.execute(text("ALTER TABLE employees ADD CONSTRAINT fk_employees_office_location_id FOREIGN KEY (office_location_id) REFERENCES office_locations(id)"))
            print("Column 'office_location_id' added.")
        else:
            print("Column 'office_location_id' already exists in 'employees' table.")

    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
