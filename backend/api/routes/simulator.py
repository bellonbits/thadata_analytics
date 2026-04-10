import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from api.models_db import Scenario as DBScenario
from api.models import ScenarioCreate, ScenarioResponse

router = APIRouter(prefix="/simulator", tags=["Simulator"])

@router.get("/scenarios", response_model=List[ScenarioResponse])
def get_scenarios(db: Session = Depends(get_db)):
    return db.query(DBScenario).all()

@router.post("/scenarios", response_model=ScenarioResponse)
def create_scenario(scenario: ScenarioCreate, db: Session = Depends(get_db)):
    db_item = DBScenario(id=str(uuid.uuid4()), **scenario.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/scenarios/{scenario_id}")
def delete_scenario(scenario_id: str, db: Session = Depends(get_db)):
    db_item = db.query(DBScenario).filter(DBScenario.id == scenario_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Scenario not found")
    db.delete(db_item)
    db.commit()
    return {"deleted": True}
