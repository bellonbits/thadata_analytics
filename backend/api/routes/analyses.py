from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import uuid

from core.database import get_db
from api.models_db import SavedAnalysis
from pydantic import BaseModel

router = APIRouter(prefix="/analyses", tags=["Analyses"])

class AnalysisCreate(BaseModel):
    headline: str
    mode: str
    rows_analyzed: int
    confidence: float
    data: Any

@router.get("")
def list_analyses(mode: Optional[str] = Query(None, description="Comma separated list of modes"), db: Session = Depends(get_db)):
    query = db.query(SavedAnalysis)
    if mode:
        modes = [m.strip() for m in mode.split(",")]
        query = query.filter(SavedAnalysis.mode.in_(modes))
    
    results = query.order_by(SavedAnalysis.created_at.desc()).limit(50).all()
    
    out = []
    for r in results:
        out.append({
            "id": r.id,
            "headline": r.headline,
            "mode": r.mode,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "rows_analyzed": r.rows_analyzed,
            "confidence": r.confidence,
            "data": r.data
        })
    return out

@router.post("")
def save_analysis(payload: AnalysisCreate, db: Session = Depends(get_db)):
    db_analysis = SavedAnalysis(
        id=str(uuid.uuid4())[:8],
        headline=payload.headline,
        mode=payload.mode,
        rows_analyzed=payload.rows_analyzed,
        confidence=payload.confidence,
        data=payload.data
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    return {
        "id": db_analysis.id,
        "headline": db_analysis.headline,
        "mode": db_analysis.mode,
        "created_at": db_analysis.created_at.isoformat() if db_analysis.created_at else None,
        "rows_analyzed": db_analysis.rows_analyzed,
        "confidence": db_analysis.confidence,
        "data": db_analysis.data
    }

@router.delete("/{analysis_id}")
def delete_analysis(analysis_id: str, db: Session = Depends(get_db)):
    db_analysis = db.query(SavedAnalysis).filter(SavedAnalysis.id == analysis_id).first()
    if not db_analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    db.delete(db_analysis)
    db.commit()
    return {"deleted": True}
