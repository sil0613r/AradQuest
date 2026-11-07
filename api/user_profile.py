"""Profile page data, read from the database. A new player gets zeros and empty lists, nothing invented."""
from deps import iso_utc
from game import ADVENTURE_ROUTES

# Route title (trasee_tematice.title) -> frontend adventure ID ("nature" / "history").
ADVENTURE_BY_TITLE = {title: adventure for adventure, title in ADVENTURE_ROUTES.items()}


def profile_summary(conn, user_id: int, total_points: int) -> dict:
    counts = conn.execute(
        """
        SELECT
            (SELECT COUNT(*) FROM progres_jucatori_trasee WHERE player_id = %(player)s) AS adventures_started,
            (SELECT COUNT(*) FROM progres_jucatori_misiuni
                WHERE player_id = %(player)s AND status = 'completed') AS places_discovered,
            (SELECT COUNT(*) FROM insigne_jucatori WHERE player_id = %(player)s) AS badges_earned
        """,
        {"player": user_id},
    ).fetchone()

    history_rows = conn.execute(
        """
        SELECT p.route_id, t.title, p.status, p.started_at, p.completed_at,
            (SELECT COUNT(*) FROM ordine_obiective_traseu o
                JOIN misiuni m ON m.objective_id = o.objective_id
                JOIN progres_jucatori_misiuni pm
                    ON pm.mission_id = m.mission_id AND pm.player_id = p.player_id AND pm.status = 'completed'
                WHERE o.route_id = p.route_id) AS completed_locations,
            (SELECT COUNT(*) FROM ordine_obiective_traseu o WHERE o.route_id = p.route_id) AS total_locations
        FROM progres_jucatori_trasee p
        JOIN trasee_tematice t ON t.route_id = p.route_id
        WHERE p.player_id = %s
        ORDER BY p.started_at DESC
        """,
        (user_id,),
    ).fetchall()

    badge_rows = conn.execute(
        """
        SELECT b.name, b.description, i.earned_at
        FROM insigne_jucatori i
        JOIN insigne_disponibile b ON b.badge_id = i.badge_id
        WHERE i.player_id = %s
        ORDER BY i.earned_at DESC
        """,
        (user_id,),
    ).fetchall()

    return {
        "stats": {
            "totalPoints": total_points,
            "adventuresStarted": counts["adventures_started"],
            "placesDiscovered": counts["places_discovered"],
            "badgesEarned": counts["badges_earned"],
        },
        "adventureHistory": [
            {
                "routeId": row["route_id"],
                "adventure": ADVENTURE_BY_TITLE.get(row["title"]),
                "title": row["title"],
                "status": row["status"],
                "startedAt": iso_utc(row["started_at"]),
                "completedAt": iso_utc(row["completed_at"]),
                "completedLocations": row["completed_locations"],
                "totalLocations": row["total_locations"],
                "progressPercentage": round(100 * row["completed_locations"] / row["total_locations"])
                if row["total_locations"]
                else 0,
            }
            for row in history_rows
        ],
        "badges": [
            {"name": row["name"], "description": row["description"], "earnedAt": iso_utc(row["earned_at"])}
            for row in badge_rows
        ],
    }
