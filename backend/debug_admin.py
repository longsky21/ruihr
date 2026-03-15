import sys
import os
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models
from backend.auth import verify_password, get_password_hash

def debug_admin_login(username, password):
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == username).first()
        if not user:
            print(f"User {username} NOT FOUND in database.")
            return

        print(f"User {username} FOUND. ID: {user.id}, Status: {user.status}")
        print(f"Stored Hash: {user.password_hash}")
        
        # Test verification
        is_valid = verify_password(password, user.password_hash)
        print(f"Password '{password}' verification result: {is_valid}")
        
        # If verification fails, let's try to reset it and see
        if not is_valid:
            print("Resetting password just in case...")
            new_hash = get_password_hash(password)
            user.password_hash = new_hash
            db.commit()
            print("Password reset. Testing verification again...")
            is_valid_retry = verify_password(password, new_hash)
            print(f"Retry verification result: {is_valid_retry}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python -m backend.debug_admin <username> <password>")
    else:
        debug_admin_login(sys.argv[1], sys.argv[2])
