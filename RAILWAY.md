# Deploying ARAD QUEST on Railway

One Railway project, four services. Every service builds from a Dockerfile that is already in this repo.

| Service name | Root directory | Dockerfile | Public domain | What it is |
|---|---|---|---|---|
| `PostGIS` | (none, template) | (none, template) | no (TCP proxy only for the one-time setup) | PostgreSQL 17 + PostGIS 3.5 |
| `api` | `api` | `api/Dockerfile` | no, private only | Game API: login, avatar, settings, answer check |
| `web` | `frontend` | `frontend/Dockerfile` | **yes** (players open this) | React site + nginx, forwards `/api/` to `api` |
| `bot` | `ai_bot/backend` | `ai_bot/backend/Dockerfile` | **yes** (the browser calls it) | Quest Assistant chatbot |

The names matter: the variable references below (`${{PostGIS.DATABASE_URL}}`, `${{api.RAILWAY_PRIVATE_DOMAIN}}`) use these exact service names.

Railway sets `PORT` on every service by itself. Do not set `PORT` yourself.

---

## 1. Create the database (PostGIS)

The schema uses `GEOGRAPHY` columns and `ST_Distance`, so the database must have PostGIS. A standard Railway Postgres service does not include it.

1. In the project, click **New → Database → Add from template**, or open <https://railway.com/deploy/postgis-postgres> (**Deploy PostGIS**).
   It runs the same image as the local stack (`postgis/postgis:17-3.5`).
2. Rename the service to `PostGIS`.
3. Check that the service is running. Its `DATABASE_URL` is what the API will use.

## 2. Create the tables and seed data (run once, safe to repeat)

Railway does not run the SQL files for you. Only the local `docker-compose` does, and only on an empty volume. Run them yourself, in this order:

1. On the `PostGIS` service, go to **Settings → Networking → TCP Proxy** and add port `5432`. Copy the value of `DATABASE_PUBLIC_URL` from the **Variables** tab.
2. From the repo root, on your machine (needs `psql`):

```bash
export DATABASE_PUBLIC_URL="postgresql://...paste from Railway..."
psql "$DATABASE_PUBLIC_URL" -v ON_ERROR_STOP=1 -f database/01_create_tables.sql
psql "$DATABASE_PUBLIC_URL" -v ON_ERROR_STOP=1 -f database/02_insert_data.sql
psql "$DATABASE_PUBLIC_URL" -v ON_ERROR_STOP=1 -f database/05_user_settings.sql
```

3. Turn the TCP proxy off again once the scripts have run. The API reaches the database over the private network, so it does not need the proxy.

To run the same scripts from the repo with `scripts/local.sh`, put the public URL in `api/secrets.env` as `DATABASE_URL` (see section 7).

All three scripts can be run again on a database that already has the data:

- `01` creates the PostGIS extension and each table only if it is missing.
- `02` inserts each row only if it is not already there.
- `05` creates `setari_jucatori` only if it is missing.

Running them again does not duplicate data or change rows that already exist.

## 3. Create the services

For each of `api`, `web`, and `bot`:

