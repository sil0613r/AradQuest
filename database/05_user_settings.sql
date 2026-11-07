-- ==========================================
-- ARAD QUEST
-- Setarile jucatorilor (notificari din pagina Settings)
-- Ruleaza o singura data. Pe o baza noua este rulat automat de docker-compose.
-- ==========================================

CREATE TABLE IF NOT EXISTS setari_jucatori (
    player_id INTEGER PRIMARY KEY REFERENCES jucatori(player_id)
        ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
