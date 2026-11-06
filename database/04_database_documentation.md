
# ARAD QUEST

## Documentatia bazei de date

**Database:** arad_quest  
**DBMS:** PostgreSQL 17  
**Extension:** PostGIS 3.6.2  
**Language:** SQL

---

## 1. Prezentarea proiectului

Arad Quest este o aplicatie interactiva de turism care permite utilizatorilor sa descopere obiective turistice din Arad, sa parcurga trasee tematice, sa rezolve misiuni, sa acumuleze puncte, sa obtina insigne si sa revendice recompense.

Baza de date stocheaza informatii despre:

- Conturile si profilurile jucatorilor
- Obiective turistice si coordonate GPS
- Trasee tematice si ordinea obiectivelor
- Misiuni, indicii si raspunsuri corecte
- Progresul jucatorilor si raspunsurile trimise
- Insigne disponibile si obtinute
- Recompense disponibile si revendicate

Baza de date contine 15 tabele functionale, organizate in patru categorii principale.

---

## 2. Structura bazei de date

### 2.1. Trasee si misiuni

Aceasta categorie gestioneaza traseele tematice, obiectivele turistice si misiunile asociate.

Tabele incluse:

- `trasee_tematice`
- `obiective_turistice`
- `ordine_obiective_traseu`
- `misiuni`
- `indicii`
- `raspunsuri_corecte`

### 2.2. Jucatori si progres

Aceasta categorie gestioneaza conturile jucatorilor, progresul in trasee si misiuni, precum si raspunsurile trimise.

Tabele incluse:

- `jucatori`
- `progres_jucatori_misiuni`
- `progres_jucatori_trasee`
- `raspunsuri_trimise`

### 2.3. Recompense

Aceasta categorie gestioneaza recompensele disponibile si revendicarile realizate de jucatori.

Tabele incluse:

- `recompense_disponibile`
- `recompense_revendicate`

### 2.4. Insigne si clase

Aceasta categorie gestioneaza insignele disponibile, insignele obtinute de jucatori si clasele definite in aplicatie.

Tabele incluse:

- `insigne_disponibile`
- `insigne_jucatori`
- `clase_jucatori`

---

## 3. Descrierea tabelelor

### 3.1. trasee_tematice

Stocheaza traseele tematice disponibile in aplicatie.

**Primary Key:**
- `route_id`

**Important columns:**
- `title`
- `description`
- `difficulty`
- `estimated_minutes`
- `is_active`

### 3.2. obiective_turistice

Stocheaza informatiile despre obiectivele turistice incluse in trasee.

**Primary Key:**
- `objective_id`

**Important columns:**
- `name`
- `description`
- `address`
- `image_url`
- `location`
- `radius_meters`
- `is_active`

Coloana `location` utilizeaza tipul PostGIS `GEOGRAPHY(POINT, 4326)` pentru stocarea coordonatelor GPS.

Coloana `image_url` permite stocarea adresei web a imaginii asociate obiectivului turistic.

Coloana `radius_meters` defineste raza de proximitate in metri in care jucatorul poate interactiona cu obiectivul.

### 3.3. ordine_obiective_traseu

Realizeaza legatura dintre traseele tematice si obiectivele turistice si stabileste ordinea acestora.

**Composite Primary Key:**
- `route_id`
- `objective_id`

**Foreign Keys:**
- `route_id` -> `trasee_tematice.route_id`
- `objective_id` -> `obiective_turistice.objective_id`

**Important column:**
- `sequence_number`

Coloana `sequence_number` stabileste ordinea obiectivelor in cadrul unui traseu.

### 3.4. misiuni

Stocheaza misiunile asociate obiectivelor turistice.

**Primary Key:**
- `mission_id`

**Foreign Key:**
- `objective_id` -> `obiective_turistice.objective_id`

**Important columns:**
- `title`
- `description`
- `points_reward`
- `is_active`

Coloana `description` contine textul misiunii prezentate jucatorului.

### 3.5. indicii

Stocheaza indiciile asociate misiunilor.

**Primary Key:**
- `clue_id`

**Foreign Key:**
- `mission_id` -> `misiuni.mission_id`

**Important columns:**
- `clue_text`
- `clue_order`

Coloana `clue_order` stabileste ordinea in care sunt afisate indiciile.

