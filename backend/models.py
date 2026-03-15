from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, Enum, DateTime, Date, DECIMAL, Index
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime
import enum

class UserStatus(enum.Enum):
    active = 1
    disabled = 0

class Gender(enum.Enum):
    male = "male"
    female = "female"
    other = "other"

class JobStatus(enum.Enum):
    open = "open"
    paused = "paused"
    closed = "closed"

class ApplicationStatus(enum.Enum):
    applied = "applied"
    screening = "screening"
    interview = "interview"
    offer = "offer"
    hired = "hired"
    rejected = "rejected"

class LeaveStatus(enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class PayrollStatus(enum.Enum):
    draft = "draft"
    published = "published"
    paid = "paid"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(120), unique=True, index=True)
    password_hash = Column(String(255))
    status = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="user", uselist=False)
    roles = relationship("Role", secondary="user_roles", back_populates="users")

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True)
    description = Column(String(255))
    users = relationship("User", secondary="user_roles", back_populates="roles")

class UserRole(Base):
    __tablename__ = "user_roles"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    code = Column(String(50), unique=True, index=True)
    parent_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    path = Column(String(255), index=True) # Materialized path: /1/2/3
    level = Column(Integer, default=1)
    
    manager_name = Column(String(50))
    manager_phone = Column(String(20))
    
    category = Column(String(50)) # 组织类别
    is_virtual = Column(Boolean, default=False)
    location = Column(String(100))
    cost_center = Column(String(50))
    description = Column(Text)
    remark = Column(Text)
    status = Column(String(20), default="active") # 启用/停用
    established_date = Column(Date)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    parent = relationship("Department", remote_side=[id])
    employees = relationship("Employee", back_populates="department")
    jobs = relationship("Job", back_populates="department")

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True) # Link to login user
    employee_no = Column(String(50), unique=True, index=True)
    name = Column(String(100), index=True)
    english_name = Column(String(100))
    status = Column(String(20), default="active") # 在职, 离职
    department_id = Column(Integer, ForeignKey("departments.id"))
    
    gender = Column(String(10))
    birthday = Column(Date)
    id_card_type = Column(String(20))
    id_card_no = Column(String(50))
    
    nationality = Column(String(50))
    hukou_type = Column(String(20))
    hukou_location = Column(String(100))
    native_place = Column(String(100))
    marital_status = Column(String(20))
    political_status = Column(String(20))
    education = Column(String(20))
    avatar = Column(String(255))
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)
    version = Column(Integer, default=1)
    
    # Relationships
    user = relationship("User", back_populates="employee")
    department = relationship("Department", back_populates="employees")
    contact = relationship("EmployeeContact", back_populates="employee", uselist=False)
    position_info = relationship("EmployeePosition", back_populates="employee", uselist=False)
    attendance_records = relationship("AttendanceRecord", back_populates="employee")
    leave_requests = relationship("LeaveRequest", back_populates="employee")
    payrolls = relationship("Payroll", back_populates="employee")
    transfers = relationship("EmployeeTransfer", back_populates="employee")

class EmployeeTransfer(Base):
    __tablename__ = "employee_transfers"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    
    transfer_type = Column(String(50)) # transfer, departure, reinstatement
    
    old_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    new_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    
    old_position_title = Column(String(100), nullable=True)
    new_position_title = Column(String(100), nullable=True)
    
    reason = Column(Text)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    effective_date = Column(Date)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    employee = relationship("Employee", back_populates="transfers")
    operator = relationship("User")
    old_department = relationship("Department", foreign_keys=[old_department_id])
    new_department = relationship("Department", foreign_keys=[new_department_id])

class EmployeeContact(Base):
    __tablename__ = "employee_contacts"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), unique=True)
    
    phone = Column(String(30), unique=True, index=True)
    email = Column(String(120))
    work_phone = Column(String(30))
    work_email = Column(String(120))
    wechat = Column(String(50))
    
    contact_address = Column(String(255))
    home_address = Column(String(255))
    
    emergency_contact_name = Column(String(50))
    emergency_contact_phone = Column(String(30))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    employee = relationship("Employee", back_populates="contact")

class EmployeePosition(Base):
    __tablename__ = "employee_positions"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), unique=True)
    
    position_title = Column(String(100)) # 职位
    job_title = Column(String(100)) # 职务
    job_level = Column(String(50)) # 职级
    
    hire_date = Column(Date)
    employment_type = Column(String(50)) # 全职, 实习
    contract_company = Column(String(100))
    contract_type = Column(String(50))
    
    probation_months = Column(Integer)
    probation_end_date = Column(Date)
    probation_status = Column(String(20))
    
    contract_start_date = Column(Date)
    contract_end_date = Column(Date)
    
    work_location = Column(String(100))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    employee = relationship("Employee", back_populates="position_info")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150))
    department_id = Column(Integer, ForeignKey("departments.id"))
    description = Column(Text)
    status = Column(Enum(JobStatus), default=JobStatus.open)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = relationship("Department", back_populates="jobs")
    applications = relationship("Application", back_populates="job")

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(120))
    phone = Column(String(30))
    resume_url = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    applications = relationship("Application", back_populates="candidate")

class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.applied)
    applied_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job = relationship("Job", back_populates="applications")
    candidate = relationship("Candidate", back_populates="applications")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    punch_time = Column(DateTime, nullable=False)
    location = Column(String(255))
    source = Column(String(50))
    source_description = Column(String(255))
    is_valid = Column(Boolean, default=True)
    device_id = Column(Text)
    device_name = Column(String(255))
    wifi_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="attendance_records")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    leave_type = Column(String(50))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    reason = Column(Text)
    status = Column(Enum(LeaveStatus), default=LeaveStatus.pending)
    approver_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="leave_requests")
    approver = relationship("User", foreign_keys=[approver_id])

class Payroll(Base):
    __tablename__ = "payrolls"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    month = Column(String(7))
    base_salary = Column(DECIMAL(10, 2))
    bonus = Column(DECIMAL(10, 2))
    deductions = Column(DECIMAL(10, 2))
    net_salary = Column(DECIMAL(10, 2))
    status = Column(Enum(PayrollStatus), default=PayrollStatus.draft)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="payrolls")
