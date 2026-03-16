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
    level: Optional[int] = None
    manager_name: Optional[str] = None
    manager_phone: Optional[str] = None
    category: Optional[str] = None
    is_virtual: bool = False
    location: Optional[int] = None # Now stores OfficeLocation ID
    cost_center: Optional[str] = None
    description: Optional[str] = None
    remark: Optional[str] = None
    status: str = "active"
    established_date: Optional[date] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None
    code: Optional[str] = None
    manager_name: Optional[str] = None
    manager_phone: Optional[str] = None
    category: Optional[str] = None
    is_virtual: Optional[bool] = None
    location: Optional[int] = None
    cost_center: Optional[str] = None
    description: Optional[str] = None
    remark: Optional[str] = None
    status: Optional[str] = None
    established_date: Optional[date] = None

class DepartmentMove(BaseModel):
    new_parent_id: Optional[int] = None

class Department(DepartmentBase):
    id: int
    office_location: Optional['OfficeLocation'] = None # Include related office location

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
    wechat: Optional[str] = None
    contact_address: Optional[str] = None
    home_address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    class Config:
        from_attributes = True

class EmployeePositionBase(BaseModel):
    position_title: Optional[str] = None
    job_title: Optional[str] = None
    job_level: Optional[str] = None
    hire_date: Optional[date] = None

class EmployeePosition(EmployeePositionBase):
    id: int
    employment_type: Optional[str] = None
    contract_company: Optional[str] = None
    contract_type: Optional[str] = None
    probation_months: Optional[int] = None
    probation_end_date: Optional[date] = None
    probation_status: Optional[str] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    work_location: Optional[str] = None
    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    employee_no: Optional[str] = None
    name: str
    english_name: Optional[str] = None
    status: int = 1
    department_id: Optional[int] = None
    
    gender: Optional[str] = None
    birthday: Optional[date] = None
    id_card_type: Optional[str] = None
    id_card_no: Optional[str] = None
    
    nationality: Optional[str] = None
    hukou_type: Optional[str] = None
    hukou_location: Optional[str] = None
    native_place: Optional[str] = None
    marital_status: Optional[str] = None
    political_status: Optional[str] = None
    education: Optional[str] = None
    avatar: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    phone: Optional[str] = None # Added for creation convenience
    email: Optional[str] = None
    work_phone: Optional[str] = None
    work_email: Optional[str] = None
    wechat: Optional[str] = None
    contact_address: Optional[str] = None
    home_address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    
    position_title: Optional[str] = None
    job_title: Optional[str] = None
    job_level: Optional[str] = None
    hire_date: Optional[date] = None
    employment_type: Optional[str] = None
    contract_company: Optional[str] = None
    contract_type: Optional[str] = None
    probation_months: Optional[int] = None
    probation_end_date: Optional[date] = None
    probation_status: Optional[str] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    work_location: Optional[str] = None

class EmployeeContactUpdate(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    work_phone: Optional[str] = None
    work_email: Optional[str] = None
    wechat: Optional[str] = None
    contact_address: Optional[str] = None
    home_address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class EmployeePositionUpdate(BaseModel):
    position_title: Optional[str] = None
    job_title: Optional[str] = None
    job_level: Optional[str] = None
    hire_date: Optional[date] = None
    employment_type: Optional[str] = None
    contract_company: Optional[str] = None
    contract_type: Optional[str] = None
    probation_months: Optional[int] = None
    probation_end_date: Optional[date] = None
    probation_status: Optional[str] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    work_location: Optional[str] = None

class EmployeeUpdate(BaseModel):
    employee_no: Optional[str] = None
    name: Optional[str] = None
    english_name: Optional[str] = None
    status: Optional[int] = None
    department_id: Optional[int] = None
    
    gender: Optional[str] = None
    birthday: Optional[date] = None
    id_card_type: Optional[str] = None
    id_card_no: Optional[str] = None
    
    nationality: Optional[str] = None
    hukou_type: Optional[str] = None
    hukou_location: Optional[str] = None
    native_place: Optional[str] = None
    marital_status: Optional[str] = None
    political_status: Optional[str] = None
    education: Optional[str] = None
    avatar: Optional[str] = None
    
    contact: Optional[EmployeeContactUpdate] = None
    position_info: Optional[EmployeePositionUpdate] = None

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

class Employee(EmployeeBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested fields
    department: Optional[Department] = None
    contact: Optional[EmployeeContact] = None
    position_info: Optional[EmployeePosition] = None
    payrolls: Optional[List[Payroll]] = []
    office_location_id: Optional[int] = None
    office_location: Optional['OfficeLocation'] = None

    class Config:
        from_attributes = True

class OfficeLocationBase(BaseModel):
    name: str
    city: Optional[str] = None
    address: Optional[str] = None
    latitude: float
    longitude: float
    radius: Optional[int] = 500

class OfficeLocationCreate(OfficeLocationBase):
    pass

class OfficeLocationUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius: Optional[int] = None

class OfficeLocation(OfficeLocationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Extended schemas for full employee details

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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
