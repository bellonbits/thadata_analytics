from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from core.database import Base

class TeamMember(Base):
    __tablename__ = "team_members"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    role = Column(String)
    status = Column(String)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active = Column(String, nullable=True)
    initials = Column(String)
    color = Column(String)


class AlertItem(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    severity = Column(String)
    status = Column(String)
    metric = Column(String)
    threshold = Column(Float)
    current_value = Column(Float)
    dataset_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)


class Integration(Base):
    __tablename__ = "integrations"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    category = Column(String)
    status = Column(String)
    icon = Column(String)      # We'll map string keys to lucide icons in frontend
    color = Column(String)
    last_sync = Column(String, nullable=True)


class Scenario(Base):
    __tablename__ = "scenarios"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    variable = Column(String)
    change = Column(Float)
    unit = Column(String)


class SavedAnalysis(Base):
    __tablename__ = "analyses"
    id = Column(String, primary_key=True, index=True)
    headline = Column(String)
    mode = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    rows_analyzed = Column(Integer)
    confidence = Column(Float)
    data = Column(JSON)  # The full AnalyzeResponse payload

