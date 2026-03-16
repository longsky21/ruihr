import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

import models, schemas, database, crud

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.get("/records", response_model=List[schemas.Attendance])
async def read_attendance_records(
    employee_id: Optional[int] = Query(None, description="员工ID"),
    start_date: Optional[str] = Query(None, description="开始日期 (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="结束日期 (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(database.get_db)
):
    """获取打卡记录列表"""
    query = db.query(models.AttendanceRecord)
    
    if employee_id:
        query = query.filter(models.AttendanceRecord.employee_id == employee_id)
    
    if start_date:
        start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(models.AttendanceRecord.punch_time >= start_datetime)
    
    if end_date:
        end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
        end_datetime = end_datetime.replace(hour=23, minute=59, second=59)
        query = query.filter(models.AttendanceRecord.punch_time <= end_datetime)
    
    records = query.offset(skip).limit(limit).all()
    
    result = []
    for record in records:
        record_dict = {
            "id": record.id,
            "employee_id": record.employee_id,
            "punch_time": record.punch_time.isoformat(),
            "location": record.location,
            "source": record.source,
            "source_description": record.source_description,
            "is_valid": record.is_valid,
            "device_id": record.device_id,
            "device_name": record.device_name,
            "wifi_name": record.wifi_name,
            "created_at": record.created_at.isoformat(),
        }
        
        employee = db.query(models.Employee).filter(models.Employee.id == record.employee_id).first()
        if employee:
            record_dict["employee"] = {
                "id": employee.id,
                "name": employee.name,
                "employee_no": employee.employee_no
            }
        
        result.append(record_dict)
    
    return result

@router.post("/records", response_model=schemas.Attendance)
async def create_attendance_record(
    attendance: schemas.AttendanceCreate,
    db: Session = Depends(database.get_db)
):
    """创建打卡记录"""
    return crud.create_attendance(db=db, attendance=attendance)

@router.get("/report", response_model=List[dict])
async def get_attendance_report(
    month: str = Query(..., description="月份 (YYYY-MM)"),
    department_id: Optional[int] = Query(None, description="部门ID"),
    db: Session = Depends(database.get_db)
):
    """获取考勤月报"""
    year, month_num = map(int, month.split("-"))
    
    query = db.query(models.Employee)
    if department_id:
        query = query.filter(models.Employee.department_id == department_id)
    employees = query.all()
    
    report = []
    for employee in employees:
        report.append({
            "employee_id": employee.id,
            "employee_name": employee.name,
            "employee_no": employee.employee_no,
            "department_name": employee.department.name if employee.department else "",
            "total_days": 22,
            "normal_days": 20,
            "late_days": 1,
            "absent_days": 0,
            "overtime_hours": 5,
            "leave_days": 1
        })
    
    return report