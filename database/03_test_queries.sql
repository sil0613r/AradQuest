
-- ==========================================
-- ARAD QUEST
-- 03 - Test queries
-- PostgreSQL + PostGIS
-- ==========================================


-- 1. Afisarea profilului unui jucator
-- Informatii despre cont, clasa si puncte.

SELECT
    j.player_id,
    j.username,
    j.email,
    c.class_name,
    j.total_points,
    j.created_at
FROM jucatori j
LEFT JOIN clase_jucatori c
    ON j.class_id = c.class_id;


-- 2. Afisarea tuturor obiectivelor turistice
-- Include si coordonatele GPS.

SELECT
    objective_id,
    name,
    description,
    address,
    ST_Y(location::geometry) AS latitude,
    ST_X(location::geometry) AS longitude,
    radius_meters
FROM obiective_turistice
WHERE is_active = TRUE;


-- 3. Afisarea traseelor si a obiectivelor
-- Obiectivele sunt afisate in ordinea traseului.

SELECT
    t.title AS route_name,
    t.difficulty,
    t.estimated_minutes,
    o.sequence_number,
    ot.name AS objective_name
FROM trasee_tematice t
JOIN ordine_obiective_traseu o
    ON t.route_id = o.route_id
JOIN obiective_turistice ot
    ON o.objective_id = ot.objective_id
WHERE t.is_active = TRUE
ORDER BY t.route_id, o.sequence_number;


-- 4. Afisarea misiunilor unui obiectiv turistic

SELECT
    ot.name AS objective_name,
    m.mission_id,
    m.title AS mission_title,
    m.description,
    m.points_reward
FROM obiective_turistice ot
JOIN misiuni m
    ON ot.objective_id = m.objective_id
WHERE m.is_active = TRUE
ORDER BY ot.name;


-- 5. Afisarea indiciilor unei misiuni

SELECT
    m.title AS mission_name,
    i.clue_order,
    i.clue_text
FROM misiuni m
JOIN indicii i
    ON m.mission_id = i.mission_id
ORDER BY m.mission_id, i.clue_order;


-- 6. Afisarea progresului unui jucator pe misiuni

SELECT
    j.username,
    m.title AS mission_name,
    p.status,
    p.points_awarded,
    p.started_at,
    p.completed_at
FROM progres_jucatori_misiuni p
JOIN jucatori j
    ON p.player_id = j.player_id
JOIN misiuni m
    ON p.mission_id = m.mission_id
WHERE j.username = 'test_player';


-- 7. Afisarea insignelor obtinute de un jucator

SELECT
    j.username,
    i.name AS badge_name,
    i.description,
    ij.earned_at
FROM insigne_jucatori ij
JOIN jucatori j
    ON ij.player_id = j.player_id
JOIN insigne_disponibile i
    ON ij.badge_id = i.badge_id
WHERE j.username = 'test_player';


-- 8. Afisarea recompenselor disponibile

SELECT
    reward_id,
    name,
    description,
    points_cost,
    quantity_available
FROM recompense_disponibile
WHERE is_active = TRUE
AND (quantity_available IS NULL OR quantity_available > 0);


-- 9. Clasamentul jucatorilor
-- Jucatorii sunt ordonati dupa punctaj.

SELECT
    ROW_NUMBER() OVER (
        ORDER BY total_points DESC, username ASC
    ) AS ranking_position,
    username,
    total_points
FROM jucatori
ORDER BY total_points DESC, username ASC;


-- 10. Afisarea raspunsurilor trimise de un jucator

SELECT
    j.username,
    m.title AS mission_name,
    r.answer_text,
    r.is_correct,
    r.submitted_at
FROM raspunsuri_trimise r
JOIN jucatori j
    ON r.player_id = j.player_id
JOIN misiuni m
    ON r.mission_id = m.mission_id
WHERE j.username = 'test_player'
ORDER BY r.submitted_at DESC;


-- ==========================================
-- SFARSITUL INTEROGARILOR DE TEST
-- ==========================================
