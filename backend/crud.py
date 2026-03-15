from sqlalchemy.orm import Session
from . import models, schemas, auth

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

def get_employees(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Employee).filter(models.Employee.is_deleted == False).offset(skip).limit(limit).all()

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
        db_employee.is_deleted = True
        db.commit()
    return db_employee

def create_employee_transfer(db: Session, transfer: schemas.EmployeeTransferCreate, employee_id: int, operator_id: int = None):
    db_transfer = models.EmployeeTransfer(**transfer.dict(), employee_id=employee_id, operator_id=operator_id)
    db.add(db_transfer)
    db.commit()
    db.refresh(db_transfer)
    return db_transfer

def create_employee(db: Session, employee: schemas.EmployeeCreate):
    emp_data = employee.dict()
    phone = emp_data.pop('phone', None)
    
    db_employee = models.Employee(**emp_data)
    db.add(db_employee)
    db.flush() # Get ID
    
    if phone:
        contact = models.EmployeeContact(employee_id=db_employee.id, phone=phone)
        db.add(contact)
        
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
