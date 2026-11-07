
-- ==========================================
-- ARAD QUEST
-- 03 - Test queries
-- PostgreSQL + PostGIS
-- ==========================================


-- 1. Afisarea profilurilor jucatorilor
-- Include informatiile contului, avatarul si punctajul.

SELECT
    player_id,
    username,
    email,
    avatar_id,
    total_points,
    created_at
FROM jucatori
ORDER BY username;


-- 2. Afisarea tuturor obiectivelor turistice
-- Include coordonatele GPS si raza de proximitate.

SELECT
    objective_id,
    name,
    description,
    address,
    image_url,
    ST_Y(location::geometry) AS latitude,
    ST_X(location::geometry) AS longitude,
    radius_meters,
    is_active
FROM obiective_turistice
ORDER BY objective_id;


-- 3. Afisarea traseelor si a obiectivelor
-- Obiectivele sunt afisate in ordinea definita in baza de date.

SELECT
    t.route_id,
    t.title AS route_name,
    t.difficulty,
    t.estimated_minutes,
    oot.sequence_number,
    ot.objective_id,
    ot.name AS objective_name,
    ot.radius_meters
FROM trasee_tematice t
JOIN ordine_obiective_traseu oot
    ON t.route_id = oot.route_id
JOIN obiective_turistice ot
    ON oot.objective_id = ot.objective_id
WHERE t.is_active = TRUE
ORDER BY t.route_id, oot.sequence_number;


-- 4. Afisarea misiunilor asociate obiectivelor

SELECT
    ot.name AS objective_name,
    m.mission_id,
    m.title AS mission_title,
    m.description,
    m.points_reward,
    m.is_active
FROM obiective_turistice ot
JOIN misiuni m
    ON ot.objective_id = m.objective_id
ORDER BY ot.name;


-- 5. Afisarea progresului unui jucator pe misiuni
-- Inlocuieste test_player cu numele jucatorului dorit.

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
WHERE j.username = 'test_player'
ORDER BY p.started_at;


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
WHERE j.username = 'test_player'
ORDER BY ij.earned_at DESC;


-- 8. Afisarea recompenselor disponibile

SELECT
    reward_id,
    name,
    description,
    points_cost,
    quantity_available,
    is_active
FROM recompense_disponibile
WHERE is_active = TRUE
  AND (quantity_available IS NULL OR quantity_available > 0)
ORDER BY points_cost;


-- 9. Clasamentul jucatorilor
-- Jucatorii sunt ordonati dupa punctajul acumulat.

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


-- 11. Afisarea traseelor si a numarului de obiective

SELECT
    t.route_id,
    t.title AS route_name,
    COUNT(oot.objective_id) AS total_objectives
FROM trasee_tematice t
LEFT JOIN ordine_obiective_traseu oot
    ON t.route_id = oot.route_id
GROUP BY t.route_id, t.title
ORDER BY t.route_id;


-- 12. Verificarea razei GPS pentru obiective

SELECT
    objective_id,
    name,
    radius_meters,
    ST_Y(location::geometry) AS latitude,
    ST_X(location::geometry) AS longitude
FROM obiective_turistice
ORDER BY name;


-- 13. Afisarea punctajului total posibil pentru fiecare traseu

SELECT
    t.route_id,
    t.title AS route_name,
    COUNT(m.mission_id) AS total_missions,
    SUM(m.points_reward) AS total_possible_points
FROM trasee_tematice t
JOIN ordine_obiective_traseu oot
    ON t.route_id = oot.route_id
JOIN misiuni m
    ON oot.objective_id = m.objective_id
GROUP BY t.route_id, t.title
ORDER BY t.route_id;


-- 14. Verificarea obiectivelor fara imagini asociate

SELECT
    objective_id,
    name,
    image_url
FROM obiective_turistice
WHERE image_url IS NULL
   OR TRIM(image_url) = ''
ORDER BY objective_id;


-- 15. Verificarea obiectivelor fara misiuni asociate

SELECT
    ot.objective_id,
    ot.name
FROM obiective_turistice ot
LEFT JOIN misiuni m
    ON ot.objective_id = m.objective_id
WHERE m.mission_id IS NULL
ORDER BY ot.objective_id;


-- ==========================================
-- SFARSITUL INTEROGARILOR DE TEST
-- ==========================================
