import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr

from app.core.config import settings

logger = logging.getLogger("uvicorn")


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
    Supports in-memory tracking for tests and live delivery via Resend API when RESEND_API_KEY is configured.
    """

    def __init__(self):
        self.sent_history: List[NotificationMessage] = []

    def dispatch_subscription_confirmation(
        self,
        project_id: str,
        project_title: str,
        email: str,
    ) -> int:
        """Sends immediate confirmation to a resident who just subscribed to project updates."""
        subject = f"[DigOnce] Subscribed to updates: {project_title}"
        body = (
            f"Hello,\n\n"
            f"You have successfully subscribed to real-time civic updates for project '{project_title}'.\n\n"
            f"You will automatically receive an alert whenever an official engineering update "
            f"or schedule delay notice is logged by the department.\n\n"
            f"Track live project status and public check-ins: http://localhost:3000/projects/{project_id}\n\n"
            f"— Greater Chennai Public Works Coordination System"
        )
        return self._send_batch(project_id, subject, body, "subscription_confirmation", [email])

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
            logger.info(f"📧 [EMAIL DISPATCHED] To: {email} | Subject: '{subject}' | Project: {project_id}")

            # Send via Resend if API key is provided
            if settings.RESEND_API_KEY and settings.RESEND_API_KEY.strip():
                try:
                    import resend
                    resend.api_key = settings.RESEND_API_KEY.strip()
                    from_email = settings.RESEND_FROM_EMAIL.strip() or "onboarding@resend.dev"
                    
                    html_content = (
                        f"<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; "
                        f"max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;'>"
                        f"<div style='border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;'>"
                        f"<span style='font-size: 18px; font-weight: bold; color: #1e293b;'>DigOnce Coordination</span>"
                        f"</div>"
                        f"<h2 style='font-size: 16px; color: #0f172a; margin-top: 0;'>{subject}</h2>"
                        f"<p style='font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-wrap;'>{body}</p>"
                        f"<div style='margin-top: 24px; padding-top: 12px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;'>"
                        f"Automated notification from Greater Chennai Public Works Coordination System."
                        f"</div>"
                        f"</div>"
                    )

                    params: resend.Emails.SendParams = {
                        "from": from_email,
                        "to": [email],
                        "subject": subject,
                        "text": body,
                        "html": html_content,
                    }
                    res = resend.Emails.send(params)
                    email_id = getattr(res, "id", None) or (res.get("id") if isinstance(res, dict) else str(res))
                    logger.info(f"✅ [RESEND SENT] Successfully dispatched to {email} (ID: {email_id})")
                except Exception as exc:
                    logger.error(f"❌ [RESEND ERROR] Failed to send email to {email}: {exc}")

            count += 1
        return count

    def get_history_for_project(self, project_id: str) -> List[NotificationMessage]:
        return [m for m in self.sent_history if m.project_id == project_id]

    def clear_history(self):
        self.sent_history.clear()


notification_service = NotificationDispatcher()

