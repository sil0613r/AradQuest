
-- ==========================================
-- ARAD QUEST
-- 02 - Initial data
-- PostgreSQL + PostGIS
-- ==========================================

BEGIN;

-- ==========================================
-- 1. CLASE DE JUCATORI
-- ==========================================

INSERT INTO clase_jucatori (class_name, description)
VALUES
('Explorer', 'Descopera obiective turistice'),
('Adventurer', 'Exploreaza orasul si rezolva misiuni'),
('Champion', 'Participa la provocari si acumuleaza puncte'),
('Pathfinder', 'Descopera trasee noi');


-- ==========================================
-- 2. OBIECTIVE TURISTICE
-- ==========================================

INSERT INTO obiective_turistice
(name, description, address, image_url, location, radius_meters)
VALUES

-- Traseul cultural

(
    'Primaria Arad',
    'Este kilometrul zero al deciziilor locale, o cladire administrativa care te priveste de sus printr-un turn cu ceas.',
    NULL,
    NULL,
    ST_SetSRID(ST_MakePoint(21.3172, 46.1751), 4326)::geography,
    50
),
(
    'Teatrul Clasic Ioan Slavici',
    'Cladirea cu coloane masive albe, locul din centrul orasului unde drama si comedia isi dau intalnire seara de seara.',
    NULL,
    NULL,
    ST_SetSRID(ST_MakePoint(21.3156, 46.1708), 4326)::geography,
    50
),
(
    'Biserica Rosie',
    'O cladire impunatoare de pe bulevardul principal, imposibil de ratat datorita stilului neogotic. Nu e facuta din foc, dar ii poarta culoarea.',
    NULL,
    NULL,
    ST_SetSRID(ST_MakePoint(21.3200, 46.1775), 4326)::geography,
    50
),
(
    'Colegiul National Moise Nicoara',
    'In fata unei scoli cu o istorie aparte, doua siluete de bronz stau de straja, cate una de fiecare parte a intrarii. In apropiere, terenul de sport aminteste ca educatia nu se desfasoara doar intre ziduri.',
    NULL,
    NULL,
    ST_SetSRID(ST_MakePoint(21.3192, 46.1711), 4326)::geography,
    50
),
(
    'Filarmonica',
    'Locul unde istoria si muzica impart acelasi acoperis. Cauta palatul de langa parc din care, daca asculti cu atentie, poti auzi acorduri de vioara.',
    NULL,
    NULL,
    ST_SetSRID(ST_MakePoint(21.3168, 46.1738), 4326)::geography,
    50
),
(
    'Vechiul Cazinou',
    'Timp de aproape doua secole, cladirea a fost martora vietii orasului. A cunoscut stralucirea, apoi uitarea, iar peretii sai au indurat focul si timpul. Astazi, si-a recapatat grandoarea pe faleza raului, pregatita sa gazduiasca din nou evenimentele Aradului.',
    NULL,
    NULL,
    ST_SetSRID(ST_MakePoint(21.3218, 46.1705), 4326)::geography,
    50
),

-- Traseul in natura

(
    'Parcul Micalaca - Zona 300',
    'La marginea cartierului Micalaca, acolo unde orasul se apropie de faleza Muresului, se intinde un spatiu verde dedicat relaxarii si miscarii. Aleile, terenurile de sport si locurile de joaca aduna aici oameni de toate varstele. Este un loc in care natura si comunitatea se intalnesc.',
    NULL,
    NULL,
    ST_SetSRID(ST_MakePoint(21.3421142, 46.1678101), 4326)::geography,
    50
),
(
    'Parcul Europa',
    'Un colt de verdeata in care numele unui intreg continent a devenit simbolul relaxarii. Aproape de malul Muresului, parcul ofera un refugiu departe de agitatia orasului. Printre alei si spatii de odihna, mici constructii colorate ii asteapta pe cei care au nevoie de un adapost.',
    NULL,
    NULL,
    ST_SetSRID(ST_MakePoint(21.331454, 46.178438), 4326)::geography,
    50
),
(
    'Parcul de la Podgoria',
    'In apropierea lacului de la Podgoria, natura creeaza un decor linistit, in care apa, vegetatia si aleile par sa invite la o pauza. Un bust vegheaza asupra parcului, pastrand vie amintirea unei personalitati importante din istoria Romaniei. Priveste cu atentie si descopera cine este.',
    NULL,
    NULL,
    ST_SetSRID(ST_MakePoint(21.322610, 46.183437), 4326)::geography,
    50
),
(
    'Parcul Copiilor',
    'Un loc in care joaca, natura si imaginatia se intalnesc. Printre copaci, alei si spatii de joaca, cei mici isi gasesc mereu o noua aventura. Dar nu toate drumurile sunt simple: uneori, pentru a ajunge la destinatie, trebuie sa gasesti calea potrivita.',
    NULL,
    NULL,
    ST_SetSRID(ST_MakePoint(21.320762, 46.173424), 4326)::geography,
    50
),
(
    'Faleza Muresului - zona Gloria (Tenis Club Pro)',
    'De-a lungul Muresului, faleza ofera un spatiu potrivit pentru miscare si recreere. In zona Gloria, printre copaci si alei, sportul isi gaseste locul pe terenurile de tenis. Aici, fiecare schimb de mingi cere atentie, precizie si putina strategie.',
    NULL,
    NULL,
    ST_SetSRID(ST_MakePoint(21.325142, 46.166411), 4326)::geography,
    50
);


