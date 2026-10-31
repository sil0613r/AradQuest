
-- ==========================================
-- ARAD QUEST
-- 02 - Initial data
-- PostgreSQL + PostGIS
-- ==========================================

-- 1. Clase de jucatori
INSERT INTO clase_jucatori (class_name, description)
VALUES
('Explorer', 'Descopera obiective turistice'),
('Adventurer', 'Exploreaza orasul si rezolva misiuni'),
('Champion', 'Participa la provocari si acumuleaza puncte'),
('Pathfinder', 'Descopera trasee noi');


-- 2. Jucator de test
-- ATENTIE:
-- Valoarea de mai jos este un hash DEMO, nu o parola reala.
-- In aplicatia finala, backend-ul Python va genera hash-ul
-- folosind Argon2id sau bcrypt.

INSERT INTO jucatori (username, email, password_hash, class_id)
VALUES (
    'test_player',
    'test@example.com',
    'DEMO_HASH_REPLACE_BEFORE_LOGIN',
    (SELECT class_id FROM clase_jucatori
     WHERE class_name = 'Explorer')
);


-- 3. Obiective turistice
-- Coordonatele sunt orientative si trebuie verificate
-- inainte de utilizarea reala a aplicatiei.

INSERT INTO obiective_turistice
(name, description, address, image_url, location, radius_meters)
VALUES
(
    'Primaria Arad',
    'Cladire administrativa reprezentativa a orasului.',
    'Bulevardul Revolutiei, Arad',
    NULL,
    ST_SetSRID(ST_MakePoint(21.3167, 46.1667), 4326)::geography,
    30
),
(
    'Teatrul Clasic Ioan Slavici',
    'Cladire culturala importanta din centrul orasului.',
    'Piata Avram Iancu, Arad',
    NULL,
    ST_SetSRID(ST_MakePoint(21.3160, 46.1675), 4326)::geography,
    30
),
(
    'Biserica Rosie',
    'Unul dintre obiectivele arhitecturale cunoscute ale orasului.',
    'Arad',
    NULL,
    ST_SetSRID(ST_MakePoint(21.3100, 46.1700), 4326)::geography,
    30
);


-- 4. Trasee tematice
INSERT INTO trasee_tematice
(title, description, difficulty, estimated_minutes)
VALUES
(
    'Descopera Aradul',
    'Un traseu prin cateva obiective importante ale orasului.',
    'easy',
    60
);


-- 5. Ordinea obiectivelor in traseu
INSERT INTO ordine_obiective_traseu
(route_id, objective_id, sequence_number)
VALUES
(
    (SELECT route_id FROM trasee_tematice
     WHERE title = 'Descopera Aradul'),
    (SELECT objective_id FROM obiective_turistice
     WHERE name = 'Primaria Arad'),
    1
),
(
    (SELECT route_id FROM trasee_tematice
     WHERE title = 'Descopera Aradul'),
    (SELECT objective_id FROM obiective_turistice
     WHERE name = 'Teatrul Clasic Ioan Slavici'),
    2
),
(
    (SELECT route_id FROM trasee_tematice
     WHERE title = 'Descopera Aradul'),
    (SELECT objective_id FROM obiective_turistice
     WHERE name = 'Biserica Rosie'),
    3
);


-- 6. Misiuni
INSERT INTO misiuni
(objective_id, title, description, points_reward)
VALUES
(
    (SELECT objective_id FROM obiective_turistice
     WHERE name = 'Primaria Arad'),
    'Descopera Primaria',
    'Gaseste informatia ascunsa in apropierea intrarii principale.',
    20
),
(
    (SELECT objective_id FROM obiective_turistice
     WHERE name = 'Teatrul Clasic Ioan Slavici'),
    'Descopera teatrul',
    'Raspunde la o intrebare despre istoria teatrului.',
    30
);


-- 7. Indicii
INSERT INTO indicii
(mission_id, clue_text, clue_order)
VALUES
(
    (SELECT mission_id FROM misiuni
     WHERE title = 'Descopera Primaria'),
    'Priveste cu atentie deasupra intrarii principale.',
    1
),
(
    (SELECT mission_id FROM misiuni
     WHERE title = 'Descopera Primaria'),
    'Cauta inscriptia de pe cladire.',
    2
),
(
    (SELECT mission_id FROM misiuni
     WHERE title = 'Descopera teatrul'),
    'Gandeste-te la personalitatile legate de teatrul din Arad.',
    1
);


-- 8. Raspunsuri corecte acceptate
-- Raspunsurile sunt exemple temporare.

INSERT INTO raspunsuri_corecte (mission_id, accepted_answer)
VALUES
(
    (SELECT mission_id FROM misiuni
     WHERE title = 'Descopera Primaria'),
    'exemplu'
),
(
    (SELECT mission_id FROM misiuni
     WHERE title = 'Descopera teatrul'),
    'exemplu'
);


-- 9. Progresul jucatorului pe traseu
INSERT INTO progres_jucatori_trasee
(player_id, route_id, status)
VALUES
(
    (SELECT player_id FROM jucatori
     WHERE username = 'test_player'),
    (SELECT route_id FROM trasee_tematice
     WHERE title = 'Descopera Aradul'),
    'in_progress'
);


-- 10. Progresul jucatorului pe misiuni
INSERT INTO progres_jucatori_misiuni
(player_id, mission_id, status)
VALUES
(
    (SELECT player_id FROM jucatori
     WHERE username = 'test_player'),
    (SELECT mission_id FROM misiuni
     WHERE title = 'Descopera Primaria'),
    'in_progress'
);


-- 11. Raspunsuri trimise de jucatori
INSERT INTO raspunsuri_trimise
(player_id, mission_id, answer_text, is_correct)
VALUES
(
    (SELECT player_id FROM jucatori
     WHERE username = 'test_player'),
    (SELECT mission_id FROM misiuni
     WHERE title = 'Descopera Primaria'),
    'exemplu',
    TRUE
);


-- 12. Insigne disponibile
INSERT INTO insigne_disponibile
(name, description, points_required)
VALUES
('Primul pas', 'Pentru prima misiune completata.', 20),
('Explorator', 'Pentru acumularea a 50 de puncte.', 50),
('Detectiv', 'Pentru rezolvarea mai multor indicii.', 100);


-- 13. Insigne obtinute de jucatori
INSERT INTO insigne_jucatori (player_id, badge_id)
VALUES
(
    (SELECT player_id FROM jucatori
     WHERE username = 'test_player'),
    (SELECT badge_id FROM insigne_disponibile
     WHERE name = 'Primul pas')
);


-- 14. Recompense disponibile
INSERT INTO recompense_disponibile
(name, description, points_cost, quantity_available)
VALUES
('Reducere simbolica', 'O reducere oferita ca recompensa.', 50, 10),
('Premiu special', 'Un premiu pentru jucatorii activi.', 100, 5);


-- 15. Recompense revendicate de jucatori
INSERT INTO recompense_revendicate
(player_id, reward_id, points_spent)
VALUES
(
    (SELECT player_id FROM jucatori
     WHERE username = 'test_player'),
    (SELECT reward_id FROM recompense_disponibile
     WHERE name = 'Reducere simbolica'),
    50
);


-- ==========================================
-- SFARSITUL INSERARII DATELOR
-- ==========================================
