from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, crud, database, auth
from typing import List

router = APIRouter(
    prefix="/employees",
    tags=["employees"],
    dependencies=[Depends(auth.get_current_active_user)],
)

@router.get("/", response_model=List[schemas.Employee])
def read_employees(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    employees = crud.get_employees(db, skip=skip, limit=limit)
    return employees

@router.post("/", response_model=schemas.Employee)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(database.get_db)):
    return crud.create_employee(db=db, employee=employee)

@router.get("/{employee_id}", response_model=schemas.Employee)
def read_employee(employee_id: int, db: Session = Depends(database.get_db)):
    db_employee = crud.get_employee(db, employee_id=employee_id)
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_employee

@router.put("/{employee_id}", response_model=schemas.Employee)
def update_employee(employee_id: int, employee: schemas.EmployeeUpdate, db: Session = Depends(database.get_db)):
    db_employee = crud.update_employee(db, employee_id=employee_id, employee_update=employee)
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_employee

@router.delete("/{employee_id}", response_model=schemas.Employee)
def delete_employee(employee_id: int, db: Session = Depends(database.get_db)):
    db_employee = crud.delete_employee(db, employee_id=employee_id)
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_employee

@router.post("/{employee_id}/transfer", response_model=schemas.EmployeeTransfer)
def transfer_employee(employee_id: int, transfer: schemas.EmployeeTransferCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # Verify employee exists
    db_employee = crud.get_employee(db, employee_id=employee_id)
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return crud.create_employee_transfer(db, transfer=transfer, employee_id=employee_id, operator_id=current_user.id)

@router.get("/{employee_id}/attendance", response_model=List[schemas.Attendance])
def read_attendance(employee_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.get_attendance_records(db, employee_id=employee_id, skip=skip, limit=limit)

@router.post("/{employee_id}/attendance", response_model=schemas.Attendance)
def create_attendance(employee_id: int, attendance: schemas.AttendanceCreate, db: Session = Depends(database.get_db)):
    if attendance.employee_id != employee_id:
        raise HTTPException(status_code=400, detail="Employee ID mismatch")
    return crud.create_attendance(db=db, attendance=attendance)

@router.get("/{employee_id}/leave-requests", response_model=List[schemas.LeaveRequest])
def read_leave_requests(employee_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.get_leave_requests(db, employee_id=employee_id, skip=skip, limit=limit)

@router.post("/{employee_id}/leave-requests", response_model=schemas.LeaveRequest)
def create_leave_request(employee_id: int, leave: schemas.LeaveRequestCreate, db: Session = Depends(database.get_db)):
    return crud.create_leave_request(db=db, leave=leave, employee_id=employee_id)

@router.get("/{employee_id}/payrolls", response_model=List[schemas.Payroll])
def read_payrolls(employee_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.get_payrolls(db, employee_id=employee_id, skip=skip, limit=limit)
