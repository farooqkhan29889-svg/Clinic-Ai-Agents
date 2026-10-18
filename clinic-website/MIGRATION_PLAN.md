# Migration plan — Flask vs Streamlit on the host

Decision to make first: **this app may not need a migration at all.** The only confirmed
problem is that the host starts its own Uvicorn on `:8501` while `app.py` is a WSGI/Flask
app. That is a launch-configuration mismatch, not an architecture failure.

Current verified state (so the plan is not guesswork):

| Fact | Evidence |
|---|---|
| 22 routes in `app.py`, 8 of them JSON under `/api/*` | `grep ^@app` → lines 97-304 |
| 7 Jinja templates, incl. `doctor/login`, `doctor/dashboard`, `doctor/patient` | `templates/**` |
| Frontend is a thin JS connector against `/api/*` | `static/js/app.js`, 266 lines |
| Business rules live **outside** Flask | `database.book_appointment()`, `chatbot.chat_reply()`, `reminders.process_due_reminders()` |
| 43 stdlib tests pass (9.1 s) and import `app.py` | `python -m unittest test_clinic.py` |
| Host log: `Uvicorn server started on :::8501`, then `Address already in use` | user's pasted log |
| `uvicorn / a2wsgi / waitress / streamlit` are **not installed** in `.venv` | `find_spec` → `[]` |

---

## The three options, ranked by cost

### Option A — Keep Flask, fix the start command (do this first)
Cost: ~5 minutes, **zero code changes.**

**STATUS 2026-10-18: not taken.** It was the recommended fix, then C was chosen and the
Flask app was deleted, so `python app.py` no longer exists.

Host start command:

```
sh -c "HOST=0.0.0.0 PORT=$PORT python app.py"
```

Env to set on the host: `SECRET_KEY` (any long random string), `SESSION_COOKIE_SECURE=1`
only if the site is served over HTTPS, `SHOW_DEMO_HINT=0`.

Verify: `/` returns 200, `/doctor` logs in, `POST /api/book` returns a `CC######` ID,
`/api/chat` books.

Kills itself if the host refuses to let the command bind its own port — that is when A
fails and B becomes necessary.

### Option B — Keep Flask, serve it through ASGI (the shim)
Cost: ~30 minutes, **one new ~10-line file + 2 dependencies.** Existing 43 tests keep
passing because nothing in `app.py`'s routes changes.

Add `asgi_app.py`:

```python
"""ASGI entrypoint for hosts that insist on running Uvicorn themselves."""
from a2wsgi import WSGIMiddleware
from app import app, start_reminder_thread

start_reminder_thread()
app_ = WSGIMiddleware(app)      # uvicorn asgi_app:app_
```

`requirements.txt` gains `a2wsgi` and `uvicorn`. Start command becomes
`uvicorn asgi_app:app_ --host 0.0.0.0 --port $PORT`.

Two things to check while doing it: the reminder thread must start exactly once, and
static files must still be served (WsgiMiddleware does serve them via Flask, so no
extra mount is needed).

**A or B is the answer for "get it live today".** Both keep the design, the API and the tests.

**STATUS 2026-10-18: superseded by C, and then removed.** `asgi_app.py` was built and
verified live, but once the site moved to Streamlit the shim had nothing to wrap, so it
and `app.py` are deleted. `a2wsgi`/`uvicorn` are gone from `requirements.txt`.

### Option C — Port the UI to Streamlit
**STATUS 2026-10-18: DONE, and the Flask front end is deleted.** `streamlit_app.py`,
`.streamlit/config.toml` and `test_streamlit_app.py` are in place; 13 UI tests pass on
top of the 35 data-layer/chatbot/reminder tests that survived. `app.py`, `asgi_app.py`,
`templates/` and `static/` are gone, so `/api/*` and the signed-cookie login no longer
exist. One dependency change came with that: `database.py` and `set_password.py` import
`werkzeug.security`, which Flask used to pull in transitively, so Werkzeug is now listed
explicitly in `requirements.txt`. Note that Streamlit 1.66 runs Uvicorn itself and logs
`Uvicorn server started on :::8501` - the exact line from the host that raised this.

