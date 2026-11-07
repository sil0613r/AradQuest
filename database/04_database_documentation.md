# ARAD QUEST

## Database Documentation

**Database:** `arad_quest`  
**DBMS:** PostgreSQL 17  
**Extension:** PostGIS 3.6.2  
**Language:** SQL

---

## 1. Project Overview

Arad Quest is an interactive tourism application that allows users to discover tourist attractions in Arad, explore thematic routes, solve missions, collect points and badges, and claim rewards.

The database stores information about:

- Player accounts and profiles
- Tourist attractions and GPS coordinates
- Thematic routes and the order of their objectives
- Missions, clues and accepted answers
- Player progress and submitted answers
- Available badges and earned badges
- Available rewards and claimed rewards
- QR codes used for reward redemption

The database contains 15 functional application tables, organized into four main categories.

## 2. Database Structure

### 2.1. Routes and Missions

This category manages thematic routes, tourist attractions and their associated missions.

Tables:

- `trasee_tematice`
- `obiective_turistice`
- `ordine_obiective_traseu`
- `misiuni`
- `indicii`
- `raspunsuri_corecte`

### 2.2. Players and Progress

This category manages player accounts, route progress, mission progress and submitted answers.

Tables:

- `jucatori`
- `progres_jucatori_trasee`
- `progres_jucatori_misiuni`
- `raspunsuri_trimise`

### 2.3. Rewards

This category manages available rewards and player reward claims.

Tables:

- `recompense_disponibile`
- `recompense_revendicate`

### 2.4. Badges and Player Classes

This category manages available badges, earned badges and player classes.

Tables:

- `insigne_disponibile`
- `insigne_jucatori`
- `clase_jucatori`

## 3. Database Tables

### 3.1. `trasee_tematice`

Stores the thematic routes available in the application.

**Primary Key:** `route_id`

Important columns:

- `title`
- `description`
- `difficulty`
- `estimated_minutes`
- `is_active`

### 3.2. `obiective_turistice`

Stores tourist attractions and their geographical locations.

**Primary Key:** `objective_id`

Important columns:

- `name`
- `description`
- `address`
- `image_url`
- `location`
- `radius_meters`
- `is_active`

The `location` column uses the PostGIS type `GEOGRAPHY(POINT, 4326)`.

The `radius_meters` column defines the distance around an attraction within which a player can interact with the mission.

### 3.3. `ordine_obiective_traseu`

Connects thematic routes with tourist attractions and defines their order.

**Composite Primary Key:**

- `route_id`
- `objective_id`

**Foreign Keys:**

- `route_id` -> `trasee_tematice.route_id`
- `objective_id` -> `obiective_turistice.objective_id`

Important column:

- `sequence_number`

### 3.4. `misiuni`

Stores missions associated with tourist attractions.

**Primary Key:** `mission_id`

**Foreign Key:**

- `objective_id` -> `obiective_turistice.objective_id`

Important columns:

- `title`
- `description`
- `points_reward`
- `is_active`

Each tourist attraction has an associated mission.

The current mission reward is 40 points per correctly completed mission.

### 3.5. `indicii`

Stores clues associated with missions.

**Primary Key:** `clue_id`

**Foreign Key:**

- `mission_id` -> `misiuni.mission_id`

Important columns:

- `clue_text`
- `clue_order`

The `clue_order` column determines the order in which clues are presented to the player.

### 3.6. `raspunsuri_corecte`

Stores accepted answers for missions.

**Primary Key:** `solution_id`

**Foreign Key:**

- `mission_id` -> `misiuni.mission_id`

Important column:

- `accepted_answer`

Accepted answers must be validated by the backend and must never be exposed directly to the frontend.

### 3.7. `jucatori`

Stores player accounts and profile information.

**Primary Key:** `player_id`

Important columns:

- `username`
- `email`
- `password_hash`
- `total_points`
- `created_at`
- `avatar_id`

The `avatar_id` column identifies the avatar selected by the player. Its CHECK constraint allows values from 1 to 4.

The `total_points` column stores the player's accumulated points. New players should start with 0 points, using a database default value of 0.

Passwords must never be stored in plain text. The backend must generate and verify password hashes using a secure algorithm such as Argon2id or bcrypt.

### 3.8. `progres_jucatori_trasee`

Stores player progress on thematic routes.

