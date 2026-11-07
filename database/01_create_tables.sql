-- ==========================================
-- ARAD QUEST
-- Database schema creation
-- PostgreSQL 17 + PostGIS
-- ==========================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Clasele de jucatori
CREATE TABLE clase_jucatori (
    class_id SERIAL PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- 2. Jucatori
CREATE TABLE jucatori (
    player_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    total_points INTEGER NOT NULL DEFAULT 0
        CHECK (total_points >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    avatar_id INTEGER NOT NULL
        CHECK (avatar_id BETWEEN 1 AND 4)
);

-- 3. Obiective turistice
CREATE TABLE obiective_turistice (
    objective_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    address TEXT,
    image_url TEXT,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 50
        CHECK (radius_meters > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Spatial index for location-based searches
CREATE INDEX idx_obiective_turistice_location
ON obiective_turistice USING GIST (location);

-- 4. Trasee tematice
CREATE TABLE trasee_tematice (
    route_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'easy'
        CHECK (difficulty IN ('easy', 'medium', 'hard')),
    estimated_minutes INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 5. Obiectivele incluse in trasee
CREATE TABLE ordine_obiective_traseu (
    route_id INTEGER NOT NULL
        REFERENCES trasee_tematice(route_id)
        ON DELETE CASCADE,
    objective_id INTEGER NOT NULL
        REFERENCES obiective_turistice(objective_id),
    sequence_number INTEGER NOT NULL,
    PRIMARY KEY (route_id, objective_id),
    UNIQUE (route_id, sequence_number)
);

-- 6. Misiuni
CREATE TABLE misiuni (
    mission_id SERIAL PRIMARY KEY,
    objective_id INTEGER NOT NULL
        REFERENCES obiective_turistice(objective_id),
    title VARCHAR(150) NOT NULL,
    description TEXT,
    points_reward INTEGER NOT NULL DEFAULT 40
        CHECK (points_reward >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 7. Indicii
CREATE TABLE indicii (
    clue_id SERIAL PRIMARY KEY,
    mission_id INTEGER NOT NULL
        REFERENCES misiuni(mission_id)
        ON DELETE CASCADE,
    clue_text TEXT NOT NULL,
    clue_order INTEGER NOT NULL DEFAULT 1,
    UNIQUE (mission_id, clue_order)
);

-- 8. Raspunsuri corecte acceptate
CREATE TABLE raspunsuri_corecte (
    solution_id SERIAL PRIMARY KEY,
    mission_id INTEGER NOT NULL
        REFERENCES misiuni(mission_id)
        ON DELETE CASCADE,
    accepted_answer VARCHAR(500) NOT NULL
);

-- 9. Progresul jucatorilor pe trasee
CREATE TABLE progres_jucatori_trasee (
    player_id INTEGER NOT NULL
        REFERENCES jucatori(player_id)
        ON DELETE CASCADE,
    route_id INTEGER NOT NULL
        REFERENCES trasee_tematice(route_id)
        ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed')),
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    PRIMARY KEY (player_id, route_id)
);

-- 10. Progresul jucatorilor pe misiuni
CREATE TABLE progres_jucatori_misiuni (
    player_id INTEGER NOT NULL
        REFERENCES jucatori(player_id)
        ON DELETE CASCADE,
    mission_id INTEGER NOT NULL
        REFERENCES misiuni(mission_id)
        ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed')),
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    points_awarded INTEGER NOT NULL DEFAULT 0
        CHECK (points_awarded >= 0),
    PRIMARY KEY (player_id, mission_id),
    CHECK (status <> 'completed' OR completed_at IS NOT NULL)
);

-- 11. Raspunsuri trimise de jucatori
CREATE TABLE raspunsuri_trimise (
    attempt_id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    mission_id INTEGER NOT NULL,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id, mission_id)
        REFERENCES progres_jucatori_misiuni(player_id, mission_id)
        ON DELETE CASCADE
);

-- 12. Insigne disponibile
CREATE TABLE insigne_disponibile (
    badge_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    points_required INTEGER NOT NULL DEFAULT 0
        CHECK (points_required >= 0)
);

-- 13. Insigne obtinute de jucatori
CREATE TABLE insigne_jucatori (
    player_id INTEGER NOT NULL
        REFERENCES jucatori(player_id)
        ON DELETE CASCADE,
    badge_id INTEGER NOT NULL
        REFERENCES insigne_disponibile(badge_id),
    earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id, badge_id)
);

-- 14. Recompense disponibile
CREATE TABLE recompense_disponibile (
    reward_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL
        CHECK (points_cost >= 0),
    quantity_available INTEGER
        CHECK (quantity_available IS NULL OR quantity_available >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 15. Recompense revendicate de jucatori
CREATE TABLE recompense_revendicate (
    claim_id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL
        REFERENCES jucatori(player_id),
    reward_id INTEGER NOT NULL
        REFERENCES recompense_disponibile(reward_id),
    points_spent INTEGER NOT NULL
        CHECK (points_spent >= 0),
    claimed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    qr_code VARCHAR(30) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'redeemed', 'expired')),
    redeemed_at TIMESTAMP
);

-- ==========================================
-- END OF DATABASE SCHEMA
-- ==========================================
