from sqlalchemy.orm import Session
import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import models, schemas, auth

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, email=user.email, password_hash=hashed_password, status=user.status)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

from sqlalchemy import or_, and_

def get_employees(db: Session, skip: int = 0, limit: int = 100, 
                  department_id: int = None, 
                  keyword: str = None, 
                  hire_date: str = None):
    query = db.query(models.Employee).filter(models.Employee.is_deleted == False)
    
    if department_id:
        query = query.filter(models.Employee.department_id == department_id)
        
    if keyword:
        # Join with EmployeeContact to search phone
        query = query.outerjoin(models.EmployeeContact)
        query = query.filter(
            or_(
                models.Employee.name.ilike(f"%{keyword}%"),
                models.Employee.employee_no.ilike(f"%{keyword}%"),
                models.EmployeeContact.phone.ilike(f"%{keyword}%")
            )
        )
        
    if hire_date:
        # Join with EmployeePosition to search hire_date
        # hire_date is stored as string 'YYYY-MM-DD' or date object?
        # In models.py: hire_date = Column(Date)
        query = query.outerjoin(models.EmployeePosition)
        query = query.filter(models.EmployeePosition.hire_date == hire_date)
        
    return query.offset(skip).limit(limit).all()

def get_employees_count(db: Session, 
                        department_id: int = None, 
                        keyword: str = None, 
                        hire_date: str = None):
    query = db.query(models.Employee).filter(models.Employee.is_deleted == False)
    
    if department_id:
        query = query.filter(models.Employee.department_id == department_id)
        
    if keyword:
        query = query.outerjoin(models.EmployeeContact)
        query = query.filter(
            or_(
                models.Employee.name.ilike(f"%{keyword}%"),
                models.Employee.employee_no.ilike(f"%{keyword}%"),
                models.EmployeeContact.phone.ilike(f"%{keyword}%")
            )
        )
        
    if hire_date:
        query = query.outerjoin(models.EmployeePosition)
        query = query.filter(models.EmployeePosition.hire_date == hire_date)
        
    return query.count()

def get_employee(db: Session, employee_id: int):
    return db.query(models.Employee).filter(models.Employee.id == employee_id, models.Employee.is_deleted == False).first()

def update_employee(db: Session, employee_id: int, employee_update: schemas.EmployeeUpdate):
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return None
    
    update_data = employee_update.dict(exclude_unset=True)
    contact_data = update_data.pop('contact', None)
    position_data = update_data.pop('position_info', None)
    
    for key, value in update_data.items():
        setattr(db_employee, key, value)
    
    if contact_data:
        if db_employee.contact:
            for key, value in contact_data.items():
                setattr(db_employee.contact, key, value)
        else:
            new_contact = models.EmployeeContact(employee_id=db_employee.id, **contact_data)
            db.add(new_contact)
            
    if position_data:
        if db_employee.position_info:
            for key, value in position_data.items():
                setattr(db_employee.position_info, key, value)
        else:
            new_position = models.EmployeePosition(employee_id=db_employee.id, **position_data)
            db.add(new_position)

    db.commit()
    db.refresh(db_employee)
    return db_employee

def delete_employee(db: Session, employee_id: int):
    db_employee = get_employee(db, employee_id)
    if db_employee:
        # Physical deletion as requested
        db.delete(db_employee)
        db.commit()
    return db_employee

def create_employee_transfer(db: Session, transfer: schemas.EmployeeTransferCreate, employee_id: int, operator_id: int = None):
    db_transfer = models.EmployeeTransfer(**transfer.dict(), employee_id=employee_id, operator_id=operator_id)
    db.add(db_transfer)
    db.commit()
    db.refresh(db_transfer)
    return db_transfer

def create_employee(db: Session, employee: schemas.EmployeeCreate):
    emp_data = employee.dict(exclude_unset=True)
    
    # Extract contact fields
    contact_fields = ['phone', 'email', 'work_phone', 'work_email', 'wechat', 'contact_address', 'home_address', 'emergency_contact_name', 'emergency_contact_phone']
    contact_data = {k: emp_data.pop(k, None) for k in contact_fields}
    contact_data = {k: v for k, v in contact_data.items() if v is not None}
    
    # Extract position fields
    position_fields = ['position_title', 'job_title', 'job_level', 'hire_date', 'employment_type', 'contract_company', 'contract_type', 'probation_months', 'probation_end_date', 'probation_status', 'contract_start_date', 'contract_end_date', 'work_location']
    position_data = {k: emp_data.pop(k, None) for k in position_fields}
    position_data = {k: v for k, v in position_data.items() if v is not None}
    
    db_employee = models.Employee(**emp_data)
    db.add(db_employee)
    db.flush() # Get ID
    
    if contact_data:
        contact = models.EmployeeContact(employee_id=db_employee.id, **contact_data)
        db.add(contact)
        
    if position_data:
        position = models.EmployeePosition(employee_id=db_employee.id, **position_data)
        db.add(position)
        
    db.commit()
    db.refresh(db_employee)
    return db_employee

