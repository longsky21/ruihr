import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Base, Employee, EmployeeContact, EmployeePosition, EmployeeTransfer, Department
from backend.crud import get_employees, get_employee, update_employee, delete_employee, create_employee_transfer
from backend.schemas import EmployeeUpdate, EmployeeTransferCreate
from datetime import date

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def sample_employee(db):
    dept = Department(name="IT Dept", path="/Company/IT", level=1)
    db.add(dept)
    db.flush() # Get ID
    
    emp = Employee(name="John Doe", employee_no="EMP001", department_id=dept.id)
    db.add(emp)
    db.flush() # Get ID
    
    contact = EmployeeContact(employee_id=emp.id, phone="1234567890", email="john@example.com")
    db.add(contact)
    
    position = EmployeePosition(employee_id=emp.id, job_title="Developer", hire_date=date(2023, 1, 1))
    db.add(position)
    
    db.commit()
    db.refresh(emp)
    return emp

def test_get_employee(db, sample_employee):
    emp = get_employee(db, sample_employee.id)
    assert emp is not None
    assert emp.name == "John Doe"
    assert emp.contact.phone == "1234567890"

def test_update_employee(db, sample_employee):
    update_data = EmployeeUpdate(
        name="John Updated",
        contact={"phone": "0987654321"},
        position_info={"job_title": "Senior Developer"}
    )
    
    updated_emp = update_employee(db, sample_employee.id, update_data)
    
    assert updated_emp.name == "John Updated"
    assert updated_emp.contact.phone == "0987654321"
    assert updated_emp.position_info.job_title == "Senior Developer"

def test_soft_delete_employee(db, sample_employee):
    # Ensure exists
    assert get_employee(db, sample_employee.id) is not None
    
    # Delete
    delete_employee(db, sample_employee.id)
    
    # Check if retrieval returns None
    assert get_employee(db, sample_employee.id) is None
    
    # Verify in DB directly (is_deleted=True)
    emp_in_db = db.query(Employee).filter(Employee.id == sample_employee.id).first()
    assert emp_in_db is not None
    assert emp_in_db.is_deleted is True

def test_employee_transfer(db, sample_employee):
    transfer_data = EmployeeTransferCreate(
        transfer_type="transfer",
        old_position_title="Developer",
        new_position_title="Lead Developer",
        reason="Promotion",
        effective_date=date(2024, 1, 1)
    )
    
    transfer = create_employee_transfer(db, transfer_data, sample_employee.id)
    
    assert transfer.id is not None
    assert transfer.employee_id == sample_employee.id
    assert transfer.transfer_type == "transfer"
    
    # Check relationship
    emp = get_employee(db, sample_employee.id)
    assert len(emp.transfers) == 1
    assert emp.transfers[0].reason == "Promotion"
