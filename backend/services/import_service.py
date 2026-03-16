import csv
import logging
from sqlalchemy.orm import Session
import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Department, Employee, EmployeeContact, EmployeePosition, User, AttendanceRecord
from datetime import datetime

logger = logging.getLogger(__name__)

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return None

def empty_to_none(val):
    if not val or val.strip() == "":
        return None
    return val.strip()

def import_departments(db: Session, file_path: str):
    logger.info(f"Importing departments from {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        # Cache for departments: path -> Department object
        dept_cache = {}
        
        # Pre-load existing departments
        existing_depts = db.query(Department).all()
        for d in existing_depts:
            dept_cache[d.path] = d
            
        count = 0
        for row in reader:
            company_name = row.get('所属公司')
            dept_name = row.get('1级部门')
            
            if not company_name:
                continue

            # 1. Process Root (Company)
            root_path = f"/{company_name}"
            if root_path not in dept_cache:
                root = Department(
                    name=company_name,
                    code="ROOT", # Placeholder
                    parent_id=None,
                    path=root_path,
                    level=0,
                    category="公司",
                    status="active"
                )
                db.add(root)
                db.flush() # Get ID
                dept_cache[root_path] = root
            
            root_dept = dept_cache[root_path]

            # 2. Process Level 1 Department
            if dept_name:
                l1_path = f"{root_path}/{dept_name}"
                if l1_path not in dept_cache:
                    l1 = Department(
                        name=dept_name,
                        code=empty_to_none(row.get('部门编码')),
                        parent_id=root_dept.id,
                        path=l1_path,
                        level=1,
                        manager_name=row.get('部门负责人姓名'),
                        manager_phone=row.get('部门负责人手机号'),
                        category=row.get('组织类别'),
                        is_virtual=row.get('是否虚拟组织') == '是',
                        location=row.get('工作地点'),
                        cost_center=row.get('成本中心'),
                        description=row.get('组织描述'),
                        remark=row.get('备注'),
                        status="active" if row.get('状态') == '启用' else "disabled",
                        established_date=parse_date(row.get('设立日期')),
                    )
                    db.add(l1)
                    db.flush()
                    dept_cache[l1_path] = l1
            
            count += 1
            
        db.commit()
        return count

def get_or_create_department_path(db: Session, path_str: str, dept_cache: dict):
    # path_str example: "北京睿和良木管理咨询有限公司/猎头业务/南京/南京-王志刚组"
    parts = path_str.split('/')
    current_path = ""
    parent_id = None
    last_dept = None
    
    for i, part in enumerate(parts):
        current_path += f"/{part}"
        
        if current_path in dept_cache:
            last_dept = dept_cache[current_path]
            parent_id = last_dept.id
        else:
            # Create new department
            new_dept = Department(
                name=part,
                parent_id=parent_id,
                path=current_path,
                level=i,
                status="active"
            )
            db.add(new_dept)
            db.flush()
            dept_cache[current_path] = new_dept
            last_dept = new_dept
            parent_id = new_dept.id
            
    return last_dept

def import_employees(db: Session, file_path: str):
    logger.info(f"Importing employees from {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        # Cache departments
        dept_cache = {}
        existing_depts = db.query(Department).all()
        for d in existing_depts:
            dept_cache[d.path] = d
            
        count = 0
        for row in reader:
            name = row.get('姓名')
            phone = row.get('手机号码')
            id_card = row.get('证件号')
            dept_path_str = row.get('部门')
            
            if not name or not phone:
                continue
                
            # 1. Handle Department
            department = None
            if dept_path_str:
                department = get_or_create_department_path(db, dept_path_str, dept_cache)
            
            # 2. Create/Update Employee (Main)
            # Check if exists by phone (or employee_no if available and reliable)
            # Use phone as unique key for import matching as user suggested "手机号...唯一索引"
            
            # Try to link to existing User
            user = db.query(User).filter(User.username == phone).first()
            
            # Check by phone in EmployeeContact
            contact = db.query(EmployeeContact).filter(EmployeeContact.phone == phone).first()
            employee = contact.employee if contact else None
            
            # Or check by employee_no
            emp_no = empty_to_none(row.get('工号'))
            if not employee and emp_no:
                employee = db.query(Employee).filter(Employee.employee_no == emp_no).first()
            
            if not employee:
                employee = Employee(
                    employee_no=emp_no,
                    name=name,
                    english_name=row.get('英文名'),
                    status=row.get('员工状态'),
                    department_id=department.id if department else None,
                    user_id=user.id if user else None,
                    gender=row.get('性别'),
                    birthday=parse_date(row.get('出生日期')),
                    id_card_type=row.get('证件类型'),
                    id_card_no=id_card,
                    nationality='中国', # Default
                    hukou_type=row.get('户口类型'),
                    hukou_location=row.get('户口所在地'),
                    native_place=row.get('籍贯'),
                    marital_status=row.get('婚姻状况'),
                    political_status=row.get('政治面貌'),
                    education=row.get('最高学历'),
                    version=1
                )
                db.add(employee)
                db.flush()
            else:
                # Update logic if needed
                employee.department_id = department.id if department else employee.department_id
                employee.user_id = user.id if user else employee.user_id
            
            # 3. Create/Update Contact
            contact = db.query(EmployeeContact).filter(EmployeeContact.employee_id == employee.id).first()
            if not contact:
                contact = EmployeeContact(
                    employee_id=employee.id,
                    phone=phone,
                    email=row.get('个人邮箱'),
                    work_email=row.get('工作邮箱'),
                    work_phone=row.get('工作电话'),
                    wechat=row.get('微信'),
                    contact_address=row.get('联系地址'),
                    home_address=row.get('居住住址'),
                    emergency_contact_name=row.get('紧急联系人姓名'),
                    emergency_contact_phone=row.get('紧急联系人电话')
                )
                db.add(contact)
            
            # 4. Create/Update Position
            position = db.query(EmployeePosition).filter(EmployeePosition.employee_id == employee.id).first()
            if not position:
                position = EmployeePosition(
                    employee_id=employee.id,
                    position_title=row.get('职位'),
                    job_title=row.get('职务'),
                    job_level=row.get('职级'),
                    hire_date=parse_date(row.get('入职日期')),
                    employment_type=row.get('员工类型'),
                    contract_company=row.get('合同公司'),
                    contract_type=row.get('合同类型'),
                    probation_months=int(row.get('试用期(月)')) if row.get('试用期(月)') else None,
                    probation_end_date=parse_date(row.get('试用期到期日')),
                    probation_status=row.get('试用期状态'),
                    contract_start_date=parse_date(row.get('当前合同开始日')),
                    contract_end_date=parse_date(row.get('当前合同结束日')),
                    work_location=row.get('工作地点')
                )
                db.add(position)
            
            count += 1
            
        db.commit()
        return count
