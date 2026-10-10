import json
import os
from pathlib import Path
import psycopg2
from dotenv import load_dotenv

load_dotenv()
load_dotenv("backend/.env")

DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")
MOCK_DATA_PATH = Path("docs/mock-data.json")

def seed():
    print("Reading docs/mock-data.json...")
    with open(MOCK_DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    print("Seeding departments...")
    for dept in data["departments"]:
        cur.execute("""
            INSERT INTO departments (id, name, code, type, contact_email)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                code = EXCLUDED.code,
                type = EXCLUDED.type,
                contact_email = EXCLUDED.contact_email;
        """, (dept["id"], dept["name"], dept["code"], dept["type"], dept.get("contact_email")))
    print(f"Seeded {len(data['departments'])} departments.")

    print("Seeding demo users...")
    for user in data["users"]:
        cur.execute("""
            INSERT INTO users (id, email, full_name, department_id, role)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                department_id = EXCLUDED.department_id,
                role = EXCLUDED.role;
        """, (user["id"], user["email"], user["full_name"], user["department_id"], user["role"]))
    print(f"Seeded {len(data['users'])} users.")

    print("Seeding projects with PostGIS geometries...")
    count = 0
    for proj in data["projects"]:
        coords = proj["coordinates"]
        # Format LineString: LINESTRING(lng1 lat1, lng2 lat2, ...)
        coords_str = ", ".join(f"{pt[0]} {pt[1]}" for pt in coords)
        linestring_wkt = f"LINESTRING({coords_str})"

        cur.execute("""
            INSERT INTO projects (
                id, title, purpose, type, department_id, contractor, budget,
                start_date, end_date, original_end_date, status, health_score,
                geom, centroid, location_name, ward
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                ST_GeomFromText(%s, 4326),
                ST_Centroid(ST_GeomFromText(%s, 4326)),
                %s, %s
            )
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                purpose = EXCLUDED.purpose,
                type = EXCLUDED.type,
                department_id = EXCLUDED.department_id,
                contractor = EXCLUDED.contractor,
                budget = EXCLUDED.budget,
                start_date = EXCLUDED.start_date,
                end_date = EXCLUDED.end_date,
                original_end_date = EXCLUDED.original_end_date,
                status = EXCLUDED.status,
                health_score = EXCLUDED.health_score,
                geom = EXCLUDED.geom,
                centroid = EXCLUDED.centroid,
                location_name = EXCLUDED.location_name,
                ward = EXCLUDED.ward;
        """, (
            proj["id"], proj["title"], proj["purpose"], proj["type"],
            proj["department_id"], proj["contractor"], proj["budget"],
            proj["start_date"], proj["end_date"], proj.get("original_end_date", proj["end_date"]),
            proj["status"], proj["health_score"],
            linestring_wkt, linestring_wkt,
            proj["location_name"], proj.get("ward")
        ))
        count += 1

    conn.commit()
    print(f"Successfully seeded {count} projects into Supabase PostGIS!")

    # Verify counts
    cur.execute("SELECT count(*) FROM projects;")
    print("Total projects in database:", cur.fetchone()[0])
    cur.execute("SELECT count(*) FROM departments;")
    print("Total departments in database:", cur.fetchone()[0])
    cur.execute("SELECT count(*) FROM users;")
    print("Total users in database:", cur.fetchone()[0])

    cur.close()
    conn.close()

if __name__ == "__main__":
    seed()
