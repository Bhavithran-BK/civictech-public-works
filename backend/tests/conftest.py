import pytest
from app.core.db import db
from app.services.notifications import notification_service


@pytest.fixture(autouse=True)
def reset_test_state():
    """Autouse fixture resetting database and notifications to ensure test isolation."""
    db.reset(force_mock=True)
    notification_service.clear_history()
    yield
    db.reset(force_mock=True)
    notification_service.clear_history()
