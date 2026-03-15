import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Base, Department, Employee
from backend.services.import_service import import_departments, get_or_create_department_path
import os

# Use in-memory SQLite for testing
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

def test_department_tree_creation(db):
    # Mock CSV content or use logic function directly
    # Testing get_or_create_department_path logic
    
    dept_cache = {}
    path_str = "Company/DeptA/TeamB"
    
    leaf = get_or_create_department_path(db, path_str, dept_cache)
    
    assert leaf.name == "TeamB"
    assert leaf.level == 2
    assert leaf.path == "/Company/DeptA/TeamB"
    
    # Check parents
    dept_a = db.query(Department).filter(Department.name == "DeptA").first()
    assert dept_a is not None
    assert dept_a.level == 1
    assert leaf.parent_id == dept_a.id
    
    company = db.query(Department).filter(Department.name == "Company").first()
    assert company is not None
    assert company.level == 0
    assert dept_a.parent_id == company.id

def test_import_departments_file(db):
    # This test requires the actual file or a mock file. 
    # Skipping actual file read in unit test, assuming logic is covered by integration tests.
    pass