**Composite Primary Key:**

- `player_id`
- `route_id`

**Foreign Keys:**

- `player_id` -> `jucatori.player_id`
- `route_id` -> `trasee_tematice.route_id`

Important columns:

- `status`
- `started_at`
- `completed_at`

### 3.9. `progres_jucatori_misiuni`

Stores player progress for individual missions.

**Composite Primary Key:**

- `player_id`
- `mission_id`

**Foreign Keys:**

- `player_id` -> `jucatori.player_id`
- `mission_id` -> `misiuni.mission_id`

Important columns:

- `status`
- `started_at`
- `completed_at`
- `points_awarded`

The `points_awarded` column records the points awarded to the player for completing a mission.

### 3.10. `raspunsuri_trimise`

Stores answers submitted by players.

**Primary Key:** `attempt_id`

**Composite Foreign Key:**

- `(player_id, mission_id)` -> `progres_jucatori_misiuni(player_id, mission_id)`

Important columns:

- `answer_text`
- `is_correct`
- `submitted_at`

This table maintains the history of submitted answers and their validation results.

### 3.11. `recompense_disponibile`

Stores the rewards that players can claim.

**Primary Key:** `reward_id`

Important columns:

- `name`
- `description`
- `points_cost`
- `quantity_available`
- `is_active`

The `quantity_available` column represents the available stock. A NULL value can represent unlimited stock.

### 3.12. `recompense_revendicate`

Stores rewards claimed by players.

**Primary Key:** `claim_id`

**Foreign Keys:**

- `player_id` -> `jucatori.player_id`
- `reward_id` -> `recompense_disponibile.reward_id`

Important columns:

- `points_spent`
- `claimed_at`
- `qr_code`
- `status`
- `redeemed_at`

The QR code is generated for a reward claim and is used to identify the claim during redemption.

The `qr_code` column must contain a unique token.

The `status` column represents the redemption state:

- `pending` - the reward has been claimed but not yet redeemed.
- `redeemed` - the reward has been successfully redeemed.
- `expired` - the reward is no longer valid.

The `redeemed_at` column stores the date and time when the reward was redeemed.

A QR code must be valid for a single redemption only.

### 3.13. `insigne_disponibile`

Stores the badges available in the application.

**Primary Key:** `badge_id`

The table defines the badges that players can earn.

### 3.14. `insigne_jucatori`

Connects players with the badges they have earned.

**Composite Primary Key:**

- `player_id`
- `badge_id`

**Foreign Keys:**

- `player_id` -> `jucatori.player_id`
- `badge_id` -> `insigne_disponibile.badge_id`

### 3.15. `clase_jucatori`

Stores the player classes defined in the application.

**Primary Key:** `class_id`

Important columns:

- `class_name`
- `description`

The table currently exists independently and has no direct relationship with `jucatori`.

## 4. Thematic Routes

The database currently defines two thematic routes, containing 11 tourist attractions and 11 associated missions.

### 4.1. Descopera Aradul

**Route ID:** 1  
**Number of objectives:** 6  
**Number of missions:** 6  
**Potential mission points:** 240

| Order | Tourist attraction | Objective ID | Mission ID |
|---:|---|---:|---:|
| 1 | Primaria Arad | 1 | 1 |
| 2 | Biserica Rosie | 3 | 3 |
| 3 | Colegiul National Moise Nicoara | 7 | 4 |
| 4 | Teatrul Clasic Ioan Slavici | 2 | 2 |
| 5 | Filarmonica | 8 | 5 |
| 6 | Vechiul Cazinou | 9 | 6 |

### 4.2. Traseul in natura

**Route ID:** 3  
**Number of objectives:** 5  
**Number of missions:** 5  
**Potential mission points:** 200

| Order | Tourist attraction | Objective ID | Mission ID |
|---:|---|---:|---:|
| 1 | Parcul Micalaca - Zona 300 | 10 | 7 |
| 2 | Parcul Europa | 11 | 8 |
| 3 | Parcul de la Podgoria | 12 | 9 |
| 4 | Parcul Copiilor | 13 | 10 |
| 5 | Faleza Muresului - zona Gloria | 14 | 11 |

Each tourist attraction has an associated mission with an accepted answer validated by the backend.

The order of attractions is stored in `ordine_obiective_traseu` through the `sequence_number` column.