Cost: 2-4 days of real work, and it **deletes** things that currently work.

| Asset | What happens in C |
|---|---|
| `database.py`, `chatbot.py`, `reminders.py`, `seed_demo.py`, `set_password.py` | **Survive unchanged** — pure Python, no Flask imports |
| `templates/*.html` (7 files) | All rewritten as `st.*` calls; the CSS design in `static/css/style.css` is lost or re-added through `st.markdown` hacks |
| `static/js/app.js` (266 lines) | Deleted — Streamlit has no client JS layer |
| `/api/*` (8 endpoints) | Deleted, or kept only as a second app. Anything outside the site that calls them breaks |
| Doctor login (`session["doctor_id"]` cookie) | Rebuilt on `st.session_state`; no HttpOnly/SameSite/Secure cookies, so `SESSION_COOKIE_*` work is void |
| Chat multi-step flow + button actions | Re-implemented with `st.chat_message` / `st.button` and manual `session_state` — the `__doc__1` / `__date__0` action protocol goes away |
| Dashboard filters + pagination | Rebuilt with `st.selectbox` / `st.dataframe`; the `&amp;page=` URL semantics disappear |
| `test_clinic.py` — 43 tests | ~25 view-layer tests become invalid on day 1; the `database`/`chatbot`/`reminders` ones survive |
| Continuous re-runs | Streamlit re-executes the whole script per interaction — the background reminder thread must move to a cron/`python reminders.py`, since a sleeping script cannot sweep |

Reason anyone would still choose C: the host *only* accepts a Streamlit entrypoint and
`Streamlit is listening on port 8501` is truly non-negotiable. That has not been proven yet.

---

## Execution order I recommend

**As executed (2026-10-18):** 1 and 2 were built and verified, then the site went to C
and the Flask layer was deleted, so steps 1-3 below are now history.

1. Confirm the host name, then try **Option A** exactly as written above. One deploy.
2. If A cannot bind: **Option B**. One deploy. Ship it.
3. Only if A and B are both rejected by the platform: **Option C**, and then in stages —
   doctor dashboard first (it is the least interactive page), booking wizard second,
   chatbot last. Keep `/api/*` alive during the port so the tests still guard the move.
4. Independent of the choice, two real production blockers:
   - **SQLite on an ephemeral container is wiped on every redeploy.** Bookings, doctor
     passwords and chat state vanish. Needs either a mounted volume or Postgres
     (`database.py` isolates all SQL, so the change is contained to that one file).
   - **Demo credentials are still live**: `citycare<ID>123` and `seed_demo.py` data.
     Rotate before any real patient uses it.

## What I need from you to proceed
The host platform name (or its settings screenshot), and whether it lets you edit the
start command at all. Everything above is decided by that one fact.

---

# Fixing the storage problem (independent of A/B/C)

Verified coupling in `database.py`: 1 central `get_db()` (line 43-46), 18 call sites,
25 `execute()` calls, 44 `?` placeholders, and the DB path already reads
`CLINIC_DB` (line 15). That is why both fixes below are contained.

## Fix 1 — Mount a persistent disk (do this first; ~10 min, no code change)

1. On the host, add a volume / disk service and mount it at a fixed path
   (e.g. `/data`). Confirm the platform keeps it between deploys — that is the whole
   point; a "temporary disk" does not count.
2. Point the app at it. `database.py:15` already honors the env var, so nothing in the
   code changes:
   ```
   CLINIC_DB=/data/clinic.db
   ```
3. Deploy. `init_db()` runs on import and creates `doctors`, `bookings`, `chat_state`
   and the `ux_slot` partial unique index on the mounted file, then seeds the 6 doctors.
4. **Prove persistence with a redeploy, not a restart:**
   - `POST /api/book` → note the `CC######` ID;
   - trigger a full redeploy / rebuild (the case that was losing data);
   - `GET /doctor/dashboard` still shows that booking. If it survives a rebuild, the
     volume is real.
