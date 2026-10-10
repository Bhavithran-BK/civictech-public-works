from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple


def calculate_health_score(
    project: Dict[str, Any],
    current_date: Optional[date] = None,
) -> Tuple[int, Dict[str, Any]]:
    """
    Deterministic, auditable calculation of Project Health Score.

    Scoring Model:
    Base: 100
    - Slippage Penalty: -3 points per day past planned deadline (capped at 40 pts)
    - Stale Updates: -2 points per day if no official update in >14 days (capped at 25 pts)
    - Formal Delays: -15 points per recorded delay justification
    - Verified Citizen Reports:
        * 'no_activity': -18 points
        * 'safety_hazard': -15 points
        * 'poor_quality': -10 points
        * 'progress_verified': +5 points (boost)
    Clamp: 0 to 100

    Stalled Rule:
    Project is flagged as 'stalled' if health_score < 35 OR verified 'no_activity' reports >= 3.
    """
    today = current_date or date.today()
    score = 100
    penalties: Dict[str, str] = {}
    bonuses: Dict[str, str] = {}

    status = project.get("status", "planned")
    is_completed = status == "completed"

    # 1. Schedule Slippage (only for incomplete projects)
    end_date_val = project.get("end_date") or project.get("plannedEndDate")
    slippage_days = 0
    if end_date_val and not is_completed:
        try:
            if isinstance(end_date_val, str):
                target_date = datetime.strptime(end_date_val[:10], "%Y-%m-%d").date()
            elif isinstance(end_date_val, date):
                target_date = end_date_val
            else:
                target_date = None

            if target_date and today > target_date:
                slippage_days = (today - target_date).days
                slip_penalty = min(40, slippage_days * 3)
                score -= slip_penalty
                penalties["schedule_slippage"] = (
                    f"-{slip_penalty} pts ({slippage_days} days overdue past planned completion)"
                )
        except Exception:
            pass

    # 2. Stale Update Cadence
    days_stale = project.get("last_official_update_days_ago") or project.get("lastOfficialUpdateDaysAgo")
    if days_stale is None:
        # Calculate from updates history if available
        updates = project.get("updates", [])
        if updates:
            try:
                latest_update = updates[0].get("created_at") or updates[0].get("createdAt")
                if latest_update:
                    update_date = datetime.strptime(latest_update[:10], "%Y-%m-%d").date()
                    days_stale = max(0, (today - update_date).days)
            except Exception:
                days_stale = 0
        else:
            # If no updates, check start date
            start_date_val = project.get("start_date") or project.get("startDate")
            if start_date_val:
                try:
                    start_dt = datetime.strptime(start_date_val[:10], "%Y-%m-%d").date()
                    if today > start_dt:
                        days_stale = max(0, (today - start_dt).days)
                    else:
                        days_stale = 0
                except Exception:
                    days_stale = 0
            else:
                days_stale = 0

    if days_stale and days_stale > 14 and not is_completed:
        stale_days_over = days_stale - 14
        stale_penalty = min(25, stale_days_over * 2)
        score -= stale_penalty
        penalties["stale_cadence"] = (
            f"-{stale_penalty} pts ({days_stale} days without official engineering progress log)"
        )

    # 3. Logged Delays Penalty
    delays = project.get("delays", [])
    delays_count = len(delays)
    if delays_count > 0:
        delay_penalty = delays_count * 15
        score -= delay_penalty
        penalties["logged_delays"] = f"-{delay_penalty} pts ({delays_count} formal delay extension logs)"

    # 4. Verified Citizen Reports Feedback
    reports = project.get("reports") or project.get("citizenReports") or []
    verified_reports = [r for r in reports if r.get("verified", False)]

    no_activity_count = 0
    citizen_penalties = 0
    citizen_bonuses = 0

    for rep in verified_reports:
        kind = rep.get("kind")
        if kind == "no_activity":
            citizen_penalties += 18
            no_activity_count += 1
        elif kind == "safety_hazard":
            citizen_penalties += 15
        elif kind == "poor_quality":
            citizen_penalties += 10
        elif kind == "progress_verified":
            citizen_bonuses += 5

    if citizen_penalties > 0:
        score -= citizen_penalties
        penalties["citizen_audit_penalties"] = (
            f"-{citizen_penalties} pts from verified field inspection check-ins"
        )

    if citizen_bonuses > 0:
        score = min(100, score + citizen_bonuses)
        bonuses["citizen_verified_progress"] = f"+{citizen_bonuses} pts from verified active work check-ins"

    # Completed projects retain minimum 80 score unless severe delay history
    if is_completed:
        score = max(70, score)

    # Clamp between 0 and 100
    final_score = max(0, min(100, score))

    auto_flag_stalled = (not is_completed) and (final_score < 35 or no_activity_count >= 3)

    # Status derivation recommendation
    if is_completed:
        derived_status = "completed"
    elif auto_flag_stalled:
        derived_status = "stalled"
    elif delays_count > 0 or slippage_days > 0 or final_score < 50:
        derived_status = "delayed"
    elif final_score < 70:
        derived_status = "at_risk"
    else:
        derived_status = "on_track"

    breakdown = {
        "final_score": final_score,
        "penalties": penalties,
        "bonuses": bonuses,
        "verified_reports_count": len(verified_reports),
        "no_activity_count": no_activity_count,
        "auto_flag_stalled": auto_flag_stalled,
        "derived_status": derived_status,
        "slippage_days": slippage_days,
        "days_stale": days_stale or 0,
    }

    return final_score, breakdown
