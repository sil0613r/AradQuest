
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
- Conturile jucatorilor si clasele acestora
- Obiective turistice si coordonate GPS
- Trasee tematice si obiectivele incluse
- Misiuni, indicii si raspunsuri corecte
- Progresul jucatorilor si raspunsurile trimise
- Insigne si recompense

Baza de date contine 15 tabele.

---

## 2. Database Tables

### 2.1. clase_jucatori
Stocheaza clasele disponibile pentru jucatori.

**Primary Key:**
- class_id

**Important columns:**
- class_name
- description

### 2.2. jucatori
Stocheaza conturile jucatorilor si informatiile profilurilor acestora.

**Primary Key:**
- player_id

**Foreign Keys:**
- class_id -> clase_jucatori.class_id

**Important columns:**
- username
- email
- password_hash
- total_points
- created_at

Parolele nu trebuie stocate niciodata in format text simplu.
Backend-ul trebuie sa genereze si sa verifice hash-urile parolelor folosind un algoritm securizat, precum Argon2id sau bcrypt.

### 2.3. obiective_turistice
Stocheaza obiectivele turistice si pozitiile lor geografice.

**Primary Key:**
- objective_id

**Important columns:**
- name
- description
- address
- image_url
- location
- radius_meters
- is_active

The location column uses PostGIS GEOGRAPHY(POINT, 4326) to store GPS coordinates.

### 2.4. trasee_tematice
Stocheaza traseele tematice.

**Primary Key:**
- route_id

**Important columns:**
- title
- description
- difficulty
- estimated_minutes
- is_active

### 2.5. ordine_obiective_traseu
Realizeaza legatura dintre traseele tematice si obiectivele turistice si stabileste ordinea acestora.

**Composite Primary Key:**
- route_id
- objective_id

**Foreign Keys:**
- route_id -> trasee_tematice.route_id
- objective_id -> obiective_turistice.objective_id

Coloana sequence_number stabileste ordinea obiectivelor turistice in cadrul unui traseu.

### 2.6. misiuni
Stocheaza misiunile asociate obiectivelor turistice.

**Primary Key:**
- mission_id

**Foreign Key:**
- objective_id -> obiective_turistice.objective_id

**Important columns:**
- title
- description
- points_reward
- is_active

### 2.7. indicii
Stocheaza indiciile asociate misiunilor.

**Primary Key:**
- clue_id

**Foreign Key:**
- mission_id -> misiuni.mission_id

Coloana clue_order stabileste ordinea in care sunt afisate indiciile.

### 2.8. raspunsuri_corecte
Stocheaza raspunsurile acceptate pentru misiuni.

**Primary Key:**
- solution_id

**Foreign Key:**
- mission_id -> misiuni.mission_id

Raspunsurile acceptate trebuie validate in backend si nu trebuie expuse direct in frontend.

### 2.9. progres_jucatori_trasee
Stocheaza progresul jucatorilor in cadrul traseelor tematice.

**Composite Primary Key:**
- player_id
- route_id

**Foreign Keys:**
- player_id -> jucatori.player_id
- route_id -> trasee_tematice.route_id

### 2.10. progres_jucatori_misiuni
Stocheaza progresul jucatorilor pentru fiecare misiune.

**Composite Primary Key:**
- player_id
- mission_id

**Foreign Keys:**
- player_id -> jucatori.player_id
- mission_id -> misiuni.mission_id

**Important columns:**
- status
- started_at
- completed_at
- points_awarded

### 2.11. raspunsuri_trimise
Stocheaza raspunsurile trimise de jucatori.

**Primary Key:**
- attempt_id

**Composite Foreign Key:**
- (player_id, mission_id) ->
  progres_jucatori_misiuni(player_id, mission_id)

Retine raspunsul trimis, corectitudinea acestuia si momentul trimiterii.

### 2.12. insigne_disponibile
Stocheaza toate insignele disponibile in aplicatie.

**Primary Key:**
- badge_id

### 2.13. insigne_jucatori
Realizeaza legatura dintre jucatori si insignele obtinute de acestia.

**Composite Primary Key:**
- player_id
- badge_id

**Foreign Keys:**
- player_id -> jucatori.player_id
- badge_id -> insigne_disponibile.badge_id

### 2.14. recompense_disponibile
Stocheaza recompensele disponibile pentru jucatori.

**Primary Key:**
- reward_id

**Important columns:**
- name
- description
- points_cost
- quantity_available
- is_active

### 2.15. recompense_revendicate
Stocheaza recompensele revendicate de jucatori.

**Primary Key:**
- claim_id

**Foreign Keys:**
- player_id -> jucatori.player_id
- reward_id -> recompense_disponibile.reward_id

Retine punctele cheltuite si data revendicarii.

---

## 3. Relatiile dintre tabele

### Relatii de tip unu-la-mai-multi (1:N)

- clase_jucatori -> jucatori
- obiective_turistice -> misiuni
- misiuni -> indicii
- misiuni -> raspunsuri_corecte

### Relatii de tip multi-la-multi (M:N)

