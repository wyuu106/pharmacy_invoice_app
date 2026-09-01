from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = (
        UniqueConstraint("year", "month", name="uq_invoice_year_month"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int] = mapped_column(Integer)
    month: Mapped[int] = mapped_column(Integer)
    store_name: Mapped[str] = mapped_column(
        String(100), default="", server_default=""
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    patients = relationship(
        "InvoicePatient",
        back_populates="invoice",
        cascade="all, delete-orphan",
        order_by="InvoicePatient.id",
    )


class InvoicePatient(Base):
    __tablename__ = "invoice_patients"
    __table_args__ = (
        UniqueConstraint("invoice_id", "patient_id", name="uq_invoice_patient"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_id: Mapped[int] = mapped_column(
        ForeignKey("invoices.id", ondelete="CASCADE")
    )
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="RESTRICT")
    )

    invoice = relationship("Invoice", back_populates="patients")
    patient = relationship("Patient", back_populates="invoice_patients")
    amounts = relationship(
        "InvoiceAmount",
        back_populates="invoice_patient",
        cascade="all, delete-orphan",
        order_by="InvoiceAmount.id",
    )


class InvoiceAmount(Base):
    __tablename__ = "invoice_amounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_patient_id: Mapped[int] = mapped_column(
        ForeignKey("invoice_patients.id", ondelete="CASCADE")
    )
    amount: Mapped[int] = mapped_column(Integer, default=0)

    invoice_patient = relationship("InvoicePatient", back_populates="amounts")