5. Constraints to accept with SQLite on a container:
   - **run exactly one replica.** More than one process on the same file is already
     handled (`claim_reminder` claims atomically, `timeout=10`), but **one replica per
     volume** — several containers sharing a network-mounted `clinic.db` will corrupt it,
     because network filesystems do not guarantee SQLite's file locks.
   - Keep `CLINIC_DB` on local block storage, never on an object-store FUSE mount.
6. Because patient names + phones now persist, add the two hygiene items:
   - back up the file on a schedule (`sqlite3 /data/clinic.db ".backup /backup/clinic.db"`,
     or the platform's snapshot feature);
   - note that this is personal health data under India's DPDP Act — the volume must not
     be exposed outside the app, and demo patients must be deleted before real ones arrive.

**Decision point:** Fix 1 is enough for one clinic on one container. Move to Fix 2 when
you need more than one replica, a managed backup, or the platform has no persistent disk.

## Fix 2 — Postgres (the real production move; ~half a day)

All SQL lives in `database.py`, so the change is one file plus a dependency.

1. Add the driver to `requirements.txt`: `psycopg2-binary` (or `psycopg[binary]`).
2. Provision a managed Postgres on the host and read its `DATABASE_URL`
   (`postgres://user:pass@host:5432/db`); open it with `sslmode=require`.
3. Switch the connection, keeping SQLite available for local dev and the test suite:
   ```python
   # database.py — DB_BACKEND=postgres uses the host URL, otherwise the current file
   ```
   `get_db()` must keep returning an object that supports `.execute(sql, params)`,
   `.fetchone()`, `.commit()`, and string-keyed rows — `DictCursor`/`dict_row` reproduces
   `sqlite3.Row`'s `row["name"]` access, so the 18 call sites need no edits.
4. Mechanical dialect changes, each with its exact count:
   | SQLite-only | Postgres replacement | sites |
   |---|---|---|
   | `?` placeholder | `%s` | 44 |
   | `datetime('now','localtime')` | `LOCALTIMESTAMP` (set `timezone` to `Asia/Kolkata`) | 5 |
   | `INTEGER PRIMARY KEY AUTOINCREMENT` | `INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY` | 1 |
   | `con.executescript(""" … """)` | run statements one by one | 1 |
   | `PRAGMA table_info(doctors)` | `information_schema.columns` | 1 |
   | `sqlite3.Row` | `RealDictCursor` | 1 |
   Good news: `ux_slot ON bookings(...) WHERE status <> 'Cancelled'` is a partial unique
   index and Postgres supports it verbatim — the double-booking guard transfers as-is.
5. Schema bootstrap: keep `init_db()` as the single source of truth (it is `IF NOT EXISTS`
   and idempotent), so no separate migration tool is needed yet. Add the `pass_hash`
   column check as an `information_schema` lookup instead of `PRAGMA`.
6. Data move: `clinic.db` currently has **0 bookings**, so migrate nothing — do this
   before real patients exist. If there were data, a ~30-line script that reads
   `SELECT * FROM doctors/bookings` from SQLite and inserts with `%s` placeholders.
7. Rotate the doctor passwords after the move (`python set_password.py <id> <new>`),
   since the hashes were generated on the old file.
8. Test impact: `test_clinic.py` patches `database.DB` (lines 26-27, 44) to a temp file
   per test. Leave the suite on SQLite (`DB_BACKEND` unset) — it keeps running in 9 s and
   still guards `book_appointment`. Add one parity test that asserts `init_db()` succeeds
   against Postgres when `DATABASE_URL` is present, skipped otherwise.
9. Verify live: the same redeploy test as Fix 1 step 4, plus
   `POST /api/reminders/run` returns `{"sent": {...}}`, and two workers still reject a
   duplicate slot with `409` (the index, not the code, enforces it).

**Order I recommend:** Option A → Fix 1 → then decide on Fix 2 / Option B. Fix 1 and
Option A are both minutes; nothing has to be rewritten to get real data sitting safely.