The maximum potential score is calculated from the mission rewards. Each of the 11 missions currently awards 40 points.

## 5. Relationships Between Tables

### One-to-Many Relationships (1:N)

- `obiective_turistice` -> `misiuni`
- `misiuni` -> `indicii`
- `misiuni` -> `raspunsuri_corecte`

### Many-to-Many Relationships (M:N)

- `trasee_tematice` <-> `obiective_turistice`, through `ordine_obiective_traseu`.
- `jucatori` <-> `trasee_tematice`, through `progres_jucatori_trasee`.
- `jucatori` <-> `misiuni`, through `progres_jucatori_misiuni`.
- `jucatori` <-> `insigne_disponibile`, through `insigne_jucatori`.

### Other Relationships

- `progres_jucatori_misiuni` -> `raspunsuri_trimise`
- `jucatori` -> `recompense_revendicate`
- `recompense_disponibile` -> `recompense_revendicate`

The `clase_jucatori` table currently has no direct relationship with `jucatori`.

## 6. Primary Keys, Foreign Keys and Constraints

The database uses:

- Primary keys
- Composite primary keys
- Foreign keys
- UNIQUE constraints
- CHECK constraints
- NOT NULL constraints

### 6.1. UNIQUE Constraints

The database includes uniqueness rules for:

- `clase_jucatori.class_name`
- `jucatori.username`
- `jucatori.email`
- `indicii(mission_id, clue_order)`
- `insigne_disponibile.name`
- `ordine_obiective_traseu(route_id, sequence_number)`
- `recompense_revendicate.qr_code`

### 6.2. CHECK Constraints

The database includes validation rules for:

- `jucatori.total_points >= 0`
- `jucatori.avatar_id` between 1 and 4
- `misiuni.points_reward >= 0`
- `progres_jucatori_misiuni.points_awarded >= 0`
- `progres_jucatori_misiuni.status` limited to `in_progress` or `completed`
- Completed mission progress must have a non-NULL `completed_at`
- `progres_jucatori_trasee.status` limited to `in_progress` or `completed`
- `recompense_disponibile.points_cost >= 0`
- `recompense_disponibile.quantity_available` must be NULL or greater than or equal to 0
- `recompense_revendicate.points_spent >= 0`
- `trasee_tematice.difficulty` limited to `easy`, `medium` or `hard`

The reward claim status should be restricted to `pending`, `redeemed` or `expired`.

### 6.3. Required Columns (NOT NULL)

Required columns include:

- `jucatori`: `total_points`, `created_at`, `avatar_id`
- `misiuni`: `objective_id`, `title`, `points_reward`, `is_active`
- `obiective_turistice`: `name`, `location`, `radius_meters`, `is_active`
- `trasee_tematice`: `title`, `difficulty`, `is_active`
- `progres_jucatori_misiuni`: `status`, `started_at`, `points_awarded`
- `progres_jucatori_trasee`: `status`, `started_at`
- `raspunsuri_trimise`: `submitted_at`
- `recompense_disponibile`: `name`, `points_cost`, `is_active`
- `recompense_revendicate`: `claimed_at`, `status`

Optional columns may accept NULL values according to their table definitions.

## 7. PostGIS and GPS Coordinates

PostGIS is a PostgreSQL extension used to store and process geographical information.

The `obiective_turistice` table contains:

`location GEOGRAPHY(POINT, 4326)`

This column stores the geographical position of each tourist attraction.

The spatial reference system is SRID 4326 (WGS 84).

Coordinates can be extracted using:

- `ST_X()` for longitude.
- `ST_Y()` for latitude.

Coordinates must be inserted using:

`ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`

Longitude must be supplied first, followed by latitude.

The `radius_meters` column defines the permitted distance around an attraction for location-based interactions.

The configured radius for the 11 tourist attractions is 50 meters.

The backend must verify whether the player's GPS position is within the configured radius before validating the mission answer.

GPS coordinates must be verified before the application is used in production.

## 8. Backend Implementation Rules

The Python backend communicates with PostgreSQL and uses SQL queries to retrieve and modify application data.

Important implementation rules:

1. Passwords must be hashed using Argon2id or bcrypt.
2. Passwords must never be stored in plain text.
3. Accepted mission answers must be validated in the backend.
4. Accepted answers must never be exposed to the frontend.
5. GPS distance must be validated before checking the submitted answer.
6. Mission points must be awarded only once for each completed mission.
7. Mission completion and point updates must use database transactions.
8. Reward claims must verify that the player has sufficient points and that the reward is available.
9. Reward claims must update the player's points and reward stock within a single transaction.
10. User input must be passed through parameterized SQL queries.
11. GPS coordinates must use the correct order: longitude followed by latitude.
12. The GPS radius must be read from `radius_meters`, rather than duplicated as a hardcoded value in the backend.
13. QR tokens must be generated securely by the backend.
14. QR redemption must be validated by the backend.
15. A reward claim must be redeemable only once.
16. Reward redemption must update the claim status and redemption timestamp atomically.

## 9. QR Reward Redemption Workflow

The reward redemption process uses the `recompense_revendicate` table.

The expected workflow is:

1. The player selects an available reward.
2. The backend checks the player's available points.
3. The backend checks the reward stock.
4. The backend creates a reward claim.
5. A unique QR token is generated and stored in `qr_code`.
6. The claim receives the initial status `pending`.
7. The frontend displays the QR code to the player.
8. An authorized administrator scans the QR code.
9. The backend validates the token and checks that the status is `pending`.
10. The backend changes the status to `redeemed` and records `redeemed_at`.

A redeemed QR code must not be accepted again.

The backend must perform reward claiming and redemption using transactions to prevent duplicate claims, incorrect point deductions or multiple redemptions.

## 10. Current Database Data

The database currently contains:

| Element | Count |
|---|---:|
| Functional application tables | 15 |
| Thematic routes | 2 |
| Tourist attractions | 11 |
| Associated missions | 11 |
| Objectives in Descopera Aradul | 6 |
| Objectives in Traseul in natura | 5 |
| Points per mission | 40 |
| Maximum points in Descopera Aradul | 240 |
| Maximum points in Traseul in natura | 200 |
| Maximum points across both routes | 440 |

The database also contains data for testing player accounts, progress, badges and rewards.

Demonstration data is intended for development and testing.

## 11. SQL Test Queries

The file `03_test_queries.sql` contains queries used to verify database functionality.

These queries cover:

- Player profiles
- Tourist attractions and GPS coordinates
- Thematic routes
- Missions and clues
- Player progress
- Earned badges
- Available rewards
- Reward claims and QR status
- Player leaderboard
- Submitted answer history

## 12. Database Files

The `database` directory contains:

- `01_create_tables.sql` - creates the database tables, relationships and constraints.
- `02_insert_data.sql` - inserts initial application and demonstration data.
- `03_test_queries.sql` - contains SQL queries used to test the database.
- `04_database_documentation.md` - documents the database structure and implementation rules.
- `05_user_settings.sql` - contains user settings-related database changes, if applicable.

## 13. Database Validation

The database structure should be validated after creation or restoration.

Validation includes:

- Confirming the existence of all 15 functional application tables.
- Checking primary and foreign keys.
- Checking table relationships.
- Checking UNIQUE constraints.
- Checking CHECK constraints.
- Checking NOT NULL requirements.
- Checking the PostGIS extension.
- Checking the geographical type of `location`.
- Checking the configured GPS radius.
- Checking the two thematic routes and their associated missions.
- Checking the reward QR columns and status values.
- Checking the default value for `jucatori.total_points`.

The `spatial_ref_sys` table is created and managed by PostGIS. It is an extension system table and is not included in the 15 functional application tables.

## 14. Future Development

The following features require further implementation or integration:

- Individual player progress management.
- Sequential unlocking of objectives after mission completion.
- Randomized objective order for each player.
- Persisting the generated order when a player returns to the application.
- QR-based reward redemption integration.
- Management of images associated with tourist attractions.
- Administrative reward redemption interface.

These features require coordination between the database, backend and frontend.

## 15. Conclusion

The Arad Quest database is designed to manage thematic routes, tourist attractions, missions, players, progress, badges and rewards.

PostgreSQL provides relational data storage and management, while PostGIS enables geographical functionality based on GPS coordinates.

The current database structure includes 15 functional application tables, two thematic routes, 11 tourist attractions and 11 associated missions.

The reward management structure also supports QR-based redemption with unique tokens and redemption statuses.

The database is the central data component of the Arad Quest application.