### 3.6. raspunsuri_corecte

Stocheaza raspunsurile acceptate pentru fiecare misiune.

**Primary Key:**
- `solution_id`

**Foreign Key:**
- `mission_id` -> `misiuni.mission_id`

**Important column:**
- `accepted_answer`

Raspunsurile acceptate trebuie validate in backend si nu trebuie expuse direct in frontend.

### 3.7. jucatori

Stocheaza conturile jucatorilor si informatiile profilurilor acestora.

**Primary Key:**
- `player_id`

**Important columns:**
- `username`
- `email`
- `password_hash`
- `total_points`
- `created_at`
- `avatar_id`

Coloana `avatar_id` identifica avatarul selectat de jucator. Aceasta are o constrangere CHECK care permite valorile de la 1 la 4.

Tabelul `jucatori` nu contine coloana `class_id` si nu are in prezent o relatie directa cu tabelul `clase_jucatori`.

Parolele nu trebuie stocate niciodata in format text simplu. Backend-ul trebuie sa genereze si sa verifice hash-urile parolelor folosind un algoritm securizat, precum Argon2id sau bcrypt.

### 3.8. progres_jucatori_trasee

Stocheaza progresul jucatorilor in cadrul traseelor tematice.

**Composite Primary Key:**
- `player_id`
- `route_id`

**Foreign Keys:**
- `player_id` -> `jucatori.player_id`
- `route_id` -> `trasee_tematice.route_id`

**Important columns:**
- `status`
- `started_at`
- `completed_at`

### 3.9. progres_jucatori_misiuni

Stocheaza progresul jucatorilor pentru fiecare misiune.

**Composite Primary Key:**
- `player_id`
- `mission_id`

**Foreign Keys:**
- `player_id` -> `jucatori.player_id`
- `mission_id` -> `misiuni.mission_id`

**Important columns:**
- `status`
- `started_at`
- `completed_at`
- `points_awarded`

### 3.10. raspunsuri_trimise

Stocheaza raspunsurile trimise de jucatori pentru misiuni.

**Primary Key:**
- `attempt_id`

**Composite Foreign Key:**
- `(player_id, mission_id)` -> `progres_jucatori_misiuni(player_id, mission_id)`

**Important columns:**
- `answer_text`
- `is_correct`
- `submitted_at`

Tabelul permite pastrarea istoricului incercarilor si verificarea raspunsurilor trimise.

### 3.11. recompense_disponibile

Stocheaza recompensele care pot fi revendicate de jucatori.

**Primary Key:**
- `reward_id`

**Important columns:**
- `name`
- `description`
- `points_cost`
- `quantity_available`
- `is_active`

Coloana `quantity_available` reprezinta cantitatea disponibila. Valoarea NULL poate reprezenta un stoc nelimitat.

### 3.12. recompense_revendicate

Stocheaza recompensele revendicate de jucatori.

**Primary Key:**
- `claim_id`

**Foreign Keys:**
- `player_id` -> `jucatori.player_id`
- `reward_id` -> `recompense_disponibile.reward_id`

**Important columns:**
- `points_spent`
- `claimed_at`

### 3.13. insigne_disponibile

Stocheaza insignele care pot fi obtinute in aplicatie.

**Primary Key:**
- `badge_id`

### 3.14. insigne_jucatori

Realizeaza legatura dintre jucatori si insignele obtinute de acestia.

**Composite Primary Key:**
- `player_id`
- `badge_id`

**Foreign Keys:**
- `player_id` -> `jucatori.player_id`
- `badge_id` -> `insigne_disponibile.badge_id`

### 3.15. clase_jucatori

Stocheaza clasele definite pentru jucatori.

**Primary Key:**
- `class_id`

**Important columns:**
- `class_name`
- `description`

Tabelul exista in structura bazei de date, dar nu are in prezent o relatie directa cu tabelul `jucatori`.

---

## 4. Traseele tematice existente

In baza de date sunt definite doua trasee tematice, care contin in total 11 obiective turistice si 11 misiuni.

### 4.1. Descopera Aradul

**Route ID:** 1  
**Numar obiective:** 6  
**Punctaj total:** 130 puncte

