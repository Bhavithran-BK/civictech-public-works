from enum import Enum
from typing import Literal

# Canonical status values
ProjectStatus = Literal[
    "on_track",
    "at_risk",
    "delayed",
    "planned",
    "completed",
    "stalled",
]

# Canonical project types
ProjectType = Literal[
    "road",
    "drain",
    "pipeline",
    "electrical",
    "telecom",
]

# Report kinds
ReportKind = Literal[
    "progress_verified",
    "no_activity",
    "safety_hazard",
    "poor_quality",
]

# User roles
UserRole = Literal[
    "public",
    "officer",
    "admin",
]

# Conflict type
ConflictType = Literal[
    "schedule_overlap",
    "recently_dug",
    "spatial_temporal",
]


def normalize_project_type(val: str) -> str:
    """Normalize utility type aliases to canonical contract values."""
    mapping = {
        "drainage": "drain",
        "water_pipeline": "pipeline",
        "water": "pipeline",
        "sewer": "pipeline",
        "electricity": "electrical",
        "power": "electrical",
    }
    cleaned = val.lower().strip()
    return mapping.get(cleaned, cleaned)
