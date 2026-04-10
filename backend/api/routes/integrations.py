from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from core.database import get_db
from api.models_db import Integration as DBIntegration
from api.models import IntegrationResponse, IntegrationUpdate

router = APIRouter(prefix="/integrations", tags=["Integrations"])

@router.get("", response_model=List[IntegrationResponse])
def get_integrations(db: Session = Depends(get_db)):
    items = db.query(DBIntegration).all()
    return items

@router.put("/{integration_id}", response_model=IntegrationResponse)
def update_integration(integration_id: str, update_data: IntegrationUpdate, db: Session = Depends(get_db)):
    db_item = db.query(DBIntegration).filter(DBIntegration.id == integration_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    db_item.status = update_data.status
    if update_data.status == "connected":
        db_item.last_sync = "Just now"
    else:
        db_item.last_sync = None
        
    db.commit()
    db.refresh(db_item)
    return db_item
