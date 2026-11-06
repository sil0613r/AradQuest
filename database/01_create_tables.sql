
-- ==========================================
-- ARAD QUEST
-- Crearea tabelelor pentru baza de date
-- PostgreSQL + PostGIS
-- ==========================================

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
    total_points INTEGER DEFAULT 0 CHECK (total_points >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    avatar_id INTEGER NOT NULL CHECK (avatar_id BETWEEN 1 AND 4)
);

-- 3. Obiective turistice
CREATE TABLE obiective_turistice (
    objective_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    address TEXT,
    image_url TEXT,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE
);

-- Index pentru cautarea obiectivelor dupa locatie
CREATE INDEX idx_obiective_turistice_location
ON obiective_turistice USING GIST (location);

-- 4. Trasee tematice
CREATE TABLE trasee_tematice (
    route_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) DEFAULT 'easy'
        CHECK (difficulty IN ('easy', 'medium', 'hard')),
    estimated_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE
);

-- 5. Obiectivele incluse in trasee
CREATE TABLE ordine_obiective_traseu (
    route_id INTEGER REFERENCES trasee_tematice(route_id)
        ON DELETE CASCADE,
    objective_id INTEGER REFERENCES obiective_turistice(objective_id),
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
    points_reward INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    CHECK (points_reward >= 0)
);

-- 7. Indicii
CREATE TABLE indicii (
    clue_id SERIAL PRIMARY KEY,
    mission_id INTEGER NOT NULL
        REFERENCES misiuni(mission_id) ON DELETE CASCADE,
    clue_text TEXT NOT NULL,
    clue_order INTEGER NOT NULL DEFAULT 1,
    UNIQUE (mission_id, clue_order)
);

-- 8. Raspunsuri corecte acceptate
CREATE TABLE raspunsuri_corecte (
    solution_id SERIAL PRIMARY KEY,
    mission_id INTEGER NOT NULL
        REFERENCES misiuni(mission_id) ON DELETE CASCADE,
    accepted_answer VARCHAR(500) NOT NULL
);

-- 9. Progresul jucatorilor pe trasee
CREATE TABLE progres_jucatori_trasee (
    player_id INTEGER REFERENCES jucatori(player_id)
        ON DELETE CASCADE,
    route_id INTEGER REFERENCES trasee_tematice(route_id)
        ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    PRIMARY KEY (player_id, route_id)
);

-- 10. Progresul jucatorilor pe misiuni
CREATE TABLE progres_jucatori_misiuni (
    player_id INTEGER REFERENCES jucatori(player_id)
        ON DELETE CASCADE,
    mission_id INTEGER REFERENCES misiuni(mission_id)
        ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    points_awarded INTEGER DEFAULT 0,
    PRIMARY KEY (player_id, mission_id),
    CHECK (points_awarded >= 0),
    CHECK (status <> 'completed' OR completed_at IS NOT NULL)
);

-- 11. Raspunsuri trimise de jucatori
CREATE TABLE raspunsuri_trimise (
    attempt_id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    mission_id INTEGER NOT NULL,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id, mission_id)
        REFERENCES progres_jucatori_misiuni(player_id, mission_id)
        ON DELETE CASCADE
);

-- 12. Insigne disponibile
CREATE TABLE insigne_disponibile (
    badge_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    points_required INTEGER DEFAULT 0
);

-- 13. Insigne obtinute de jucatori
CREATE TABLE insigne_jucatori (
    player_id INTEGER REFERENCES jucatori(player_id)
        ON DELETE CASCADE,
    badge_id INTEGER REFERENCES insigne_disponibile(badge_id),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id, badge_id)
);

-- 14. Recompense disponibile
CREATE TABLE recompense_disponibile (
    reward_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    quantity_available INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    CHECK (points_cost >= 0),
    CHECK (quantity_available IS NULL OR quantity_available >= 0)
);

-- 15. Recompense revendicate de jucatori
CREATE TABLE recompense_revendicate (
    claim_id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES jucatori(player_id),
    reward_id INTEGER NOT NULL REFERENCES recompense_disponibile(reward_id),
    points_spent INTEGER NOT NULL,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (points_spent >= 0)
);

-- ==========================================
-- SFARSITUL CREARII TABELELOR
-- ==========================================
