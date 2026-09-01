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
    store_name: str
    patients: list[InvoicePatientResponse]
    total: int


class InvoiceUpdate(BaseModel):
    store_name: str = Field(min_length=1, max_length=100)


class PatientAddRequest(BaseModel):
    patient_id: int
