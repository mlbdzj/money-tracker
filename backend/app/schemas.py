from pydantic import BaseModel
from datetime import date as DateType
from typing import Optional

class TransactionCreate(BaseModel):
    type: str
    amount: float
    category: str
    date: DateType
    note: Optional[str] = ""

class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[DateType] = None
    note: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    type: str
    amount: float
    category: str
    date: DateType
    note: str

    class Config:
        from_attributes = True