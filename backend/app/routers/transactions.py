from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas
from ..database import get_db
from datetime import datetime

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

@router.get("/", response_model=list[schemas.TransactionResponse])
def get_transactions(
    month: str = Query(None, regex="^\d{4}-\d{2}$"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Transaction)
    if month:
        year, mon = map(int, month.split('-'))
        query = query.filter(
            func.extract('year', models.Transaction.date) == year,
            func.extract('month', models.Transaction.date) == mon
        )
    return query.order_by(models.Transaction.date.desc()).all()

@router.post("/", response_model=schemas.TransactionResponse)
def create_transaction(trans: schemas.TransactionCreate, db: Session = Depends(get_db)):
    db_trans = models.Transaction(**trans.model_dump())
    db.add(db_trans)
    db.commit()
    db.refresh(db_trans)
    return db_trans

@router.put("/{trans_id}", response_model=schemas.TransactionResponse)
def update_transaction(trans_id: int, trans: schemas.TransactionUpdate, db: Session = Depends(get_db)):
    db_trans = db.query(models.Transaction).filter(models.Transaction.id == trans_id).first()
    if not db_trans:
        raise HTTPException(status_code=404, detail="记录不存在")
    for key, value in trans.model_dump(exclude_unset=True).items():
        setattr(db_trans, key, value)
    db.commit()
    db.refresh(db_trans)
    return db_trans

@router.delete("/{trans_id}")
def delete_transaction(trans_id: int, db: Session = Depends(get_db)):
    db_trans = db.query(models.Transaction).filter(models.Transaction.id == trans_id).first()
    if not db_trans:
        raise HTTPException(status_code=404, detail="记录不存在")
    db.delete(db_trans)
    db.commit()
    return {"message": "删除成功"}