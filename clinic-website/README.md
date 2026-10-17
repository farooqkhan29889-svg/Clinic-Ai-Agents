# CityCare Clinic - appointment booking system (Python + Flask)

A professional clinic website where ALL logic is written in Python:
booking, database, AI chatbot and WhatsApp/SMS reminders.

## Run it
    pip install -r requirements.txt
    python app.py
Open http://127.0.0.1:5000

## The Python files (this is where you work)
| File | What it does |
|---|---|
| app.py | Flask server: web pages + JSON API (`/api/doctors`, `/api/book`, `/api/chat`) |
| database.py | SQLite database: doctors + bookings (auto-created, auto-seeded) |
| chatbot.py | AI assistant brain: intents + full booking conversation |
| reminders.py | WhatsApp + SMS sender (demo mode prints to terminal; Twilio-ready) |

## The view layer (fixed design, rarely edited)
| File | What it does |
|---|---|
| templates/*.html | Page designs (Jinja templates served by Flask) |
| static/css/style.css | All styling |
| static/js/app.js | Thin connector: sends clicks to Python, draws replies |

## Go live
1. Real WhatsApp/SMS: `pip install twilio`, set env vars TWILIO_SID, TWILIO_TOKEN,
   TWILIO_FROM, WHATSAPP_FROM - reminders.py sends for real.
2. Real LLM chatbot: replace the intents in chatbot.py with an OpenAI/Claude/Ollama call.
3. 24h/2h reminders: call reminders.send_reminder() from a cron job / APScheduler.
4. Deploy: Railway / Render / PythonAnywhere.

## Doctor panel (NEW)
- `/doctor` - doctor login: tap your name, no password (demo)
- `/doctor/dashboard` - appointments table: filter by date / status, "My patients" vs "All doctors" view
- `/doctor/patient/<booking_id>` - full patient details + mark Completed / Cancelled (auto notifies patient on WhatsApp + SMS)
- Add demo data: `python seed_demo.py`

Add real passwords later if you go live (e.g. Flask-Login).
