-- DigOnce Database Schema (PostgreSQL + PostGIS)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(100) NOT NULL, -- e.g. 'Roads & Bridges', 'Water Supply & Sewerage', 'Electricity Board', 'Stormwater Drains'
    contact_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users (Synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, -- matches auth.users.id
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'officer', -- 'public', 'officer', 'admin'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'road', 'drain', 'pipeline', 'electrical', 'telecom'
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    contractor VARCHAR(255) NOT NULL,
    budget NUMERIC(15, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    original_end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'planned', -- 'on_track', 'at_risk', 'delayed', 'planned', 'completed', 'stalled'
    health_score INTEGER NOT NULL DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
    geom geometry(LineString, 4326) NOT NULL,
    centroid geometry(Point, 4326) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    ward VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_projects_geom ON projects USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_projects_centroid ON projects USING GIST (centroid);
CREATE INDEX IF NOT EXISTS idx_projects_department ON projects(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);

-- 4. Project Updates
CREATE TABLE IF NOT EXISTS project_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_updates_project ON project_updates(project_id);

-- 5. Delay Log (Reason mandatory)
CREATE TABLE IF NOT EXISTS delays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
    old_end_date DATE NOT NULL,
    new_end_date DATE NOT NULL,
    logged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_delay_dates CHECK (new_end_date > old_end_date)
);

CREATE INDEX IF NOT EXISTS idx_delays_project ON delays(project_id);

-- 6. Citizen Reports / Verification
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    kind VARCHAR(50) NOT NULL, -- 'progress_verified', 'no_activity', 'safety_hazard'
    photo_url TEXT,
    photo_hash VARCHAR(128),
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    distance_m DOUBLE PRECISION NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    reporter_contact VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_project ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_kind ON reports(kind);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);

-- 7. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, email)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_project ON subscriptions(project_id);
