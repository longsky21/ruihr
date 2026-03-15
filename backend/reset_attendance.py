from backend.database import engine, Base
from backend.models import AttendanceRecord

def reset_attendance_table():
    print("Dropping all tables...")
    Base.metadata.drop_all(engine)
    print("Recreating all tables...")
    Base.metadata.create_all(engine)
    print("Done.")

if __name__ == "__main__":
    reset_attendance_table()