-- ==========================================
-- 3. TRASEE TEMATICE
-- ==========================================

INSERT INTO trasee_tematice
(title, description, difficulty, estimated_minutes)
VALUES
(
    'Descopera Aradul',
    'Un traseu cultural prin obiective istorice si arhitecturale reprezentative ale orasului Arad.',
    'easy',
    60
),
(
    'Traseul in natura',
    'Un traseu prin parcurile si zonele verzi ale orasului Arad, dedicat descoperirii naturii si activitatilor in aer liber.',
    'easy',
    60
);


-- ==========================================
-- 4. ORDINEA OBIECTIVELOR IN TRASEE
-- ==========================================

-- Traseul Descopera Aradul

INSERT INTO ordine_obiective_traseu
(route_id, objective_id, sequence_number)
SELECT
    t.route_id,
    o.objective_id,
    v.sequence_number
FROM (
    VALUES
        ('Primaria Arad', 1),
        ('Biserica Rosie', 2),
        ('Colegiul National Moise Nicoara', 3),
        ('Teatrul Clasic Ioan Slavici', 4),
        ('Filarmonica', 5),
        ('Vechiul Cazinou', 6)
) AS v(objective_name, sequence_number)
JOIN trasee_tematice t
    ON t.title = 'Descopera Aradul'
JOIN obiective_turistice o
    ON o.name = v.objective_name;


-- Traseul in natura

INSERT INTO ordine_obiective_traseu
(route_id, objective_id, sequence_number)
SELECT
    t.route_id,
    o.objective_id,
    v.sequence_number
FROM (
    VALUES
        ('Parcul Micalaca - Zona 300', 1),
        ('Parcul Europa', 2),
        ('Parcul de la Podgoria', 3),
        ('Parcul Copiilor', 4),
        ('Faleza Muresului - zona Gloria (Tenis Club Pro)', 5)
) AS v(objective_name, sequence_number)
JOIN trasee_tematice t
    ON t.title = 'Traseul in natura'
JOIN obiective_turistice o
    ON o.name = v.objective_name;


-- ==========================================
-- 5. MISIUNI
-- ==========================================

INSERT INTO misiuni
(objective_id, title, description, points_reward)
SELECT
    o.objective_id,
    v.mission_title,
    v.mission_description,
    v.points_reward