def create_attendance(db: Session, attendance: schemas.AttendanceCreate):
    db_attendance = models.AttendanceRecord(**attendance.dict())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

def get_attendance_records(db: Session, employee_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.AttendanceRecord).filter(models.AttendanceRecord.employee_id == employee_id).offset(skip).limit(limit).all()

def create_leave_request(db: Session, leave: schemas.LeaveRequestCreate, employee_id: int):
    db_leave = models.LeaveRequest(**leave.dict(), employee_id=employee_id)
    db.add(db_leave)
    db.commit()
    db.refresh(db_leave)
    return db_leave

def get_leave_requests(db: Session, employee_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.LeaveRequest).filter(models.LeaveRequest.employee_id == employee_id).offset(skip).limit(limit).all()

def get_payrolls(db: Session, employee_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Payroll).filter(models.Payroll.employee_id == employee_id).offset(skip).limit(limit).all()

def get_department(db: Session, department_id: int):
    return db.query(models.Department).filter(models.Department.id == department_id).first()

def create_department(db: Session, dept: schemas.DepartmentCreate):
    parent = None
    if dept.parent_id:
        parent = get_department(db, dept.parent_id)
        if not parent:
            raise ValueError("Parent department not found")

    if parent:
        path = f"{parent.path}/{dept.name}"
        level = parent.level + 1
    else:
        path = f"/{dept.name}"
        level = 0

    dept_data = dept.dict()
    dept_data['path'] = path
    dept_data['level'] = level

    db_dept = models.Department(**dept_data)
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

def update_department(db: Session, department_id: int, dept_update: schemas.DepartmentUpdate):
    db_dept = get_department(db, department_id)
    if not db_dept:
        return None
    
    update_data = dept_update.dict(exclude_unset=True)
    
    # If name changes, we need to update the path of this dept and all descendants
    if "name" in update_data and update_data["name"] != db_dept.name:
        new_name = update_data["name"]
        old_path = db_dept.path
        
        # New path for current dept
        parent_path = "/".join(old_path.split("/")[:-1])
        new_path = f"{parent_path}/{new_name}"
        
        db_dept.name = new_name
        db_dept.path = new_path
        
        # Update Descendants
        descendants = db.query(models.Department).filter(models.Department.path.like(f"{old_path}/%")).all()
        for desc in descendants:
            relative_path = desc.path[len(old_path):]
            desc.path = new_path + relative_path
            
        update_data.pop("name") # Already handled
        
    for key, value in update_data.items():
        setattr(db_dept, key, value)
        
    db.commit()
    db.refresh(db_dept)
    return db_dept

def move_department(db: Session, department_id: int, new_parent_id: int = None):
    dept = get_department(db, department_id)
    if not dept:
        return None
    
    if new_parent_id:
        if new_parent_id == department_id:
            raise ValueError("Cannot move department to itself")
        new_parent = get_department(db, new_parent_id)
        if not new_parent:
            raise ValueError("New parent department not found")
        
        # Check if new parent is a descendant of current department
        if new_parent.path.startswith(dept.path + "/"):
            raise ValueError("Cannot move department to its own descendant")
            
        new_path_prefix = new_parent.path
        new_level_base = new_parent.level
    else:
        new_path_prefix = ""
        new_level_base = -1 # So that level becomes 0
    
    old_path = dept.path
    old_level = dept.level
    
    # Update Dept
    new_path = f"{new_path_prefix}/{dept.name}"
    new_level = new_level_base + 1
    
    dept.parent_id = new_parent_id
    dept.path = new_path
    dept.level = new_level
    
    # Update Descendants
    # Use like operator correctly
    descendants = db.query(models.Department).filter(models.Department.path.like(f"{old_path}/%")).all()
    for desc in descendants:
        relative_path = desc.path[len(old_path):]
        desc.path = new_path + relative_path
        desc.level = desc.level + (new_level - old_level)
        
    db.commit()
    db.refresh(dept)
    return dept
