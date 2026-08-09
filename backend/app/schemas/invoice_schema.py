from pydantic import BaseModel, ConfigDict, Field

from app.schemas.patient_schema import PatientResponse


class AmountCreate(BaseModel):
    amount: int = Field(ge=0, le=999_999_999)


class AmountResponse(AmountCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int


class InvoicePatientResponse(BaseModel):
    id: int
    patient: PatientResponse
    amounts: list[AmountResponse]
    subtotal: int


class InvoiceResponse(BaseModel):
    id: int
    year: int
    month: int
    patients: list[InvoicePatientResponse]
    total: int


class PatientAddRequest(BaseModel):
    patient_id: int
