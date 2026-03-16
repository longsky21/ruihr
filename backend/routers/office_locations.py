
import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, crud, database

router = APIRouter(
    prefix="/office-locations",
    tags=["office-locations"],
)

@router.get("/", response_model=List[schemas.OfficeLocation])
def read_office_locations(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    locations = crud.get_office_locations(db, skip=skip, limit=limit)
    return locations

@router.post("/", response_model=schemas.OfficeLocation)
def create_office_location(location: schemas.OfficeLocationCreate, db: Session = Depends(database.get_db)):
    return crud.create_office_location(db=db, location=location)

@router.put("/{location_id}", response_model=schemas.OfficeLocation)
def update_office_location(location_id: int, location: schemas.OfficeLocationUpdate, db: Session = Depends(database.get_db)):
    db_location = crud.update_office_location(db, location_id=location_id, location=location)
    if db_location is None:
        raise HTTPException(status_code=404, detail="Office location not found")
    return db_location

@router.delete("/{location_id}", response_model=schemas.OfficeLocation)
def delete_office_location(location_id: int, db: Session = Depends(database.get_db)):
    db_location = crud.delete_office_location(db, location_id=location_id)
    if db_location is None:
        raise HTTPException(status_code=404, detail="Office location not found")
    return db_location
