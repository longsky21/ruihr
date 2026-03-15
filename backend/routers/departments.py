from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any
from .. import models, schemas, database

router = APIRouter(
    prefix="/departments",
    tags=["departments"],
)

def build_tree(depts):
    dept_map = {dept.id: {
        "id": dept.id,
        "key": dept.id,
        "title": dept.name,
        "value": dept.id,
        "name": dept.name,
        "code": dept.code,
        "manager_name": dept.manager_name,
        "level": dept.level,
        "children": []
    } for dept in depts}
    
    tree = []
    for dept in depts:
        node = dept_map[dept.id]
        if dept.parent_id and dept.parent_id in dept_map:
            dept_map[dept.parent_id]["children"].append(node)
        else:
            tree.append(node)
    return tree

@router.get("/tree")
def get_department_tree(db: Session = Depends(database.get_db)):
    depts = db.query(models.Department).filter(models.Department.status == "active").all()
    return build_tree(depts)

@router.get("/", response_model=List[schemas.Department])
def get_departments(db: Session = Depends(database.get_db)):
    return db.query(models.Department).all()

@router.put("/{department_id}/move", response_model=schemas.Department)
def move_department(department_id: int, move_data: schemas.DepartmentMove, db: Session = Depends(database.get_db)):
    try:
        dept = crud.move_department(db, department_id, move_data.new_parent_id)
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
        return dept
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{department_id}", response_model=schemas.DepartmentDetail)
def get_department_detail(department_id: int, db: Session = Depends(database.get_db)):
    dept = crud.get_department(db, department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Calculate counts
    children_count = db.query(models.Department).filter(models.Department.parent_id == department_id).count()
    employee_count = db.query(models.Employee).filter(models.Employee.department_id == department_id, models.Employee.is_deleted == False).count()
    
    # Create schema manually since dept is ORM object
    dept_detail = schemas.DepartmentDetail.model_validate(dept)
    dept_detail.children_count = children_count
    dept_detail.employee_count = employee_count
    
    return dept_detail

@router.delete("/{department_id}")
def delete_department(department_id: int, db: Session = Depends(database.get_db)):
    dept = crud.get_department(db, department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check impact
    children_count = db.query(models.Department).filter(models.Department.parent_id == department_id).count()
    employee_count = db.query(models.Employee).filter(models.Employee.department_id == department_id, models.Employee.is_deleted == False).count()
    
    if children_count > 0 or employee_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete department with {children_count} children and {employee_count} employees. Move or remove them first.")
    
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted"}
