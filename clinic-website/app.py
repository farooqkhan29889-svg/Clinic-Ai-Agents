"""CityCare Clinic - appointment booking system (Flask + SQLite).

Run:
    pip install -r requirements.txt
    python app.py
Then open http://127.0.0.1:5000

Pages:
    /              customer home
    /doctors       customer doctor listing
    /appointment   customer booking wizard
    /doctor        DOCTOR LOGIN  (demo password per doctor: citycare<ID>123)
    /doctor/dashboard   appointments + patient details

Env vars (all optional in development):
    SECRET_KEY        session signing key - REQUIRED before going live
    FLASK_DEBUG       "1" to enable the reloader/debugger (never in prod)
    ENABLE_REMINDERS  "0" to switch the background reminder sweep off
    REMINDER_MINUTES  how often the sweep runs (default 10)
    SHOW_DEMO_HINT    "0" hides the demo password hint on the login page
    PORT / HOST       bind address for `python app.py` (default 127.0.0.1:5000;
                      hosted platforms set PORT and expect HOST=0.0.0.0)
"""
import functools
import os
import threading
from datetime import date

from flask import (Flask, jsonify, redirect, render_template, request,
                   session, url_for)
from werkzeug.exceptions import HTTPException

from chatbot import chat_reply
from database import (BookingError, SlotTakenError, all_doctors,
                      book_appointment, count_doctor_bookings, doctor_bookings,
                      free_slots, get_booking, get_doctor, init_db, list_bookings,
                      update_booking_status, validate_date,
                      verify_doctor_password)
from reminders import process_due_reminders, send_confirmation, send_sms, send_whatsapp

app = Flask(__name__)

PER_PAGE = 25                       # doctor dashboard rows per page

DEBUG = os.getenv("FLASK_DEBUG") == "1"
app.secret_key = os.getenv("SECRET_KEY") or "dev-only-insecure-key-change-me"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

if not os.getenv("SECRET_KEY"):
    app.logger.warning("SECRET_KEY is not set - using an insecure development key.")


# ================= helpers =================
def logged_doctor():
    return session.get("doctor_id")


def login_required(view):
    @functools.wraps(view)
    def wrapped(*args, **kwargs):
        if not logged_doctor():
            if request.path.startswith("/api/"):
                return jsonify({"ok": False, "error": "Please log in first"}), 401
            return redirect(url_for("doctor_login"))
        return view(*args, **kwargs)
    return wrapped


def json_body():
    """Parse the request body as JSON, or return {} - never raise."""
    return request.get_json(silent=True) or {}


def to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def today_str():
    return date.today().strftime("%Y-%m-%d")


def booking_error(exc):
    code = 409 if isinstance(exc, SlotTakenError) else 400
    return jsonify({"ok": False, "error": str(exc)}), code


@app.errorhandler(HTTPException)
def handle_http_error(err):
    if request.path.startswith("/api/"):
        return jsonify({"ok": False, "error": err.description}), err.code
    return err


@app.errorhandler(Exception)
def handle_unexpected(err):
    app.logger.exception("Unhandled error on %s", request.path)
    if request.path.startswith("/api/"):
        return jsonify({"ok": False, "error": "Something went wrong. Please try again."}), 500
    raise err


# ================= customer pages =================
@app.route("/")
def home():
    return render_template("index.html", active="home")


@app.route("/doctors")
def doctors_page():
    return render_template("doctors.html", active="doctors")


@app.route("/appointment")
def appointment_page():
    return render_template("appointment.html", active="appointment")


# ================= customer API =================
@app.get("/api/doctors")
def api_doctors():
    return jsonify(all_doctors())


@app.get("/api/availability")
def api_availability():
    """Free slots for one doctor on one date - used by the booking wizard."""
    doc_id = to_int(request.args.get("doctor_id"))
    doc = get_doctor(doc_id)
    if not doc:
        return jsonify({"ok": False, "error": "Unknown doctor"}), 400
    try:
        day = validate_date((request.args.get("date") or "").strip())
    except BookingError as exc:
        return booking_error(exc)
    return jsonify({"ok": True, "date": day, "slots": doc["slots"],
                    "free": free_slots(doc_id, day)})


@app.post("/api/book")
def api_book():
    data = json_body()
    try:
        booking_id = book_appointment(
            to_int(data.get("doctor_id")), data.get("date"), data.get("time"),
            data.get("name"), data.get("phone"), data.get("email", ""),
            data.get("reason", ""))
    except (BookingError, SlotTakenError) as exc:
        return booking_error(exc)
    b = get_booking(booking_id)
    send_confirmation(b["booking_id"], b["doctor_name"], b["appt_date"],
                      b["appt_time"], b["patient_name"], b["phone"])
    return jsonify({"ok": True, "booking_id": booking_id,
                    "doctor": b["doctor_name"]})


@app.get("/api/bookings")
@login_required
def api_bookings():
    """Staff-only. Defaults to the logged-in doctor's own patients."""
    view = request.args.get("view", "mine")
    limit = min(max(to_int(request.args.get("limit")) or 50, 1), 200)
    offset = max(to_int(request.args.get("offset")), 0)
    return jsonify(list_bookings(None if view == "all" else logged_doctor(),
                                 limit=limit, offset=offset))


@app.post("/api/chat")
def api_chat():
    data = json_body()
    session_id = str(data.get("session_id") or "anon")[:64]
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"reply": "Say something - I'm listening.", "actions": []})
    return jsonify(chat_reply(session_id, message, all_doctors()))


