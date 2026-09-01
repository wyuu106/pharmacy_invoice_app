from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.patient_model import Patient
from app.schemas.patient_schema import PatientCreate, PatientUpdate


def list_patients(
    db: Session, query: str | None = None, is_active: bool = True
) -> list[Patient]:
    statement = select(Patient).where(Patient.is_active == is_active)
    if query and query.strip():
        keyword = f"%{query.strip()}%"
        statement = statement.where(
            or_(Patient.name.ilike(keyword), Patient.affiliation.ilike(keyword))
        )
    return list(db.scalars(statement.order_by(Patient.name, Patient.id)).all())


def get_patient(db: Session, patient_id: int) -> Patient | None:
    return db.get(Patient, patient_id)


def create_patient(db: Session, data: PatientCreate) -> Patient:
    patient = Patient(**data.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


def update_patient(
    db: Session, patient: Patient, data: PatientUpdate
) -> Patient:
    for key, value in data.model_dump().items():
        setattr(patient, key, value)
    db.commit()
    db.refresh(patient)
    return patient


def update_patient_visibility(
    db: Session, patient: Patient, is_active: bool
) -> Patient:
    patient.is_active = is_active
    db.commit()
    db.refresh(patient)
    return patient
