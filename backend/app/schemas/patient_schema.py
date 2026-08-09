from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PatientBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    affiliation: str | None = Field(default=None, max_length=200)
    memo: str | None = Field(default=None, max_length=2000)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("氏名を入力してください")
        return value

    @field_validator("affiliation", "memo")
    @classmethod
    def empty_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(PatientBase):
    pass


class PatientResponse(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
