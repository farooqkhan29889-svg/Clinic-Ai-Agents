"""CityCare Clinic - appointment booking system (Flask + SQLite).

Run:
    pip install -r requirements.txt
    python app.py
Then open http://127.0.0.1:5000

Pages:
    /              customer home
    /doctors       customer doctor listing
    /appointment   customer booking wizard
    /doctor        DOCTOR LOGIN  (demo password: citycare123)
    /doctor/dashboard   appointments + patient details
"""
from flask import (Flask, jsonify, redirect, render_template, request,
                   session, url_for)

from chatbot import chat_reply
from database import (all_doctors, create_booking, doctor_bookings, get_booking,
                      get_doctor, init_db, list_bookings,
                      update_booking_status)
from reminders import send_confirmation, send_sms, send_whatsapp

app = Flask(__name__)
app.secret_key = "change-this-secret-key"


def logged_doctor():
    return session.get("doctor_id")


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


@app.post("/api/book")
def api_book():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    if len(name) < 3:
        return jsonify({"ok": False, "error": "Enter the patient's full name"}), 400
    if not phone.isdigit() or len(phone) != 10:
        return jsonify({"ok": False, "error": "Enter a valid 10-digit mobile number"}), 400
    doctor = get_doctor(int(data.get("doctor_id", 0)))
    if not doctor:
        return jsonify({"ok": False, "error": "Unknown doctor"}), 400
    if not data.get("date") or not data.get("time"):
        return jsonify({"ok": False, "error": "Pick a date and time slot"}), 400

    booking_id = create_booking(doctor["id"], data["date"], data["time"],
                                name, phone, data.get("email", ""),
                                data.get("reason", ""))
    send_confirmation(booking_id, doctor["name"], data["date"], data["time"],
                      name, phone)
    return jsonify({"ok": True, "booking_id": booking_id,
                    "doctor": doctor["name"]})


@app.get("/api/bookings")
def api_bookings():
    return jsonify(list_bookings())


@app.post("/api/chat")
def api_chat():
    data = request.get_json(force=True)
    session_id = data.get("session_id", "anon")
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"reply": "Say something - I'm listening.", "actions": []})
    import chatbot
    chatbot.make_booking = create_booking          # inject validated booking fn
    return jsonify(chat_reply(session_id, message, all_doctors()))


# ================= doctor panel =================
def _initials(name):
    parts = name.replace("Dr. ", "").split()
    return "".join(w[0] for w in parts[:2]).upper()


@app.route("/doctor", methods=["GET", "POST"])
def doctor_login():
    if request.method == "POST":
        doc = get_doctor(int(request.form.get("doctor_id", 0)))
        if doc:
            session["doctor_id"] = doc["id"]          # tap name -> logged in
            return redirect(url_for("doctor_dashboard"))
    if logged_doctor():
        return redirect(url_for("doctor_dashboard"))
    docs = [dict(d, initials=_initials(d["name"])) for d in all_doctors()]
    return render_template("doctor/login.html", doctors=docs)


@app.route("/doctor/logout")
def doctor_logout():
    session.clear()
    return redirect(url_for("doctor_login"))


@app.route("/doctor/dashboard")
def doctor_dashboard():
    doc_id = logged_doctor()
    if not doc_id:
        return redirect(url_for("doctor_login"))
    doc = get_doctor(doc_id)
    view = request.args.get("view", "mine")          # mine | all
    date_f = request.args.get("date", "")            # YYYY-MM-DD | ""
    status_f = request.args.get("status", "")        # | Confirmed | Completed | Cancelled
    bookings = doctor_bookings(
        doc_id=None if view == "all" else doc_id,
        date=date_f or None, status=status_f or None)

    today = doctor_bookings(doc_id=None if view == "all" else doc_id, date=today_str())
    stats = {
        "today": len(today),
        "confirmed": sum(1 for b in bookings if b["status"] == "Confirmed"),
        "completed": sum(1 for b in bookings if b["status"] == "Completed"),
    }
    return render_template("doctor/dashboard.html", doc=doc, bookings=bookings,
                           view=view, date_f=date_f, status_f=status_f,
                           stats=stats, today=today_str())


@app.route("/doctor/patient/<booking_id>")
def doctor_patient(booking_id):
    if not logged_doctor():
        return redirect(url_for("doctor_login"))
    b = get_booking(booking_id)
    if not b:
        return redirect(url_for("doctor_dashboard"))
    return render_template("doctor/patient.html", b=b, doc=get_doctor(logged_doctor()))


@app.post("/api/booking/status")
def api_booking_status():
    if not logged_doctor():
        return jsonify({"ok": False, "error": "Please log in first"}), 401
    data = request.get_json(force=True)
    booking_id = data.get("booking_id", "")
    status = data.get("status", "")
    if status not in ("Confirmed", "Completed", "Cancelled"):
        return jsonify({"ok": False, "error": "Unknown status"}), 400
    update_booking_status(booking_id, status)
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


def today_str():
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d")


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
