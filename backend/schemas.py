from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    status: int = 1

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class DepartmentBase(BaseModel):
    name: str
    parent_id: Optional[int] = None
    code: Optional[str] = None
    path: Optional[str] = None
    level: int = 1
    manager_name: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentMove(BaseModel):
    new_parent_id: Optional[int] = None

class Department(DepartmentBase):
    id: int

    class Config:
        from_attributes = True

class DepartmentDetail(Department):
    employee_count: int = 0
    children_count: int = 0

# Nested Schemas for Employee
class EmployeeContactBase(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    work_phone: Optional[str] = None
    work_email: Optional[str] = None

class EmployeeContact(EmployeeContactBase):
    id: int
    class Config:
        from_attributes = True

class EmployeePositionBase(BaseModel):
    position_title: Optional[str] = None
    job_title: Optional[str] = None
    job_level: Optional[str] = None
    hire_date: Optional[date] = None

class EmployeePosition(EmployeePositionBase):
    id: int
    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    employee_no: Optional[str] = None
    name: str
    gender: Optional[str] = None
    department_id: Optional[int] = None
    status: str = "active"

class EmployeeCreate(EmployeeBase):
    phone: Optional[str] = None # Added for creation convenience
    pass

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    department_id: Optional[int] = None
    status: Optional[str] = None
    contact: Optional[EmployeeContactBase] = None
    position_info: Optional[EmployeePositionBase] = None

class Employee(EmployeeBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested fields
    department: Optional[Department] = None
    contact: Optional[EmployeeContact] = None
    position_info: Optional[EmployeePosition] = None
    
    class Config:
        from_attributes = True

class EmployeeTransferBase(BaseModel):
    transfer_type: str
    old_department_id: Optional[int] = None
    new_department_id: Optional[int] = None
    old_position_title: Optional[str] = None
    new_position_title: Optional[str] = None
    reason: Optional[str] = None
    effective_date: date

class EmployeeTransferCreate(EmployeeTransferBase):
    pass

class EmployeeTransfer(EmployeeTransferBase):
    id: int
    employee_id: int
    operator_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class AttendanceBase(BaseModel):
    punch_time: datetime
    location: Optional[str] = None
    source: Optional[str] = None
    source_description: Optional[str] = None
    is_valid: bool = True
    device_id: Optional[str] = None
    device_name: Optional[str] = None
    wifi_name: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    employee_id: int

class Attendance(AttendanceBase):
    id: int
    employee_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class LeaveRequestBase(BaseModel):
    leave_type: str
    start_date: datetime
    end_date: datetime
    reason: Optional[str] = None

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequest(LeaveRequestBase):
    id: int
    employee_id: int
    status: str
    approver_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PayrollBase(BaseModel):
    month: str
    base_salary: float
    bonus: float
    deductions: float
    net_salary: float
    status: str

class PayrollCreate(PayrollBase):
    employee_id: int

class Payroll(PayrollBase):
    id: int
    employee_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
