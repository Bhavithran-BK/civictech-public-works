import asyncio
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.core.db import db
from app.services.health_score import calculate_health_score

logger = logging.getLogger("scheduler")
scheduler = BackgroundScheduler(timezone="Asia/Kolkata")

def auto_recalculate_health_and_stall_jobs():
    """
    Person D Unique Feature: Background cron job executing every 30 minutes.
    Recalculates deterministic health scores and auto-flags stalled projects.
    """
    logger.info("Executing 30-minute Auto Health Score & Stall evaluation...")
    try:
        updated_count = 0
        stalled_count = 0
        for p in list(db.projects):
            if p.get("status") == "completed":
                continue

            old_score = p.get("health_score", 100)
            old_status = p.get("status", "planned")

            # Attach reports and delays
            p_id = p["id"]
            p["reports"] = db.reports.get(p_id, [])
            p["delays"] = db.delays.get(p_id, [])

            new_score, breakdown = calculate_health_score(p)
            new_status = breakdown["derived_status"]

            if new_score != old_score or new_status != old_status:
                p["health_score"] = new_score
                p["status"] = new_status
                updated_count += 1
                if new_status == "stalled" and old_status != "stalled":
                    stalled_count += 1
                    logger.warning(f"⚠️ Project {p_id} ('{p.get('title')}') auto-transitioned to STALLED!")

        if updated_count > 0:
            db._save_to_disk()
            logger.info(f"Health score job completed: {updated_count} projects updated, {stalled_count} newly stalled.")
    except Exception as e:
        logger.error(f"Error running auto health score job: {e}")

def start_scheduler():
    scheduler.add_job(
        auto_recalculate_health_and_stall_jobs,
        "interval",
        minutes=30,
        id="health_score_job",
        replace_existing=True
    )
    scheduler.start()
    logger.info("Auto Health Score Background Scheduler started successfully (every 30m).")
