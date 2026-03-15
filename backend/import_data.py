import pandas as pd
import sys
import os
from sqlalchemy.orm import Session
from datetime import datetime

# When running as module, we don't need sys.path hack if run from root
# But we need to handle imports correctly

from .database import SessionLocal, engine
from . import models
from . import crud
from . import schemas
from .auth import get_password_hash

def import_data():
    db = SessionLocal()
    try:
        # Load CSVs
        # Assuming we are running from root, csvs are in current dir
        base_path = os.getcwd()
        job_csv = os.path.join(base_path, 'StaffJobHistory.csv')
        
        if os.path.exists(job_csv):
            print(f"Reading {job_csv}...")
            df = pd.read_csv(job_csv)
            
            for index, row in df.iterrows():
                name = str(row['姓名']).strip()
                if not name or name == 'nan': continue
                
                phone = str(row['手机号码']).strip()
                dept_name = str(row['部门']).strip()
                emp_no = str(row['工号']).strip() if pd.notna(row['工号']) else None
                position = str(row['职位']).strip() if pd.notna(row['职位']) else None
                hire_date_str = str(row['入职日期']).strip() if pd.notna(row['入职日期']) else None
                
                # Create Department
                dept = db.query(models.Department).filter(models.Department.name == dept_name).first()
                if not dept and dept_name != 'nan':
                    dept = models.Department(name=dept_name)
                    db.add(dept)
                    db.commit()
                    db.refresh(dept)
                
                # Create User
                username = emp_no if emp_no and emp_no != 'nan' else phone
                if not username or username == 'nan':
                    username = f"user_{index}"
                
                user = db.query(models.User).filter(models.User.username == username).first()
                if not user:
                    user = models.User(
                        username=username,
                        email=f"{username}@ruihr.com",
                        password_hash=get_password_hash("password123"),
                        status=1
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                
                # Create Employee
                employee = db.query(models.Employee).filter(models.Employee.name == name).first()
                if not employee:
                    hire_date = None
                    if hire_date_str and hire_date_str != 'nan':
                        try:
                            hire_date = datetime.strptime(hire_date_str, '%Y-%m-%d').date()
                        except:
                            pass
                            
                    employee = models.Employee(
                        user_id=user.id,
                        name=name,
                        employee_no=emp_no if emp_no != 'nan' else None,
                        phone=phone if phone != 'nan' else None,
                        department_id=dept.id if dept else None,
                        position=position if position != 'nan' else None,
                        hire_date=hire_date
                    )
                    db.add(employee)
                    db.commit()
                    print(f"Imported employee: {name}")
                else:
                    # print(f"Employee {name} already exists.")
                    pass
                    
        else:
            print(f"File not found: {job_csv}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    import_data()
