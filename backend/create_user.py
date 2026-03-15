import sys
import os
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models
from backend.auth import get_password_hash
from datetime import date

def create_user(username, password):
    db = SessionLocal()
    try:
        # Check if user exists
        user = db.query(models.User).filter(models.User.username == username).first()
        if user:
            print(f"User {username} already exists.")
            # Update password
            user.password_hash = get_password_hash(password)
            db.commit()
            print(f"Password updated for {username}.")
        else:
            # Create new user
            user = models.User(
                username=username,
                email=f"{username}@ruihr.com",
                password_hash=get_password_hash(password),
                status=1
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"User {username} created successfully. ID: {user.id}")

        # Check if employee record exists for this user
        # We try to link by phone number if employee exists but no user_id set (rare case in our current logic)
        # Or create a new employee record if not exists
        
        # First check if employee exists with this phone number
        employee = db.query(models.Employee).filter(models.Employee.phone == username).first()
        
        if employee:
             print(f"Found existing employee record for phone {username}. Updating user_id...")
             employee.user_id = user.id
             db.commit()
        else:
            # Check if employee exists by user_id
            employee = db.query(models.Employee).filter(models.Employee.user_id == user.id).first()
            
            if not employee:
                print(f"Creating new employee record for user {username}...")
                # Create a default department if none exists
                dept = db.query(models.Department).first()
                if not dept:
                    dept = models.Department(name="默认部门")
                    db.add(dept)
                    db.commit()
                    db.refresh(dept)
                
                new_employee = models.Employee(
                    user_id=user.id,
                    name=f"员工{username[-4:]}", # Default name
                    phone=username,
                    department_id=dept.id,
                    position="普通员工",
                    hire_date=date.today()
                )
                db.add(new_employee)
                db.commit()
                print("Employee record created.")
            else:
                print("Employee record already linked.")

    except Exception as e:
        print(f"Error creating user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        # Default for this task
        create_user("18911393973", "123456")
    else:
        create_user(sys.argv[1], sys.argv[2])
