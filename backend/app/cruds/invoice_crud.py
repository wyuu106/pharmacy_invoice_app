from sqlalchemy import and_, or_, select
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


def _get_latest_initialized_invoice(
    db: Session, year: int, month: int
) -> Invoice | None:
    return db.scalar(
        _invoice_query()
        .where(
            or_(
                Invoice.year < year,
                and_(Invoice.year == year, Invoice.month < month),
            ),
            or_(Invoice.store_name != "", Invoice.patients.any()),
        )
        .order_by(Invoice.year.desc(), Invoice.month.desc())
        .limit(1)
    )


def _copy_invoice_defaults(invoice: Invoice, previous: Invoice) -> None:
    invoice.store_name = previous.store_name
    for previous_patient in previous.patients:
        invoice.patients.append(
            InvoicePatient(patient_id=previous_patient.patient_id)
        )


def get_or_create_invoice(db: Session, year: int, month: int) -> Invoice:
    invoice = get_invoice(db, year, month)
    if invoice:
        # 旧仕様で年月を飛ばした際に作られた空の請求書も補完する。
        if not invoice.store_name and not invoice.patients:
            previous = _get_latest_initialized_invoice(db, year, month)
            if previous:
                _copy_invoice_defaults(invoice, previous)
                db.commit()
                return get_invoice(db, year, month)
        return invoice

    previous = _get_latest_initialized_invoice(db, year, month)
    invoice = Invoice(
        year=year,
        month=month,
        store_name=previous.store_name if previous else "",
    )
    db.add(invoice)
    db.flush()

    if previous:
        _copy_invoice_defaults(invoice, previous)

    db.commit()
    return get_invoice(db, year, month)


def update_invoice_store_name(
    db: Session, invoice: Invoice, store_name: str
) -> Invoice:
    invoice.store_name = store_name.strip()
    db.commit()
    return get_invoice(db, invoice.year, invoice.month)


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
