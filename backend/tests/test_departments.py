import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Base, Department
from backend import crud, schemas

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

def test_move_department(db):
    # Setup: Create A -> B -> C
    dept_a = Department(name="A", path="/A", level=0)
    db.add(dept_a)
    db.commit()
    
    dept_b = Department(name="B", parent_id=dept_a.id, path="/A/B", level=1)
    db.add(dept_b)
    db.commit()
    
    dept_c = Department(name="C", parent_id=dept_b.id, path="/A/B/C", level=2)
    db.add(dept_c)
    db.commit()
    
    # Create Target X
    dept_x = Department(name="X", path="/X", level=0)
    db.add(dept_x)
    db.commit()
    
    # Move B to X
    # Expected: X -> B -> C
    # B path: /X/B, level 1
    # C path: /X/B/C, level 2
    
    updated_b = crud.move_department(db, dept_b.id, dept_x.id)
    assert updated_b.parent_id == dept_x.id
    assert updated_b.path == "/X/B"
    assert updated_b.level == 1
    
    updated_c = db.query(Department).filter(Department.id == dept_c.id).first()
    assert updated_c.path == "/X/B/C"
    assert updated_c.level == 2

def test_move_department_to_root(db):
    # Setup: A -> B
    dept_a = Department(name="A", path="/A", level=0)
    db.add(dept_a)
    db.commit()
    
    dept_b = Department(name="B", parent_id=dept_a.id, path="/A/B", level=1)
    db.add(dept_b)
    db.commit()
    
    # Move B to Root
    updated_b = crud.move_department(db, dept_b.id, None)
    assert updated_b.parent_id == None
    assert updated_b.path == "/B"
    assert updated_b.level == 0