- trasee_tematice <-> obiective_turistice
  Prin intermediul tabelului ordine_obiective_traseu.

- jucatori <-> trasee_tematice
  Prin intermediul tabelului progres_jucatori_trasee.

- jucatori <-> misiuni
  Prin intermediul tabelului progres_jucatori_misiuni.

- jucatori <-> insigne_disponibile
  Prin intermediul tabelului insigne_jucatori.

### Alte relatii

- progres_jucatori_misiuni -> raspunsuri_trimise
- jucatori -> recompense_revendicate
- recompense_disponibile -> recompense_revendicate

---

## 4. Chei primare si chei externe

O cheie primara (PK - Primary Key) identifica in mod unic fiecare inregistrare dintr-un tabel.

O cheie externa (FK - Foreign Key) stabileste o relatie intre tabele, facand referire la cheia primara dintr-un alt tabel.

Baza de date utilizeaza:
- Chei primare formate dintr-o singura coloana.
- Chei primare compuse.
- Chei externe.
- Constrangeri UNIQUE.
- Constrangeri CHECK.

Cheile primare compuse sunt utilizate atunci cand o inregistrare este identificata prin combinatia a doua coloane, de exemplu player_id si mission_id.

---

## 5. PostGIS si coordonatele GPS

PostGIS este o extensie PostgreSQL utilizata pentru stocarea si prelucrarea informatiilor geografice.

The obiective_turistice table contains:

location GEOGRAPHY(POINT, 4326)

Aceasta coloana stocheaza pozitia geografica a fiecarui obiectiv turistic.

Coordonatele pot fi extrase folosind:
- ST_X() pentru longitudine.
- ST_Y() pentru latitudine.

Coloana radius_meters defineste distanta din jurul unui obiectiv turistic in care poate fi declansata o interactiune bazata pe locatie.

Backend-ul aplicatiei poate utiliza aceste coordonate pentru a determina daca un jucator se afla in apropierea unui obiectiv turistic.

Coordonatele GPS existente in datele demonstrative sunt orientative si trebuie inlocuite cu coordonate verificate inainte de utilizarea aplicatiei in conditii reale.

---

## 6. Observatii pentru implementarea backend-ului

Backend-ul dezvoltat in Python va comunica cu PostgreSQL si va utiliza interogari SQL pentru citirea si modificarea datelor aplicatiei.

Reguli importante pentru implementare:

1. Parolele trebuie transformate in hash folosind Argon2id sau bcrypt.
2. Parolele nu trebuie stocate niciodata in format text simplu.
3. Raspunsurile la misiuni trebuie validate in backend.
4. Punctele trebuie acordate o singura data pentru finalizarea unei misiuni.
5. Finalizarea misiunilor si actualizarea punctelor trebuie realizate folosind tranzactii.
6. La revendicarea recompenselor trebuie verificat daca jucatorul are suficiente puncte si daca recompensa mai este disponibila.
7. Revendicarea unei recompense trebuie sa actualizeze punctele jucatorului si cantitatea disponibila intr-o singura tranzactie.
8. Datele introduse de utilizatori trebuie transmise prin interogari SQL parametrizate.
9. Coordonatele GPS trebuie transmise in ordinea corecta: longitudine si latitudine atunci cand sunt utilizate in ST_MakePoint(longitude, latitude).
10. Informatiile sensibile, precum hash-urile parolelor si raspunsurile corecte, nu trebuie expuse in frontend.

---

## 7. Date demonstrative

Baza de date contine in prezent date demonstrative utilizate pentru testare:

- 4 clase de jucatori
- 1 jucator de test
- 3 obiective turistice
- 1 traseu tematic
- 2 misiuni
- 3 indicii
- 3 insigne disponibile
- 2 recompense disponibile

Jucatorul demonstrativ are username-ul test_player.

Datele demonstrative sunt destinate dezvoltarii si testarii aplicatiei, nu utilizarii in productie.

---

## 8. Interogari SQL de testare

Fisierul 03_test_queries.sql contine interogari utilizate pentru verificarea urmatoarelor functionalitati:

- Afisarea profilurilor jucatorilor
- Obiective turistice si coordonate GPS
- Afisarea traseelor tematice
- Afisarea misiunilor si a indiciilor
- Verificarea progresului jucatorilor
- Afisarea insignelor obtinute
- Afisarea recompenselor disponibile
- Generarea clasamentului jucatorilor
- Afisarea istoricului raspunsurilor trimise

Toate cele 10 interogari de test au fost executate cu succes.

---

## 9. Fisierele bazei de date

Directorul database contine urmatoarele fisiere:

- 01_create_tables.sql - scriptul pentru crearea tabelelor
- 02_insert_data.sql - scriptul pentru inserarea datelor demonstrative
- 03_test_queries.sql - interogarile utilizate pentru testarea bazei de date
- 04_database_documentation.md - documentatia bazei de date

Aceste fisiere descriu structura bazei de date, datele initiale, interogarile de testare si modul de organizare a tabelelor.


---