| Ordine | Obiectiv | Objective ID | Mission ID |
|---|---|---:|---:|
| 1 | Primaria Arad | 1 | 1 |
| 2 | Biserica Rosie | 3 | 3 |
| 3 | Colegiul National Moise Nicoara | 7 | 4 |
| 4 | Teatrul Clasic Ioan Slavici | 2 | 2 |
| 5 | Filarmonica | 8 | 5 |
| 6 | Vechiul Cazinou | 9 | 6 |

### 4.2. Traseul in natura

**Route ID:** 3  
**Numar obiective:** 5  
**Punctaj total:** 100 puncte

| Ordine | Obiectiv | Objective ID | Mission ID |
|---|---|---:|---:|
| 1 | Parcul Micalaca - Zona 300 | 10 | 7 |
| 2 | Parcul Europa | 11 | 8 |
| 3 | Parcul de la Podgoria | 12 | 9 |
| 4 | Parcul Copiilor | 13 | 10 |
| 5 | Faleza Muresului - zona Gloria | 14 | 11 |

Fiecare obiectiv turistic are o misiune asociata, cu un raspuns care trebuie validat de backend.

Ordinea obiectivelor este definita in tabelul `ordine_obiective_traseu` prin intermediul coloanei `sequence_number`.

Generarea unei ordini aleatorii individuale pentru fiecare jucator reprezinta o functionalitate propusa pentru o etapa ulterioara de dezvoltare. Aceasta nu este inca implementata in baza de date.

---

## 5. Relatiile dintre tabele

### Relatii de tip unu-la-mai-multi (1:N)

- `obiective_turistice` -> `misiuni`
- `misiuni` -> `indicii`
- `misiuni` -> `raspunsuri_corecte`

### Relatii de tip multi-la-multi (M:N)

- `trasee_tematice` <-> `obiective_turistice`, prin intermediul tabelului `ordine_obiective_traseu`.
- `jucatori` <-> `trasee_tematice`, prin intermediul tabelului `progres_jucatori_trasee`.
- `jucatori` <-> `misiuni`, prin intermediul tabelului `progres_jucatori_misiuni`.
- `jucatori` <-> `insigne_disponibile`, prin intermediul tabelului `insigne_jucatori`.

### Alte relatii

- `progres_jucatori_misiuni` -> `raspunsuri_trimise`
- `jucatori` -> `recompense_revendicate`
- `recompense_disponibile` -> `recompense_revendicate`

Tabelul `clase_jucatori` nu are in prezent o relatie directa cu `jucatori`.

---

## 6. Chei primare, chei externe si constrangeri

O cheie primara (PK - Primary Key) identifica in mod unic fiecare inregistrare dintr-un tabel.

O cheie externa (FK - Foreign Key) stabileste o relatie intre tabele, facand referire la o cheie primara sau la o cheie unica dintr-un alt tabel.

Baza de date utilizeaza:

- Chei primare simple.
- Chei primare compuse.
- Chei externe.
- Constrangeri UNIQUE.
- Constrangeri CHECK.
- Constrangeri NOT NULL.

Cheile primare compuse sunt utilizate atunci cand o inregistrare este identificata prin combinatia a doua coloane, de exemplu `player_id` si `mission_id`.

### 6.1. Constrangeri UNIQUE

Au fost verificate urmatoarele reguli de unicitate:

| Tabel | Coloane | Rol |
|---|---|---|
| `clase_jucatori` | `class_name` | Numele claselor trebuie sa fie unice. |
| `jucatori` | `username` | Fiecare nume de utilizator trebuie sa fie unic. |
| `jucatori` | `email` | Fiecare adresa de email trebuie sa fie unica. |
| `indicii` | `(mission_id, clue_order)` | Ordinea indiciilor trebuie sa fie unica in cadrul fiecarei misiuni. |
| `insigne_disponibile` | `name` | Numele insignelor trebuie sa fie unice. |
| `ordine_obiective_traseu` | `(route_id, sequence_number)` | Fiecare pozitie dintr-un traseu poate fi ocupata de un singur obiectiv. |

### 6.2. Constrangeri CHECK

Baza de date contine reguli de validare pentru urmatoarele valori:

- `jucatori.total_points >= 0`
- `jucatori.avatar_id` trebuie sa fie intre 1 si 4.
- `misiuni.points_reward >= 0`
- `progres_jucatori_misiuni.points_awarded >= 0`
- `progres_jucatori_misiuni.status` poate avea doar valorile `in_progress` sau `completed`.
- O misiune cu statusul `completed` trebuie sa aiba completata coloana `completed_at`.
- `progres_jucatori_trasee.status` poate avea doar valorile `in_progress` sau `completed`.
- `recompense_disponibile.points_cost >= 0`
- `recompense_disponibile.quantity_available` poate fi NULL sau o valoare mai mare ori egala cu 0.
- `recompense_revendicate.points_spent >= 0`
- `trasee_tematice.difficulty` poate avea doar valorile `easy`, `medium` sau `hard`.

### 6.3. Coloane obligatorii (NOT NULL)

Au fost verificate coloanele obligatorii ale tabelelor. Printre acestea se numara:

- `jucatori`: `total_points`, `created_at`, `avatar_id`
- `misiuni`: `objective_id`, `title`, `points_reward`, `is_active`
- `obiective_turistice`: `name`, `location`, `radius_meters`, `is_active`
- `trasee_tematice`: `title`, `difficulty`, `is_active`
- `progres_jucatori_misiuni`: `status`, `started_at`, `points_awarded`
- `progres_jucatori_trasee`: `status`, `started_at`
- `raspunsuri_trimise`: `submitted_at`
- `recompense_disponibile`: `name`, `points_cost`, `is_active`
- `recompense_revendicate`: `claimed_at`

Coloanele optionale, precum descrierile, imaginile, adresele, `completed_at` si `quantity_available`, pot accepta valori NULL conform structurii proiectate.

---

## 7. PostGIS si coordonatele GPS

PostGIS este o extensie PostgreSQL utilizata pentru stocarea si prelucrarea informatiilor geografice.

Tabelul `obiective_turistice` contine coloana:

`location GEOGRAPHY(POINT, 4326)`

Aceasta coloana stocheaza pozitia geografica a fiecarui obiectiv turistic.

Sistemul de referinta spatiala utilizat este SRID 4326 (WGS 84).

Coordonatele pot fi extrase folosind:

- `ST_X()` pentru longitudine.
- `ST_Y()` pentru latitudine.

La introducerea coordonatelor se utilizeaza functia:

`ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`

Este important ca longitudinea sa fie transmisa prima, urmata de latitudine.

Coloana `radius_meters` defineste distanta din jurul unui obiectiv turistic in care poate fi declansata o interactiune bazata pe locatie.

Pentru cele 11 obiective din cele doua trasee, raza configurata in baza de date este de 50 de metri.

Backend-ul trebuie sa verifice daca pozitia GPS a jucatorului se incadreaza in raza obiectivului inainte de a permite verificarea raspunsului la misiune.

Coordonatele GPS trebuie verificate inainte de utilizarea aplicatiei in conditii reale.

---

## 8. Observatii pentru implementarea backend-ului

Backend-ul dezvoltat in Python comunica cu PostgreSQL si utilizeaza interogari SQL pentru citirea si modificarea datelor aplicatiei.

Reguli importante pentru implementare:

1. Parolele trebuie transformate in hash folosind Argon2id sau bcrypt.
2. Parolele nu trebuie stocate niciodata in format text simplu.
3. Raspunsurile la misiuni trebuie validate in backend.
4. Raspunsurile corecte nu trebuie transmise catre frontend.
5. Verificarea distantei GPS trebuie realizata inainte de verificarea raspunsului.
6. Punctele trebuie acordate o singura data pentru finalizarea unei misiuni.
7. Finalizarea misiunilor si actualizarea punctelor trebuie realizate folosind tranzactii.
8. La revendicarea recompenselor trebuie verificat daca jucatorul are suficiente puncte si daca recompensa mai este disponibila.
9. Revendicarea unei recompense trebuie sa actualizeze punctele jucatorului si cantitatea disponibila intr-o singura tranzactie.
10. Datele introduse de utilizatori trebuie transmise prin interogari SQL parametrizate.
11. Coordonatele GPS trebuie transmise in ordinea corecta: longitudine si latitudine atunci cand sunt utilizate in `ST_MakePoint(longitude, latitude)`.
12. Raza GPS trebuie citita din coloana `radius_meters`, nu definita separat printr-o valoare fixa in backend.

---

## 9. Datele existente in baza de date

In urma introducerii celor doua trasee, baza de date contine:

