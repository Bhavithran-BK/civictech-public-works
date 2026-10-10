import psycopg2
from pathlib import Path

DB_URL = "postgresql://postgres.spjprbkebzbbtzpowwiw:Guru2006Muthu@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

def main():
    print("Connecting to Supabase PostgreSQL...")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    schema_path = Path("docs/schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        sql = f.read()
        
    print("Applying schema.sql...")
    cur.execute(sql)
    conn.commit()
    print("Schema applied successfully!")
    
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    tables = [r[0] for r in cur.fetchall()]
    print("Public tables created:", tables)
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