# ================= doctor panel =================
@app.route("/doctor", methods=["GET", "POST"])
def doctor_login():
    hint = os.getenv("SHOW_DEMO_HINT", "1") == "1"
    if request.method == "POST":
        doc_id = to_int(request.form.get("doctor_id"))
        doc = get_doctor(doc_id)
        if doc and verify_doctor_password(doc_id, request.form.get("password", "")):
            session.clear()
            session["doctor_id"] = doc["id"]
            return redirect(url_for("doctor_dashboard"))
        return (render_template("doctor/login.html", doctors=all_doctors(),
                                hint=hint, error="Wrong doctor or password"), 401)
    if logged_doctor():
        return redirect(url_for("doctor_dashboard"))
    return render_template("doctor/login.html", doctors=all_doctors(),
                           hint=hint, error=None)


@app.route("/doctor/logout")
def doctor_logout():
    session.clear()
    return redirect(url_for("doctor_login"))


@app.route("/doctor/dashboard")
@login_required
def doctor_dashboard():
    doc_id = logged_doctor()
    doc = get_doctor(doc_id)
    view = request.args.get("view", "mine")          # mine | all
    date_f = (request.args.get("date") or "").strip()                # YYYY-MM-DD | ""
    status_f = request.args.get("status", "")        # | Confirmed | Completed | Cancelled
    if status_f not in ("", "Confirmed", "Completed", "Cancelled"):
        status_f = ""
    scope = None if view == "all" else doc_id
    page = max(1, to_int(request.args.get("page")) or 1)
    total = count_doctor_bookings(doc_id=scope, date=date_f or None,
                                  status=status_f or None)
    pages = max(1, -(-total // PER_PAGE))
    page = min(page, pages)
    bookings = doctor_bookings(doc_id=scope, date=date_f or None,
                               status=status_f or None,
                               limit=PER_PAGE, offset=(page - 1) * PER_PAGE)
    stats = {
        "today": count_doctor_bookings(doc_id=scope, date=today_str()),
        "confirmed": count_doctor_bookings(doc_id=scope, date=date_f or None,
                                           status="Confirmed"),
        "completed": count_doctor_bookings(doc_id=scope, date=date_f or None,
                                           status="Completed"),
    }
    return render_template("doctor/dashboard.html", doc=doc, bookings=bookings,
                           view=view, date_f=date_f, status_f=status_f,
                           stats=stats, today=today_str(), page=page, pages=pages,
                           total=total, per_page=PER_PAGE)


@app.route("/doctor/patient/<booking_id>")
@login_required
def doctor_patient(booking_id):
    b = get_booking(booking_id)
    if not b:
        return redirect(url_for("doctor_dashboard"))
    return render_template("doctor/patient.html", b=b,
                           doc=get_doctor(logged_doctor()),
                           can_edit=b["doctor_id"] == logged_doctor())


@app.post("/api/booking/status")
@login_required
def api_booking_status():
    data = json_body()
    booking_id = str(data.get("booking_id", "")).strip()
    status = data.get("status", "")
    if status not in ("Confirmed", "Completed", "Cancelled"):
        return jsonify({"ok": False, "error": "Unknown status"}), 400
    b = get_booking(booking_id)
    if not b:
        return jsonify({"ok": False, "error": "Appointment not found"}), 404
    if b["doctor_id"] != logged_doctor():
        return jsonify({"ok": False, "error": "Only the treating doctor can "
                                              "change this appointment"}), 403
    try:
        update_booking_status(booking_id, status, owner_id=logged_doctor())
    except BookingError as exc:
        return booking_error(exc)
    b = get_booking(booking_id)
    if status == "Cancelled":
        msg = (f"CityCare: your appointment {b['booking_id']} with "
               f"{b['doctor_name']} on {b['appt_date']} at {b['appt_time']} "
               f"was cancelled. Call us to rebook.")
        send_whatsapp(b["phone"], msg)
        send_sms(b["phone"], msg)
    elif status == "Completed":
        send_whatsapp(b["phone"],
                      f"CityCare: thank you for visiting! Your consultation "
                      f"({b['booking_id']}) is complete. Get well soon.")
    return jsonify({"ok": True, "status": status})


@app.post("/api/reminders/run")
@login_required
def api_reminders_run():
    """Cron trigger for hosted setups where no background thread runs."""
    return jsonify({"ok": True, "sent": process_due_reminders()})


# ================= background reminders =================
def reminder_loop(stop):
    minutes = to_int(os.getenv("REMINDER_MINUTES")) or 10
    while not stop.wait(minutes * 60):
        try:
            process_due_reminders()
        except Exception:                                 # noqa: BLE001
            app.logger.exception("Reminder sweep failed")


def start_reminder_thread():
    if os.getenv("ENABLE_REMINDERS", "1") != "1":
        return None
    # With the debug reloader only the worker child has WERKZEUG_RUN_MAIN set,
    # so this keeps the sweep from running twice.
    if DEBUG and os.getenv("WERKZEUG_RUN_MAIN") != "true":
        return None
    stop = threading.Event()
    threading.Thread(target=reminder_loop, args=(stop,), daemon=True).start()
    return stop


init_db()

if __name__ == "__main__":
    start_reminder_thread()
    # Render/Railway/Fly inject PORT (and expect 0.0.0.0); local default stays 5000
    app.run(host=os.getenv("HOST", "127.0.0.1"),
            port=int(os.getenv("PORT", "5000")),
            debug=DEBUG)
