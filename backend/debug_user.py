import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models
from .auth import verify_password

load_dotenv()

def check_user(username: str, password: str):
    db: Session = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == username).first()
        if not user:
            print("USER_NOT_FOUND")
            return
        print(f"FOUND_USER id={user.id} username={user.username} status={user.status}")
        ok = verify_password(password, user.password_hash)
        print("PASSWORD_OK" if ok else "PASSWORD_FAIL")
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python -m backend.debug_user <username> <password>")
    else:
        check_user(sys.argv[1], sys.argv[2])

