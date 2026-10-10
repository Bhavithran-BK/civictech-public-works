from datetime import date, datetime, timezone
import uuid
import pytest
from sqlalchemy import UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from geoalchemy2 import Geometry

from app.models import (
    Base,
    DepartmentModel,
    UserModel,
    ProjectModel,
    ProjectUpdateModel,
    DelayModel,
    ReportModel,
    SubscriptionModel,
)
from app.schemas import Department, User, Project


def test_table_names_and_primary_keys():
    """Verify all 7 models map to the exact table names and have UUID primary keys."""
    models = [
        (DepartmentModel, "departments"),
        (UserModel, "users"),
        (ProjectModel, "projects"),
        (ProjectUpdateModel, "project_updates"),
        (DelayModel, "delays"),
        (ReportModel, "reports"),
        (SubscriptionModel, "subscriptions"),
    ]
    for model_cls, expected_table in models:
        table = model_cls.__table__
        assert table.name == expected_table
        pk_cols = list(table.primary_key.columns)
        assert len(pk_cols) == 1
        pk_col = pk_cols[0]
        assert pk_col.name == "id"
        assert isinstance(pk_col.type, PG_UUID)
        assert pk_col.type.as_uuid is False


def test_foreign_key_column_types_are_uuid():
    """Verify all foreign key columns across models use PostgreSQL UUID type."""
    fk_checks = [
        (UserModel, "department_id"),
        (ProjectModel, "department_id"),
        (ProjectUpdateModel, "project_id"),
        (ProjectUpdateModel, "author_id"),
        (DelayModel, "project_id"),
        (DelayModel, "logged_by"),
        (ReportModel, "project_id"),
        (SubscriptionModel, "project_id"),
    ]
    for model_cls, col_name in fk_checks:
        col = model_cls.__table__.c[col_name]
        assert isinstance(col.type, PG_UUID), f"{model_cls.__name__}.{col_name} is not PG_UUID"
        assert col.type.as_uuid is False
        assert len(col.foreign_keys) > 0, f"{model_cls.__name__}.{col_name} missing foreign key reference"


def test_project_postgis_geometry_columns():
    """Requirement 4: Verify PostGIS geometry column declarations match schema.sql NOT NULL."""
    table = ProjectModel.__table__

    geom_col = table.c.geom
    assert isinstance(geom_col.type, Geometry)
    assert geom_col.type.geometry_type == "LINESTRING"
    assert geom_col.type.srid == 4326
    assert geom_col.nullable is False

    centroid_col = table.c.centroid
    assert isinstance(centroid_col.type, Geometry)
    assert centroid_col.type.geometry_type == "POINT"
    assert centroid_col.type.srid == 4326
    assert centroid_col.nullable is False


def test_subscription_uniqueness_constraint():
    """Requirement 3: Verify SubscriptionModel has UniqueConstraint on (project_id, email)."""
    table = SubscriptionModel.__table__
    unique_constraints = [c for c in table.constraints if isinstance(c, UniqueConstraint)]
    matching = [
        c for c in unique_constraints
        if {col.name for col in c.columns} == {"project_id", "email"}
    ]
    assert len(matching) == 1, "Missing UNIQUE(project_id, email) constraint on subscriptions"


def test_check_constraints_declared():
    """Verify schema check constraints are present on ProjectModel and DelayModel."""
    proj_table = ProjectModel.__table__
    proj_checks = [c.name for c in proj_table.constraints if isinstance(c, CheckConstraint)]
    assert "check_dates" in proj_checks
    assert "check_health_score" in proj_checks

    delay_table = DelayModel.__table__
    delay_checks = [c.name for c in delay_table.constraints if isinstance(c, CheckConstraint)]
    assert "check_delay_dates" in delay_checks
    assert "check_delay_reason_non_empty" in delay_checks


def test_model_instantiation_with_string_uuids():
    """Requirement 2: Verify string UUIDs can instantiate models smoothly without type errors."""
    dept_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    proj_id = str(uuid.uuid4())
    upd_id = str(uuid.uuid4())
    del_id = str(uuid.uuid4())
    rep_id = str(uuid.uuid4())
    sub_id = str(uuid.uuid4())

    dept = DepartmentModel(
        id=dept_id,
        name="Greater Chennai Corporation - Roads & Bridges",
        code="GCC-ROADS",
        type="Roads & Bridges",
        contact_email="roads@gcc.gov.in",
    )
    assert dept.id == dept_id

    user = UserModel(
        id=user_id,
        email="officer@gcc.gov.in",
        full_name="K. Rajesh",
        department_id=dept_id,
        role="officer",
    )
    assert user.id == user_id
    assert user.department_id == dept_id

    project = ProjectModel(
        id=proj_id,
        title="Anna Salai Road Resurfacing",
        purpose="Road resurfacing and paving",
        type="road",
        department_id=dept_id,
        contractor="Tamil Nadu Highways Ltd.",
        budget=4500000.0,
        start_date=date(2026, 11, 1),
        end_date=date(2026, 12, 15),
        original_end_date=date(2026, 12, 15),
        status="planned",
        health_score=100,
        location_name="Anna Salai, Chennai",
        ward="Ward 114",
    )
    assert project.id == proj_id
    assert project.department_id == dept_id

    update = ProjectUpdateModel(
        id=upd_id,
        project_id=proj_id,
        author_id=user_id,
        note="Initial milling completed.",
    )
    assert update.id == upd_id
    assert update.project_id == proj_id

    delay = DelayModel(
        id=del_id,
        project_id=proj_id,
        reason="Utility line clash detected",
        old_end_date=date(2026, 12, 15),
        new_end_date=date(2026, 12, 30),
        logged_by=user_id,
    )
    assert delay.id == del_id
    assert delay.logged_by == user_id

    report = ReportModel(
        id=rep_id,
        project_id=proj_id,
        kind="progress_verified",
        lat=13.04,
        lng=80.25,
        distance_m=12.5,
        verified=True,
    )
    assert report.id == rep_id

    sub = SubscriptionModel(
        id=sub_id,
        project_id=proj_id,
        email="citizen@chennai.in",
    )
    assert sub.id == sub_id
    assert sub.project_id == proj_id


def test_pydantic_schema_compatibility_with_model_dict():
    """Verify model attribute representations map directly into Pydantic response schemas."""
    dept_id = str(uuid.uuid4())
    dept = DepartmentModel(
        id=dept_id,
        name="Chennai Metro Water",
        code="CMWSSB",
        type="Water Supply & Sewerage",
        contact_email="water@cmwssb.tn.gov.in",
    )
    # Parse into Department Pydantic schema
    pydantic_dept = Department(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        type=dept.type,
        contact_email=dept.contact_email,
    )
    assert pydantic_dept.id == dept_id
    assert pydantic_dept.code == "CMWSSB"

    user_id = str(uuid.uuid4())
    user = UserModel(
        id=user_id,
        email="commissioner@cityworks.gov",
        full_name="Municipal Commissioner",
        department_id=dept_id,
        role="admin",
    )
    pydantic_user = User(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        department_id=user.department_id,
        department_name="Chennai Metro Water",
    )
    assert pydantic_user.id == user_id
    assert pydantic_user.role == "admin"
