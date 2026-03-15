import sys
import os
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models
from backend.auth import get_password_hash

def create_admin_user():
    db = SessionLocal()
    try:
        username = "admin"
        password = "admin123"
        email = "admin@ruihr.com"

        # Check if user exists
        user = db.query(models.User).filter(models.User.username == username).first()
        if user:
            print(f"User {username} already exists.")
            # Update password just in case
            user.password_hash = get_password_hash(password)
            db.commit()
            print(f"Password updated for {username}.")
        else:
            # Create new admin user
            user = models.User(
                username=username,
                email=email,
                password_hash=get_password_hash(password),
                status=1
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"User {username} created successfully.")

        # Assign admin role (if roles table is used, for now just creating the user is enough for login)
        # Assuming we might want to link to an employee record or role later
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
