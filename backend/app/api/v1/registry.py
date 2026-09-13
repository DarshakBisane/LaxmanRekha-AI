from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import TrustedRegistryRecord, User
from app.api.deps import get_current_user
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/registry", tags=["Registry"])

class RegistryRecordResponse(BaseModel):
    synthetic_id: str
    name: str
    date_of_birth: str
    status: str
    address: Optional[str] = None
    disclaimer: str = "Synthetic demonstration dataset - not an official government database."

    class Config:
        from_attributes = True

@router.get("", response_model=List[RegistryRecordResponse], summary="List synthetic demonstration registry records")
def list_registry_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(TrustedRegistryRecord).all()
    return [RegistryRecordResponse.model_validate(r) for r in records]

@router.get("/{synthetic_id}", response_model=RegistryRecordResponse, summary="Look up synthetic record by identifier")
def get_registry_record(
    synthetic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(TrustedRegistryRecord).filter(
        TrustedRegistryRecord.synthetic_id == synthetic_id.upper().strip()
    ).first()
    if not record:
        raise NotFoundError(f"Synthetic identifier '{synthetic_id}' not found in demonstration registry.")
    return RegistryRecordResponse.model_validate(record)
