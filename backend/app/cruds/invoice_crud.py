from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.invoice_model import Invoice, InvoiceAmount, InvoicePatient
from app.models.patient_model import Patient


def _invoice_query():
    return select(Invoice).options(
        selectinload(Invoice.patients).selectinload(InvoicePatient.patient),
        selectinload(Invoice.patients).selectinload(InvoicePatient.amounts),
    )


def get_invoice(db: Session, year: int, month: int) -> Invoice | None:
    return db.scalar(
        _invoice_query().where(Invoice.year == year, Invoice.month == month)
    )


def get_or_create_invoice(db: Session, year: int, month: int) -> Invoice:
    invoice = get_invoice(db, year, month)
    if invoice:
        return invoice

    invoice = Invoice(year=year, month=month)
    db.add(invoice)
    db.flush()

    previous_year, previous_month = (
        (year - 1, 12) if month == 1 else (year, month - 1)
    )
    previous = get_invoice(db, previous_year, previous_month)
    if previous:
        for previous_patient in previous.patients:
            invoice.patients.append(
                InvoicePatient(patient_id=previous_patient.patient_id)
            )

    db.commit()
    return get_invoice(db, year, month)


def add_patient(
    db: Session, invoice: Invoice, patient: Patient
) -> InvoicePatient:
    invoice_patient = InvoicePatient(
        invoice_id=invoice.id, patient_id=patient.id
    )
    db.add(invoice_patient)
    db.commit()
    db.refresh(invoice_patient)
    return invoice_patient


def add_amount(
    db: Session, invoice_patient: InvoicePatient, amount: int
) -> InvoiceAmount:
    item = InvoiceAmount(invoice_patient_id=invoice_patient.id, amount=amount)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
