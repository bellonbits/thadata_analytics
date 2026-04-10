import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from core.database import get_db
from api.models_db import AlertItem as DBAlert
from api.models import AlertCreate, AlertUpdate, AlertResponse

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(DBAlert).order_by(DBAlert.created_at.desc()).all()
    return alerts

@router.post("", response_model=AlertResponse)
def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    db_item = DBAlert(id=str(uuid.uuid4()), **alert.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{alert_id}/status", response_model=AlertResponse)
def update_alert_status(alert_id: str, update_data: AlertUpdate, db: Session = Depends(get_db)):
    db_item = db.query(DBAlert).filter(DBAlert.id == alert_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    db_item.status = update_data.status
    if update_data.status == "resolved":
        db_item.resolved_at = datetime.now(timezone.utc)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{alert_id}")
def delete_alert(alert_id: str, db: Session = Depends(get_db)):
    db_item = db.query(DBAlert).filter(DBAlert.id == alert_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(db_item)
    db.commit()
    return {"deleted": True}