1. **New → GitHub Repo** (or **Empty Service**) and select this repository and branch `dev-deployment`.
2. **Settings → Source → Root Directory**: set the value from the table above.
3. Railway detects the Dockerfile in that directory. Leave the builder on **Dockerfile**.
4. **Watch Paths** (in the service's build settings; the menu name can vary by Railway version). Set one value per service so a push only redeploys what changed:

| Service | Watch Paths |
|---|---|
| `api` | `/api/**` |
| `web` | `/frontend/**` |
| `bot` | `/ai_bot/backend/**` |

5. Turn on **Wait for CI** if the option is shown, so Railway waits for the GitHub checks before deploying.

## 4. Generate the public domains

On `web` and `bot`: **Settings → Networking → Generate Domain**. You get addresses like `https://web-production-xxxx.up.railway.app`. Write them down. Each service reads them from the other, so generate both before setting the variables.

## 5. Set the variables

Set these in the **Variables** tab of each service. Replace the placeholders in `<...>`.

### `api`

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `${{PostGIS.DATABASE_URL}}` | Reference to the database. Do not paste a password here. |
| `SESSION_SECRET` | a long random string | Generate one: `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `ALLOWED_ORIGINS` | `https://<web-domain>` | The frontend URL. No trailing slash. |
| `COOKIE_SECURE` | `true` | Railway serves HTTPS, so the login cookie must be marked secure. |

### `web` (frontend)

| Variable | Value | Notes |
|---|---|---|
| `API_UPSTREAM` | `http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}}` | Private network address of `api`. nginx forwards `/api/` here. No trailing slash. |
| `VITE_CHATBOT_API_URL` | `https://<bot-domain>/api/bot` | **Build argument.** The value is built into the JavaScript. Redeploy `web` after you change it. |

`VITE_API_URL` is fixed to `/api` in the Dockerfile. Do not set it.

### `bot` (ai_bot/backend)

| Variable | Value | Notes |
|---|---|---|
| `OPENAI_API_KEY` | `sk-...` | Secret. Only set it in Railway, never in the repo. |
| `ALLOWED_ORIGINS` | `https://<web-domain>` | The frontend URL. No trailing slash. |

Keep `bot` at **one replica**. Chat sessions are kept in memory.

### Quick reference (all values in one place)

```
api:  DATABASE_URL=${{PostGIS.DATABASE_URL}}
api:  SESSION_SECRET=<generated>
api:  ALLOWED_ORIGINS=https://<web-domain>
api:  COOKIE_SECURE=true

web:  API_UPSTREAM=http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}}
web:  VITE_CHATBOT_API_URL=https://<bot-domain>/api/bot   (build arg)

bot:  OPENAI_API_KEY=<your key>
bot:  ALLOWED_ORIGINS=https://<web-domain>
```

## 6. Deploy and check

Deploy `api`, then `bot`, then `web`. The `web` service needs `api` to be running, because nginx looks up `api` when it starts. If `web` crashes with `host not found in upstream`, redeploy `web` after `api` is up.

Checks, in order:

| Check | URL | Expected |
|---|---|---|
| Bot is up | `https://<bot-domain>/health` | `200` with a JSON body |
| API reaches the database | `https://<web-domain>/api/health/db` | `200` |
| Site loads | `https://<web-domain>/` | the home page |
| Session path works | `https://<web-domain>/api/progress` | `401` with "Not logged in" (this is correct without a login) |

Then open the site, register an account, pick an avatar, and submit one answer. Check that the account still exists after you reload the page.

## Redeploying after a change

- Changed a `VITE_*` value (`VITE_CHATBOT_API_URL`)? Redeploy `web`. These values are fixed at build time.
- Changed a domain? Update `ALLOWED_ORIGINS` on `api` and `bot`, and `VITE_CHATBOT_API_URL` on `web`, then redeploy all three.
- Changed only a runtime variable (`ALLOWED_ORIGINS`, `COOKIE_SECURE`, `OPENAI_API_KEY`)? Redeploying that service is enough.

## Things that are not in the repo on purpose

- `.env` and `secrets.env` files: excluded from the images by each `.dockerignore`. Railway variables replace them.
- `api/backend_main.py`: the teammate's standalone server, excluded from the API image.
- `database/.env.remote`: old values, not used by Railway.

## 7. Run the app on your computer with the Railway database

The local app uses the same Railway database, so no PostgreSQL container runs on your computer.

1. On the `PostGIS` service, add the TCP proxy (step 2.1) and copy `DATABASE_PUBLIC_URL` from the **Variables** tab.
2. Put it in `api/secrets.env`: `DATABASE_URL=postgresql://...` (the file is not committed).
3. From the repo root: `scripts/local.sh up`. It applies the three SQL scripts to that database (safe to repeat), starts `api`, `bot` and `web`, and prints the addresses. `scripts/local.sh test` runs the full checks against the same database, so test accounts are created there.

The local database container is still in `docker/docker-compose.yml` under the profile `local-db`, for an offline setup. `scripts/local.sh` does not use it.

## Local run (for comparison)

`scripts/local.sh up` is the usual way. Without the script: `docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --build`, then open `http://localhost:8080`. The settings are in `docker/.env` and the `.env` and `secrets.env` files next to each service.
