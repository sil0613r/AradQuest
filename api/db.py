"""PostgreSQL connection pool shared by the API."""
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

import settings

# Rows come back as dicts, e.g. row["username"]. The pool is opened in main.py's lifespan.
pool = ConnectionPool(
    conninfo=settings.DATABASE_URL,
    min_size=1,
    max_size=5,
    open=False,
    kwargs={"row_factory": dict_row},
)
