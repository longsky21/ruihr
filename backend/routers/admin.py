from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from services.import_service import import_departments, import_employees

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    responses={404: {"description": "Not found"}},
)

@router.post("/import/departments")
def import_departments_api(db: Session = Depends(get_db)):
    # Get project root directory
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    file_path = os.path.join(project_root, "组织架构.csv")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Department CSV file not found")
    
    try:
        count = import_departments(db, file_path)
        return {"message": f"Successfully imported {count} departments"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import/employees")
def import_employees_api(db: Session = Depends(get_db)):
    # Get project root directory
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    file_path = os.path.join(project_root, "导出的员工信息数据.csv")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Employee CSV file not found")
    
    try:
        count = import_employees(db, file_path)
        return {"message": f"Successfully imported {count} employees"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
