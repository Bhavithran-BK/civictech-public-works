from datetime import date, datetime
from typing import Any, List, Optional
import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from geoalchemy2 import Geometry


class Base(DeclarativeBase):
    pass


class DepartmentModel(Base):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    users: Mapped[List["UserModel"]] = relationship("UserModel", back_populates="department")
    projects: Mapped[List["ProjectModel"]] = relationship("ProjectModel", back_populates="department")


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    department_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="officer")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    department: Mapped[Optional[DepartmentModel]] = relationship("DepartmentModel", back_populates="users")


class ProjectModel(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    department_id: Mapped[str] = mapped_column(String(36), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    contractor: Mapped[str] = mapped_column(String(255), nullable=False)
    budget: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    original_end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="planned")
    health_score: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    location_name: Mapped[str] = mapped_column(String(255), nullable=False)
    ward: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # PostGIS Spatial Geometries
    # LineString for project trench/road corridor, Point for centroid
    geom = Column(Geometry(geometry_type="LINESTRING", srid=4326), nullable=True)
    centroid = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)

    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="check_dates"),
        CheckConstraint("health_score >= 0 AND health_score <= 100", name="check_health_score"),
        Index("idx_projects_department", "department_id"),
        Index("idx_projects_status", "status"),
        Index("idx_projects_dates", "start_date", "end_date"),
    )

    # Relationships
    department: Mapped[DepartmentModel] = relationship("DepartmentModel", back_populates="projects")
    updates: Mapped[List["ProjectUpdateModel"]] = relationship("ProjectUpdateModel", back_populates="project", cascade="all, delete-orphan")
    delays: Mapped[List["DelayModel"]] = relationship("DelayModel", back_populates="project", cascade="all, delete-orphan")
    reports: Mapped[List["ReportModel"]] = relationship("ReportModel", back_populates="project", cascade="all, delete-orphan")
    subscriptions: Mapped[List["SubscriptionModel"]] = relationship("SubscriptionModel", back_populates="project", cascade="all, delete-orphan")


class ProjectUpdateModel(Base):
    __tablename__ = "project_updates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    author_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project: Mapped[ProjectModel] = relationship("ProjectModel", back_populates="updates")


class DelayModel(Base):
    __tablename__ = "delays"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    old_end_date: Mapped[date] = mapped_column(Date, nullable=False)
    new_end_date: Mapped[date] = mapped_column(Date, nullable=False)
    logged_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("new_end_date > old_end_date", name="check_delay_dates"),
        Index("idx_delays_project", "project_id"),
    )

    # Relationships
    project: Mapped[ProjectModel] = relationship("ProjectModel", back_populates="delays")


class ReportModel(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    kind: Mapped[str] = mapped_column(String(50), nullable=False)
    photo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_hash: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    distance_m: Mapped[float] = mapped_column(Float, nullable=False)
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reporter_contact: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_reports_project", "project_id"),
        Index("idx_reports_kind", "kind"),
        Index("idx_reports_created", "created_at"),
    )

    # Relationships
    project: Mapped[ProjectModel] = relationship("ProjectModel", back_populates="reports")


class SubscriptionModel(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_subscriptions_project", "project_id"),
    )

    # Relationships
    project: Mapped[ProjectModel] = relationship("ProjectModel", back_populates="subscriptions")
