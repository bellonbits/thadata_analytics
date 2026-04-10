import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from api.models_db import TeamMember as DBTeamMember
from api.models import TeamMemberCreate, TeamMemberUpdate, TeamMemberResponse

router = APIRouter(prefix="/team", tags=["Team"])

@router.get("", response_model=List[TeamMemberResponse])
def get_team(db: Session = Depends(get_db)):
    members = db.query(DBTeamMember).all()
    return members

@router.post("", response_model=TeamMemberResponse)
def create_team_member(member: TeamMemberCreate, db: Session = Depends(get_db)):
    db_item = DBTeamMember(id=str(uuid.uuid4()), **member.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{member_id}", response_model=TeamMemberResponse)
def update_team_role(member_id: str, update_data: TeamMemberUpdate, db: Session = Depends(get_db)):
    db_item = db.query(DBTeamMember).filter(DBTeamMember.id == member_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Member not found")
    db_item.role = update_data.role
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{member_id}")
def delete_team_member(member_id: str, db: Session = Depends(get_db)):
    db_item = db.query(DBTeamMember).filter(DBTeamMember.id == member_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(db_item)
    db.commit()
    return {"deleted": True, "id": member_id}
