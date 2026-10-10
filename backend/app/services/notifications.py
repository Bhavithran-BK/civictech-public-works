from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr


class NotificationMessage(BaseModel):
    project_id: str
    recipient: str
    subject: str
    body: str
    event_type: str
    timestamp: str = ""


class NotificationDispatcher:
    """
    Service responsible for dispatching real-time email notifications to project subscribers.
    Decoupled from third-party transport providers (e.g. SMTP, Supabase Edge, Resend).
    """

    def __init__(self):
        self.sent_history: List[NotificationMessage] = []

    def dispatch_project_update(
        self,
        project_id: str,
        project_title: str,
        note: str,
        subscriber_emails: List[str],
    ) -> int:
        """Sends notification to subscribers when an official update is logged."""
        subject = f"[DigOnce Alert] Official Update on '{project_title}'"
        body = (
            f"An official municipal update was logged on project '{project_title}':\n\n"
            f"\"{note}\"\n\n"
            f"Track live project status: http://localhost:3000/projects/{project_id}"
        )
        return self._send_batch(project_id, subject, body, "project_update", subscriber_emails)

    def dispatch_delay_alert(
        self,
        project_id: str,
        project_title: str,
        reason: str,
        new_end_date: str,
        subscriber_emails: List[str],
    ) -> int:
        """Sends urgent notification when a formal delay notice is recorded."""
        subject = f"[DigOnce Alert] Schedule Extension on '{project_title}'"
        body = (
            f"A schedule delay has been recorded on project '{project_title}'.\n\n"
            f"Reason: {reason}\n"
            f"New Expected Completion: {new_end_date}\n\n"
            f"Track accountability dossier: http://localhost:3000/projects/{project_id}"
        )
        return self._send_batch(project_id, subject, body, "delay_alert", subscriber_emails)

    def _send_batch(
        self,
        project_id: str,
        subject: str,
        body: str,
        event_type: str,
        recipients: List[str],
    ) -> int:
        count = 0
        for email in recipients:
            msg = NotificationMessage(
                project_id=project_id,
                recipient=email,
                subject=subject,
                body=body,
                event_type=event_type,
                timestamp=datetime.now().isoformat(),
            )
            self.sent_history.append(msg)
            count += 1
        return count

    def get_history_for_project(self, project_id: str) -> List[NotificationMessage]:
        return [m for m in self.sent_history if m.project_id == project_id]

    def clear_history(self):
        self.sent_history.clear()


notification_service = NotificationDispatcher()
