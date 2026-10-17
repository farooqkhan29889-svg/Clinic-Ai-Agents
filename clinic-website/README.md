# CityCare Clinic - appointment booking system (Python + Flask)

A professional clinic website where ALL logic is written in Python:
booking, database, AI chatbot and WhatsApp/SMS reminders.

## Run it
    pip install -r requirements.txt
    python app.py
Open http://127.0.0.1:5000

Add demo appointments (optional): `python seed_demo.py`

## The Python files (this is where you work)
| File | What it does |
|---|---|
| app.py | Flask server: web pages + JSON API |
| database.py | SQLite layer + ALL booking rules (`book_appointment`) |
| chatbot.py | AI assistant brain: intents + booking and cancellation conversations |
| reminders.py | WhatsApp + SMS sender and the due-reminder sweep |
| set_password.py | Give each doctor a real password |
| seed_demo.py | Demo appointments for the doctor dashboard |
| test_clinic.py | Test suite (`python -m unittest test_clinic`) |

## The view layer (fixed design, rarely edited)
| File | What it does |
|---|---|
| templates/*.html | Page designs (Jinja templates served by Flask) |
| static/css/style.css | All styling |
| static/js/app.js | Thin connector: sends clicks to Python, draws replies |

## API
| Endpoint | Who | Notes |
|---|---|---|
| `GET /api/doctors` | public | no password hashes are ever returned |
| `GET /api/availability?doctor_id=&date=` | public | the slots that are genuinely still free |
| `POST /api/book` | public | returns `409` when the slot just got taken |
| `POST /api/chat` | public | chatbot, uses the same validated booking path |
| `GET /api/bookings?view=mine\|all&limit=&offset=` | doctor login | patient data is never public; `limit` max 200 |
| `POST /api/booking/status` | doctor login | only the treating doctor may change a booking |
| `POST /api/reminders/run` | doctor login | manual/cron trigger for the reminder sweep |

Errors from `/api/*` are always JSON (`{"ok": false, "error": "..."}`), so the UI
can show them instead of dying on an HTML page.

## Tests
    python -m unittest -v test_clinic
No pytest needed. Each test builds its own temporary SQLite file, so `clinic.db`
is never touched, and messages run in demo mode with the output swallowed.

## Booking rules (enforced in `database.book_appointment`)
- One active booking per doctor + date + time (unique index in SQLite). A
  cancelled slot frees up again.
- Date must be today or later; the time must be one the doctor actually offers.
- Patient name (letters) and a 10-digit Indian mobile are required; email optional.
- Booking IDs are `CC` + 6 random digits, re-drawn if one already exists.
- The wizard and the chatbot both go through this one function - no bypassing it.
- Chat conversations (an unfinished booking) are stored in the `chat_state` table,
  so they survive a restart and work across workers. Entries expire after 2 hours.

## Doctor panel
- `/doctor` - login. **Demo password per doctor: `citycare<doctor id>123`**
  (doctor 1 = `citycare1123`). Passwords are stored hashed in `clinic.db`.
- Change one: `python set_password.py <doctor_id> <new password>`
  (or `python set_password.py list` to see ids)
- `/doctor/dashboard` - filter by date / status, "My patients" vs "All doctors".
  25 rows per page (`PER_PAGE` in app.py) with Prev/Next links that keep the
  active filters; the header always reports the full count for the view.
- `/doctor/patient/<booking_id>` - patient details. Other doctors' patients are
  visible in "All doctors" but **read-only**; only the treating doctor can mark
  Completed / Cancelled. Status changes notify the patient on WhatsApp + SMS.
- The chatbot can cancel too, but only after the caller types the booking ID
  *and* the 10-digit mobile on that booking.

## Reminders
`reminders.process_due_reminders()` sends the 24h and 2h nudges and marks them
sent so they never double-fire:
- local run: `python app.py` starts a background sweep every `REMINDER_MINUTES`
  (default 10). Turn it off with `ENABLE_REMINDERS=0`.
- hosted: run `python reminders.py` on a cron, or `POST /api/reminders/run`.

## Environment variables
| Var | Default | Purpose |
|---|---|---|
| `SECRET_KEY` | dev key + warning | **required in production** - signs the session cookie |
| `FLASK_DEBUG` | off | `1` enables the debugger. Never leave on in production |
| `ENABLE_REMINDERS` | `1` | `0` disables the background sweep |
| `REMINDER_MINUTES` | `10` | sweep interval |
| `SHOW_DEMO_HINT` | `1` | `0` hides the demo password hint on the login page |
| `CLINIC_DB` | `./clinic.db` | alternate SQLite file (used by the tests) |
| `PORT` / `HOST` | `5000` / `127.0.0.1` | bind address for `python app.py`; a host sets `PORT` and needs `HOST=0.0.0.0` |
| `TWILIO_SID` / `TWILIO_TOKEN` / `TWILIO_FROM` / `WHATSAPP_FROM` | - | real messaging |

`clinic.db` is git-ignored - never commit the real patient data. `.env`,
`.venv/` and caches are ignored too.

## Go live
1. Real WhatsApp/SMS: `pip install twilio`, set the four Twilio env vars above -
   reminders.py then sends for real (send failures are logged, not fatal).
2. Real LLM chatbot: replace the intents in chatbot.py with an OpenAI/Claude/Ollama call.
3. Deploy: Railway / Render / Fly / PythonAnywhere - `init_db()` runs on import, so
   the tables exist before the first request. Set `SECRET_KEY`, keep `FLASK_DEBUG` off.
   Serve it on the port the host gives you, bound to all interfaces, and run only
   ONE server - two processes cannot share a port:
   - `HOST=0.0.0.0 PORT=$PORT python app.py` (dev server - fine for a demo)
   - `waitress-serve --listen=0.0.0.0:$PORT app:app` (production WSGI, no debugger)
   - A host that insists on **uvicorn/ASGI** cannot serve Flask directly - either
     change its start command to one of the above, or wrap the app
     (`a2wsgi.WsgiMiddleware(app)`), do not start Flask alongside it.
   Note: an ephemeral container wipes `clinic.db` on restart, so bookings do not
   survive redeploys there - attach a volume or move to Postgres.

## Still open (not security-critical)
- SQLite is fine for one clinic; a hosted Postgres/MySQL is the next step
  (`CLINIC_DB` is the only place that knows the file).
- The chatbot is rule-based, not an LLM - see the note in chatbot.py.
- The reminder sweep runs inside the web process; on several hosts use the cron
  form (`python reminders.py`) so only one machine sends.
- Demo passwords and `seed_demo.py` rows must be removed before real patients
  use the site.
