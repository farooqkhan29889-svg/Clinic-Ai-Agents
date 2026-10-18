# CityCare Clinic - appointment booking system (Python + Streamlit)

A professional clinic website where ALL logic is written in Python:
booking, database, AI chatbot and WhatsApp/SMS reminders.

## Run it
    pip install -r requirements.txt
    streamlit run streamlit_app.py
Open http://localhost:8501

Add demo appointments (optional): `python seed_demo.py`

## The Python files (this is where you work)
| File | What it does |
|---|---|
| streamlit_app.py | the whole site: booking wizard, doctors, chat assistant, doctor panel |
| database.py | SQLite layer + ALL booking rules (`book_appointment`) |
| chatbot.py | AI assistant brain: intents + booking and cancellation conversations |
| reminders.py | WhatsApp + SMS sender and the due-reminder sweep |
| set_password.py | Give each doctor a real password |
| seed_demo.py | Demo appointments for the doctor dashboard |
| test_clinic.py | Tests for the data layer, chatbot and reminders |
| test_streamlit_app.py | Tests that drive the UI widgets |

`.streamlit/config.toml` carries the theme (teal `#0f766e`, radii, widget borders) and
`_CSS` at the top of `streamlit_app.py` carries the page styling (banner, status pills,
info chips, metric cards, sidebar nav). The old Flask/Jinja front end (`app.py`,
`templates/`, `static/`) has been deleted - Streamlit is the
only UI, and it calls the Python functions directly instead of going through an
HTTP `/api` layer.

## Pages
| Sidebar page | What it does |
|---|---|
| Book appointment | doctor -> date -> free time -> name/mobile, then confirmation on WhatsApp + SMS |
| Doctors and fees | specialties, experience, fees, slots, clinic services |
| Chat assistant | the rule-based bot: answers clinic questions and can book or cancel |
| Doctor panel | login, dashboard, patient details, status changes, reminder sweep |

Every write goes through one validated function, so no UI can bypass the rules.

Login state lives in the server process (`st.session_state`), not in a signed
cookie, so run **one** Streamlit process - with several workers each one holds
its own sessions and a doctor can land on a worker that does not know them.
- Chat history in the window is per browser session; the unfinished-booking state
  itself is in SQLite (`chat_state`) and survives a restart.
- The chatbot's HTML replies are converted to markdown, and everything is escaped
  first, so a patient name cannot inject markup.

## Tests
    python -m unittest -v test_clinic test_streamlit_app
No pytest needed. Each test builds its own temporary SQLite file, so `clinic.db`
is never touched, and messages run in demo mode with the output swallowed.

`test_streamlit_app.py` drives the UI through `streamlit.testing.v1.AppTest`
(sets widgets, clicks, then checks what rendered and what reached the database):
booking wizard, taken-slot handling, the full chat conversation, doctor login, the
my-patients/all-doctors scope, read-only rows, status changes and dashboard paging.

## Booking rules (enforced in `database.book_appointment`)
- One active booking per doctor + date + time (unique index in SQLite). A
  cancelled slot frees up again.
- Date must be today or later; the time must be one the doctor actually offers.
- Patient name (letters) and a 10-digit Indian mobile are required; email optional.
- Booking IDs are `CC` + 6 random digits, re-drawn if one already exists.
- The wizard and the chatbot both go through this one function - no bypassing it.
- Chat conversations (an unfinished booking) are stored in the `chat_state` table,
  so they survive a restart. Entries expire after 2 hours.

## Doctor panel
- Login. **Demo password per doctor: `citycare<doctor id>123`**
  (doctor 1 = `citycare1123`). Passwords are stored hashed in `clinic.db`.
- Change one: `python set_password.py <doctor_id> <new password>`
  (or `python set_password.py list` to see ids)
- Dashboard: filter by date / status, "My patients" vs "All doctors". 25 rows per
  page (`PER_PAGE` in streamlit_app.py) with Prev/Next buttons that keep the
  active filters; the header always reports the full count for the view.
- Patient details: other doctors' patients are visible in "All doctors" but
  **read-only**; only the treating doctor can mark Completed / Cancelled.
  Status changes notify the patient on WhatsApp + SMS.
- The chatbot can cancel too, but only after the caller types the booking ID
  *and* the 10-digit mobile on that booking.

## Reminders
`reminders.process_due_reminders()` sends the 24h and 2h nudges and marks them
sent so they never double-fire:
- by hand: the sidebar "Send due reminders now" button.
- unattended: run `python reminders.py` on a cron every few minutes (the scheduler
  the host gives you). Streamlit re-runs the script on every click, so a sleeping
  background thread is not an option here.

## Environment variables
| Var | Default | Purpose |
|---|---|---|
| `CLINIC_DB` | `./clinic.db` | SQLite file - **set this to a mounted volume path** when hosting, or a redeploy wipes every booking (the tests also use it) |
| `SHOW_DEMO_HINT` | `1` | `0` hides the demo password hint on the login page |
| `TWILIO_SID` / `TWILIO_TOKEN` / `TWILIO_FROM` / `WHATSAPP_FROM` | - | real messaging |

`clinic.db` is git-ignored - never commit the real patient data. `.env`,
`.venv/` and caches are ignored too.

## Go live
1. Real WhatsApp/SMS: `pip install twilio`, set the four Twilio env vars above -
   reminders.py then sends for real (send failures are logged, not fatal).
2. Real LLM chatbot: replace the intents in chatbot.py with an OpenAI/Claude/Ollama call.
3. Deploy: Railway / Render / Fly - `init_db()` runs on import, so the tables exist
   before the first request. Streamlit binds `0.0.0.0:8501` by itself, which is the
   `Uvicorn server started on :::8501` line in the host log. If the host hands out a
   different port, tell Streamlit which one to use:
   `streamlit run streamlit_app.py --server.port $PORT --server.address 0.0.0.0`
   Run only ONE process (see the login-state note above).
   Note: an ephemeral container wipes `clinic.db` on restart, so bookings do not
   survive redeploys there - set `CLINIC_DB=/data/clinic.db` on a mounted volume
   (`init_db()` creates the folder if the mount is empty) or move to Postgres. The
   sidebar shows a warning whenever `CLINIC_DB` is unset, because that is what the
   data loss usually turns out to be. One volume = one process: SQLite over a shared
   network mount with two replicas will corrupt the file.

## Still open (not security-critical)
- SQLite is fine for one clinic; a hosted Postgres/MySQL is the next step
  (`CLINIC_DB` is the only place that knows the file).
- The chatbot is rule-based, not an LLM - see the note in chatbot.py.
- Demo passwords and `seed_demo.py` rows must be removed before real patients
  use the site.