| Element | Numar |
|---|---:|
| Trasee tematice | 2 |
| Obiective turistice incluse in trasee | 11 |
| Misiuni asociate obiectivelor | 11 |
| Obiective in traseul Descopera Aradul | 6 |
| Obiective in Traseul in natura | 5 |
| Punctaj total Descopera Aradul | 130 |
| Punctaj total Traseul in natura | 100 |

Datele pentru cele doua trasee sunt stocate in tabelele `trasee_tematice`, `obiective_turistice`, `ordine_obiective_traseu`, `misiuni` si `raspunsuri_corecte`.

Baza de date mai contine date utilizate pentru testarea conturilor, progresului, insignelor si recompenselor.

---

## 10. Interogari SQL de testare

Fisierul `03_test_queries.sql` contine interogari utilizate pentru verificarea functionalitatilor bazei de date.

Acestea permit verificarea urmatoarelor informatii:

- Afisarea profilurilor jucatorilor.
- Afisarea obiectivelor turistice si a coordonatelor GPS.
- Afisarea traseelor tematice.
- Afisarea misiunilor si a indiciilor.
- Verificarea progresului jucatorilor.
- Afisarea insignelor obtinute.
- Afisarea recompenselor disponibile.
- Generarea clasamentului jucatorilor.
- Afisarea istoricului raspunsurilor trimise.

Interogarile sunt utilizate pentru testarea structurii si a datelor din baza de date.

---

## 11. Fisierele bazei de date

Directorul `database` contine urmatoarele fisiere:

- `01_create_tables.sql` - scriptul pentru crearea tabelelor.
- `02_insert_data.sql` - scriptul pentru inserarea datelor initiale.
- `03_test_queries.sql` - interogarile utilizate pentru testarea bazei de date.
- `04_database_documentation.md` - documentatia structurii bazei de date.
- `05_insert_nature_route.sql` - scriptul pentru introducerea traseului in natura, daca este pastrat separat in repository.
- `Arad_Quest_Database_Map_ro.html` - reprezentarea vizuala a structurii bazei de date.

---

## 12. Verificarea structurii bazei de date

Structura bazei de date a fost verificata in PostgreSQL prin inspectarea tabelelor, coloanelor si constrangerilor.

Verificarile au inclus:

- Existenta celor 15 tabele functionale.
- Verificarea cheilor primare si externe.
- Verificarea relatiilor dintre tabele.
- Verificarea constrangerilor UNIQUE.
- Verificarea constrangerilor CHECK.
- Verificarea coloanelor obligatorii NOT NULL.
- Verificarea tipului geografic al coloanei `location`.
- Verificarea razei GPS configurate pentru obiectivele turistice.
- Verificarea datelor introduse pentru cele doua trasee.

Tabelul `spatial_ref_sys` este creat si gestionat de extensia PostGIS. Acesta este un tabel tehnic al extensiei si nu face parte din cele 15 tabele functionale ale aplicatiei.

---

## 13. Functionalitati aflate in dezvoltare

Urmatoarele functionalitati necesita implementare sau integrare suplimentara in aplicatie:

- Gestionarea progresului individual al jucatorilor.
- Deblocarea succesiva a obiectivelor dupa rezolvarea misiunilor.
- Generarea si salvarea unei ordini aleatorii a obiectivelor pentru fiecare jucator.
- Pastrarea aceleiasi ordini atunci cand jucatorul revine in aplicatie.
- Gestionarea revendicarii recompenselor prin coduri QR.
- Gestionarea imaginilor asociate obiectivelor turistice.

Aceste functionalitati trebuie implementate prin colaborarea dintre baza de date, backend si frontend.

---

## 14. Concluzie

Baza de date Arad Quest este organizata pentru gestionarea traseelor tematice, obiectivelor turistice, misiunilor, jucatorilor, progresului, insignelor si recompenselor.

PostgreSQL asigura stocarea si gestionarea datelor, iar extensia PostGIS permite utilizarea coordonatelor geografice pentru functionalitatile bazate pe locatie.

Structura actuala include doua trasee tematice si 11 obiective turistice, fiecare avand o misiune asociata.

Baza de date reprezinta componenta centrala pentru gestionarea informatiilor si a progresului utilizatorilor in aplicatia Arad Quest.
