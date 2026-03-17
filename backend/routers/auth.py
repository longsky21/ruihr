from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import models, schemas, auth, database, crud
from datetime import timedelta
from database import get_db

router = APIRouter()

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=schemas.Employee)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(database.get_db)):
    # 查找与当前用户关联的员工信息，同时join获取联系方式和职位信息
    employee = db.query(models.Employee)\
        .outerjoin(models.EmployeeContact)\
        .outerjoin(models.EmployeePosition)\
        .filter(models.Employee.user_id == current_user.id)\
        .first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # 将关联表的数据放到employee对象上返回
    if employee.contact:
        setattr(employee, 'phone', employee.contact.phone)
        setattr(employee, 'email', employee.contact.email)
    if employee.position_info:
        setattr(employee, 'position_title', employee.position_info.position_title)
        setattr(employee, 'hire_date', employee.position_info.hire_date)
    
    return employee

@router.get("/employee/{employee_id}", response_model=schemas.Employee)
async def get_employee_by_id(employee_id: int, db: Session = Depends(database.get_db)):
    employee = db.query(models.Employee)\
        .outerjoin(models.EmployeeContact)\
        .outerjoin(models.EmployeePosition)\
        .filter(models.Employee.id == employee_id)\
        .first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if employee.contact:
        setattr(employee, 'phone', employee.contact.phone);
        setattr(employee, 'email', employee.contact.email);
    if employee.position_info:
        setattr(employee, 'position_title', employee.position_info.position_title);
        setattr(employee, 'hire_date', employee.position_info.hire_date);
    
    return employee