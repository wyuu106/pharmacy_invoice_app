from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.cruds import patient_crud
from app.db import get_db
from app.schemas.patient_schema import (
    PatientCreate,
    PatientResponse,
    PatientUpdate,
)

router = APIRouter(prefix="/patients", tags=["患者"])


def require_patient(db: Session, patient_id: int):
    patient = patient_crud.get_patient(db, patient_id)
    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="患者が見つかりません",
        )
    return patient


@router.get("", response_model=list[PatientResponse])
def list_patients(query: str | None = None, db: Session = Depends(get_db)):
    return patient_crud.list_patients(db, query)


@router.post(
    "", response_model=PatientResponse, status_code=status.HTTP_201_CREATED
)
def create_patient(data: PatientCreate, db: Session = Depends(get_db)):
    return patient_crud.create_patient(db, data)


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    return require_patient(db, patient_id)


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int, data: PatientUpdate, db: Session = Depends(get_db)
):
    return patient_crud.update_patient(
        db, require_patient(db, patient_id), data
    )
