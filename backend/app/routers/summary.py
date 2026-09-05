from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models
from ..database import get_db

router = APIRouter(prefix="/api/summary", tags=["summary"])

@router.get("/")
def get_summary(
    month: str = Query(..., regex="^\d{4}-\d{2}$"),
    db: Session = Depends(get_db)
):
    year, mon = map(int, month.split('-'))
    total_income = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == "income",
        func.extract('year', models.Transaction.date) == year,
        func.extract('month', models.Transaction.date) == mon
    ).scalar() or 0.0

    total_expense = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.type == "expense",
        func.extract('year', models.Transaction.date) == year,
        func.extract('month', models.Transaction.date) == mon
    ).scalar() or 0.0

    category_stats = db.query(
        models.Transaction.category,
        func.sum(models.Transaction.amount).label('total')
    ).filter(
        models.Transaction.type == "expense",
        func.extract('year', models.Transaction.date) == year,
        func.extract('month', models.Transaction.date) == mon
    ).group_by(models.Transaction.category).all()

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "expense_by_category": {cat: float(amt) for cat, amt in category_stats}
    }