FROM (
    VALUES

    -- Traseul cultural

    (
        'Primaria Arad',
        'Mesajul de la intrare',
        'Deasupra intrarii principale sta scris un citat celebru. Carei evanghelii ii apartine?',
        40
    ),
    (
        'Teatrul Clasic Ioan Slavici',
        'Poetul din umbra scenei',
        'Nu toti cei care au trecut pragul acestui loc au venit sa joace. Unul a locuit aici, dar scena lui a fost poezia. Cauta-i urma pe zid si descopera-i identitatea. Cate silabe contine cuvantul ce formeaza judetul in care acesta s-a nascut?',
        40
    ),
    (
        'Biserica Rosie',
        'In jurul zidurilor',
        'Nu te multumi sa o privesti din fata. Cladirea isi dezvaluie secretele si celor care o inconjoara. Fa un tur complet si numara toate portile integrate in zidurile exterioare. Cate ai descoperit?',
        40
    ),
    (
        'Colegiul National Moise Nicoara',
        'Doua destine, un numar',
        'In fata scolii, observa cele doua siluete de bronz care stau de straja, cate una de fiecare parte a intrarii. Moise Nicoara si Ioan Slavici au trait amandoi 77 de ani. Care numar leaga matematic destinele celor doi paznici?',
        40
    ),
    (
        'Filarmonica',
        'Semnul ascuns in parc',
        'Uita-te in jurul cladirii. Nu este nici drum, nici calator, dar sta pe cinci linii paralele si stabileste regulile de la bun inceput. Se infasoara exact pe a doua linie. Cum se numeste?',
        40
    ),
    (
        'Vechiul Cazinou',
        'Trei urme ale timpului',
        'Trei repere au fost lasate in urma de timp si sunt scrise intr-un alfabet in care semnele se aduna pentru a deveni numere. Priveste-le in ordinea coborarii, nu in ordinea anilor. Unul dintre ele marcheaza inceputul acestei cladiri. Nu te intreb ce an este, ci unde se afla in sirul celor trei.',
        40
    ),

    -- Traseul in natura

    (
        'Parcul Micalaca - Zona 300',
        'Gustul unei iesiri in aer liber',
        'Nu doar plimbarile si sportul te asteapta aici. Parcul a fost amenajat si pentru cei care prefera sa petreaca timp in aer liber, la un gratar cu prietenii. Cate locuri pentru gratar au fost prevazute in parc?',
        40
    ),
    (
        'Parcul Europa',
        'Adaposturi printre copaci',
        'Natura nu tine intotdeauna cont de planurile noastre, iar uneori ploaia ne poate surprinde in mijlocul unei plimbari. Cate casute colorate gasesti aici, pregatite sa te adaposteasca?',
        40
    ),
    (
        'Parcul de la Podgoria',
        'Chipul unei personalitati',
        'Printre copaci si in apropierea apei, o statuie pastreaza amintirea unui om care a marcat istoria recenta a Romaniei. Care este numele personalitatii reprezentate?',
        40
    ),
    (
        'Parcul Copiilor',
        'Drumul spre iesire',
        'Exista un loc in care te poti rataci printre drumuri intortocheate, dar unde rabdarea si atentia te ajuta sa gasesti iesirea. Cum se numeste?',
        40
    ),
    (
        'Faleza Muresului - zona Gloria (Tenis Club Pro)',
        'Jocul de pe faleza',
        'Nu departe de faleza, fileul imparte terenul in doua, iar mingea trece dintr-o parte in alta. Priveste cu atentie terenurile de la Tenis Club Pro. Cate terenuri de tenis sunt aici?',
        40
    )

) AS v(objective_name, mission_title, mission_description, points_reward)
JOIN obiective_turistice o
    ON o.name = v.objective_name;


-- ==========================================
-- 6. INDICII
-- ==========================================

INSERT INTO indicii
(mission_id, clue_text, clue_order)
SELECT
    m.mission_id,
    v.clue_text,
    v.clue_order
FROM (
    VALUES
        ('Mesajul de la intrare',
         'Priveste cu atentie deasupra intrarii principale.', 1),

        ('Mesajul de la intrare',
         'Cauta inscriptia de pe cladire.', 2),

        ('Poetul din umbra scenei',
         'Gandeste-te la personalitatile legate de teatrul din Arad.', 1)
) AS v(mission_title, clue_text, clue_order)
JOIN misiuni m
    ON m.title = v.mission_title;


-- ==========================================
-- 7. RASPUNSURI CORECTE ACCEPTATE
-- ==========================================

INSERT INTO raspunsuri_corecte
(mission_id, accepted_answer)
SELECT
    m.mission_id,
    v.accepted_answer
FROM (
    VALUES
        ('Mesajul de la intrare', 'Ioan'),
        ('Poetul din umbra scenei', '2'),
        ('In jurul zidurilor', '5'),
        ('Doua destine, un numar', '77'),
        ('Semnul ascuns in parc', 'cheia sol'),
        ('Trei urme ale timpului', '3'),
        ('Gustul unei iesiri in aer liber', '10'),
        ('Adaposturi printre copaci', '3'),
        ('Chipul unei personalitati', 'Coposu'),
        ('Drumul spre iesire', 'labirint'),
        ('Jocul de pe faleza', '4')
) AS v(mission_title, accepted_answer)
JOIN misiuni m
    ON m.title = v.mission_title;


-- ==========================================
-- 8. INSIGNE DISPONIBILE
-- ==========================================

INSERT INTO insigne_disponibile
(name, description, points_required)
VALUES
('Primul pas', 'Pentru prima misiune completata.', 20),
('Explorator', 'Pentru acumularea a 50 de puncte.', 50),
('Detectiv', 'Pentru rezolvarea mai multor indicii.', 100);


-- ==========================================
-- 9. RECOMPENSE DISPONIBILE
-- ==========================================

INSERT INTO recompense_disponibile
(name, description, points_cost, quantity_available)
VALUES
('Reducere simbolica', 'O reducere oferita ca recompensa.', 50, 10),
('Premiu special', 'Un premiu pentru jucatorii activi.', 100, 5);


-- ==========================================
-- SFARSITUL INSERARII DATELOR
-- ==========================================

COMMIT;