## 10. Verificarea structurii si a constrangerilor bazei de date

Dupa crearea celor 15 tabele, structura bazei de date a fost verificata in PostgreSQL pentru a confirma corectitudinea relatiilor si a regulilor de integritate.

### 10.1. Verificarea cheilor primare si externe

Cheile primare si cheile externe au fost inspectate si verificate.

Tabelul `raspunsuri_trimise` utilizeaza o cheie externa compusa:

- `(player_id, mission_id)` -> `progres_jucatori_misiuni(player_id, mission_id)`

Aceasta relatie asigura faptul ca un raspuns trimis apartine unei inregistrari existente de progres pentru combinatia respectiva de jucator si misiune. Ambele coloane trebuie transmise impreuna la inserarea unui raspuns.

### 10.2. Constrangeri UNIQUE

Au fost verificate urmatoarele reguli de unicitate:

| Tabel | Coloane | Rol |
|---|---|---|
| `clase_jucatori` | `class_name` | Numele claselor de jucatori trebuie sa fie unice. |
| `jucatori` | `username` | Fiecare nume de utilizator trebuie sa fie unic. |
| `jucatori` | `email` | Fiecare adresa de email trebuie sa fie unica. |
| `indicii` | `(mission_id, clue_order)` | Ordinea indiciilor trebuie sa fie unica in cadrul fiecarei misiuni. |
| `insigne_disponibile` | `name` | Numele insignelor trebuie sa fie unice. |
| `ordine_obiective_traseu` | `(route_id, sequence_number)` | O pozitie poate fi ocupata de un singur obiectiv in cadrul unui traseu. |

### 10.3. Constrangeri CHECK

Baza de date contine urmatoarele reguli de validare:

- `jucatori.total_points >= 0` - punctele unui jucator nu pot fi negative.
- `misiuni.points_reward >= 0` - recompensa unei misiuni nu poate fi negativa.
- `progres_jucatori_misiuni.points_awarded >= 0` - punctele acordate nu pot fi negative.
- `progres_jucatori_misiuni.status` poate avea doar valorile `in_progress` sau `completed`.
- O misiune cu statusul `completed` trebuie sa aiba completata coloana `completed_at`.
- `progres_jucatori_trasee.status` poate avea doar valorile `in_progress` sau `completed`.
- `recompense_disponibile.points_cost >= 0` - costul unei recompense nu poate fi negativ.
- `recompense_disponibile.quantity_available` poate fi NULL sau o valoare mai mare ori egala cu 0. Valoarea NULL poate reprezenta un stoc nelimitat.
- `recompense_revendicate.points_spent >= 0` - punctele cheltuite nu pot fi negative.
- `trasee_tematice.difficulty` poate avea doar valorile `easy`, `medium` sau `hard`.

Extensia PostGIS defineste, de asemenea, o constrangere CHECK in tabelul sistem `spatial_ref_sys`. Aceasta apartine extensiei si nu reprezinta o regula specifica aplicatiei.

### 10.4. Coloane obligatorii (NOT NULL)

Au fost verificate si actualizate urmatoarele coloane, astfel incat sa nu accepte valori NULL:

- `jucatori`: `total_points`, `created_at`
- `misiuni`: `points_reward`, `is_active`
- `obiective_turistice`: `radius_meters`, `is_active`
- `progres_jucatori_misiuni`: `status`, `started_at`, `points_awarded`
- `progres_jucatori_trasee`: `status`, `started_at`
- `raspunsuri_trimise`: `submitted_at`
- `recompense_disponibile`: `is_active`
- `recompense_revendicate`: `claimed_at`
- `trasee_tematice`: `difficulty`

Inainte de aplicarea acestor modificari, au fost verificate inregistrarile existente pentru a identifica eventuale valori NULL in coloanele respective. Nu au fost gasite valori NULL.

Modificarile au fost aplicate cu succes intr-o tranzactie si ulterior verificate prin intermediul `information_schema.columns`. Toate cele 15 coloane au returnat valoarea `NO` pentru proprietatea `is_nullable`.

Celelalte coloane care accepta NULL au ramas optionale conform structurii proiectate. Exemple: descrierile, imaginile, adresele, `completed_at` si `quantity_available`.

### 10.5. Rezumatul verificarilor

Au fost realizate cu succes urmatoarele verificari:

- Au fost inspectate cele 15 tabele si coloanele acestora.
- Au fost verificate cheile primare si cheile externe.
- A fost verificata individual fiecare coloana a cheii externe compuse din `raspunsuri_trimise`.
- Au fost inspectate constrangerile UNIQUE si CHECK.
- Au fost actualizate si reverificate coloanele selectate pentru NOT NULL.
- Toate cele 10 interogari din `03_test_queries.sql` au fost executate cu succes.

Aceste verificari confirma structura actuala a bazei de date si datele demonstrative existente.

Functionalitatile aplicatiei, precum autentificarea, verificarea proximitatii GPS, finalizarea misiunilor, acordarea punctelor si revendicarea recompenselor, trebuie implementate si testate in continuare in backend-ul Python.
