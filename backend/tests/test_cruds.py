import os
import unittest

os.environ["DATABASE_URL"] = "sqlite://"

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.cruds import invoice_crud, patient_crud
from app.db import Base
from app.models import InvoiceAmount, Patient  # noqa: F401
from app.schemas.patient_schema import PatientCreate, PatientUpdate


class CrudTestCase(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def test_patient_create_search_and_update(self):
        patient_crud.create_patient(
            self.db,
            PatientCreate(
                name="山田 太郎",
                affiliation="青空薬局",
                memo="毎月請求",
            ),
        )
        self.assertEqual(len(patient_crud.list_patients(self.db, "青空")), 1)
        patient = patient_crud.list_patients(self.db)[0]
        updated = patient_crud.update_patient(
            self.db,
            patient,
            PatientUpdate(
                name="山田 太郎",
                affiliation="青空病院",
                memo="",
            ),
        )
        self.assertEqual(updated.affiliation, "青空病院")
        self.assertIsNone(updated.memo)

    def test_invoice_totals_and_previous_month_copy(self):
        patient = patient_crud.create_patient(
            self.db, PatientCreate(name="佐藤 花子")
        )
        april = invoice_crud.get_or_create_invoice(self.db, 2026, 4)
        invoice_patient = invoice_crud.add_patient(self.db, april, patient)
        invoice_crud.add_amount(self.db, invoice_patient, 1200)
        invoice_crud.add_amount(self.db, invoice_patient, 800)

        april = invoice_crud.get_invoice(self.db, 2026, 4)
        self.assertEqual(
            sum(item.amount for item in april.patients[0].amounts), 2000
        )

        may = invoice_crud.get_or_create_invoice(self.db, 2026, 5)
        self.assertEqual(
            [item.patient_id for item in may.patients], [patient.id]
        )
        self.assertEqual(may.patients[0].amounts, [])


if __name__ == "__main__":
    unittest.main()
