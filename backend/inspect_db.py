from sqlalchemy import inspect
from backend.database import engine

def inspect_table():
    inspector = inspect(engine)
    columns = inspector.get_columns('attendance_records')
    print("Columns in attendance_records:")
    for column in columns:
        print(f"- {column['name']} ({column['type']})")

if __name__ == "__main__":
    inspect_table()
