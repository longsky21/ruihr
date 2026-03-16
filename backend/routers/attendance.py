import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import calendar

import models, schemas, database, crud

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.get("/records", response_model=List[schemas.Attendance])
async def read_attendance_records(
    employee_id: Optional[int] = Query(None, description="员工ID"),
    start_date: Optional[str] = Query(None, description="开始日期 (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="结束日期 (YYYY-MM-DD)"),
    keyword: Optional[str] = Query(None, description="关键字搜索"),
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
        
    if keyword:
        query = query.join(models.Employee).filter(
            (models.Employee.name.ilike(f"%{keyword}%")) |
            (models.Employee.employee_no.ilike(f"%{keyword}%"))
        )
    
    records = query.order_by(models.AttendanceRecord.punch_time.desc()).offset(skip).limit(limit).all()
    
    # We need to manually construct the response because Pydantic v1 (used in Fastapi < 0.100) 
    # might have issues with nested ORM relationships if not explicitly defined
    # However, since response_model is List[schemas.Attendance], we can let Pydantic handle it
    # provided the schema matches.
    return records

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
    try:
        year, month_num = map(int, month.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
        
    # Calculate days in month
    _, days_in_month = calendar.monthrange(year, month_num)
    start_date = datetime(year, month_num, 1)
    end_date = datetime(year, month_num, days_in_month, 23, 59, 59)
    
    query = db.query(models.Employee).filter(models.Employee.status == 1) # Only active employees
    if department_id:
        query = query.filter(models.Employee.department_id == department_id)
    employees = query.all()
    
    report = []
    for employee in employees:
        # Get employee's attendance records for the month
        records = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.employee_id == employee.id,
            models.AttendanceRecord.punch_time >= start_date,
            models.AttendanceRecord.punch_time <= end_date
        ).all()
        
        # Simple logic for demonstration - can be enhanced with actual shift rules
        # Assuming 2 records per day is normal
        attendance_days = set()
        for record in records:
            attendance_days.add(record.punch_time.date())
            
        actual_days = len(attendance_days)
        # Simplified calculation
        total_working_days = 22 # Approx working days
        
        normal_days = actual_days
        absent_days = max(0, total_working_days - actual_days)
        late_days = 0 # Need shift logic
        leave_days = 0 # Need leave request integration
        overtime_hours = 0
        
        report.append({
            "employee_id": employee.id,
            "employee_name": employee.name,
            "employee_no": employee.employee_no,
            "department_name": employee.department.name if employee.department else "",
            "total_days": total_working_days,
            "normal_days": normal_days,
            "late_days": late_days,
            "absent_days": absent_days,
            "overtime_hours": overtime_hours,
            "leave_days": leave_days
        })
    
    return report
