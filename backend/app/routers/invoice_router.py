from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.cruds import invoice_crud
from app.db import get_db
from app.models.invoice_model import InvoiceAmount, InvoicePatient
from app.models.patient_model import Patient
from app.schemas.invoice_schema import (
    AmountCreate,
    AmountResponse,
    InvoicePatientResponse,
    InvoiceResponse,
    PatientAddRequest,
)

router = APIRouter(prefix="/invoices", tags=["請求書"])


def validate_period(year: int, month: int) -> None:
    if year < 2000 or year > 2100 or month < 1 or month > 12:
        raise HTTPException(
            status_code=422, detail="正しい年月を指定してください"
        )


def serialize_invoice(invoice) -> InvoiceResponse:
    patients = []
    for item in invoice.patients:
        subtotal = sum(amount.amount for amount in item.amounts)
        patients.append(
            InvoicePatientResponse(
                id=item.id,
                patient=item.patient,
                amounts=[
                    AmountResponse.model_validate(amount)
                    for amount in item.amounts
                ],
                subtotal=subtotal,
            )
        )
    return InvoiceResponse(
        id=invoice.id,
        year=invoice.year,
        month=invoice.month,
        patients=patients,
        total=sum(item.subtotal for item in patients),
    )


def require_invoice_patient(
    db: Session, invoice_patient_id: int
) -> InvoicePatient:
    item = db.get(InvoicePatient, invoice_patient_id)
    if item is None:
        raise HTTPException(
            status_code=404,
            detail="請求対象の患者が見つかりません",
        )
    return item


@router.get("/current", response_model=InvoiceResponse)
def current_invoice(db: Session = Depends(get_db)):
    today = date.today()
    return serialize_invoice(
        invoice_crud.get_or_create_invoice(db, today.year, today.month)
    )


@router.get("/{year}/{month}", response_model=InvoiceResponse)
def get_invoice(year: int, month: int, db: Session = Depends(get_db)):
    validate_period(year, month)
    return serialize_invoice(
        invoice_crud.get_or_create_invoice(db, year, month)
    )


@router.post("/{year}/{month}/patients", response_model=InvoiceResponse)
def add_patient(
    year: int,
    month: int,
    data: PatientAddRequest,
    db: Session = Depends(get_db),
):
    validate_period(year, month)
    patient = db.get(Patient, data.patient_id)
    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="患者が見つかりません",
        )
    invoice = invoice_crud.get_or_create_invoice(db, year, month)
    try:
        invoice_crud.add_patient(db, invoice, patient)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="この患者はすでに追加されています",
        )
    return serialize_invoice(invoice_crud.get_invoice(db, year, month))


@router.delete(
    "/patients/{invoice_patient_id}", status_code=status.HTTP_204_NO_CONTENT
)
def remove_patient(invoice_patient_id: int, db: Session = Depends(get_db)):
    item = require_invoice_patient(db, invoice_patient_id)
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/patients/{invoice_patient_id}/amounts", response_model=AmountResponse
)
def add_amount(
    invoice_patient_id: int, data: AmountCreate, db: Session = Depends(get_db)
):
    return invoice_crud.add_amount(
        db, require_invoice_patient(db, invoice_patient_id), data.amount
    )


@router.put("/amounts/{amount_id}", response_model=AmountResponse)
def update_amount(
    amount_id: int, data: AmountCreate, db: Session = Depends(get_db)
):
    amount = db.get(InvoiceAmount, amount_id)
    if amount is None:
        raise HTTPException(
            status_code=404,
            detail="金額明細が見つかりません",
        )
    amount.amount = data.amount
    db.commit()
    db.refresh(amount)
    return amount


@router.delete("/amounts/{amount_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_amount(amount_id: int, db: Session = Depends(get_db)):
    amount = db.get(InvoiceAmount, amount_id)
    if amount is None:
        raise HTTPException(
            status_code=404,
            detail="金額明細が見つかりません",
        )
    db.delete(amount)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
