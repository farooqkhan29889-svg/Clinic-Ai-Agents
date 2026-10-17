"""CityCare - AI assistant brain (pure Python).

Rule-based intents keep the demo fully offline. To use a real LLM later,
replace the body of `chat_reply()` with an API call (OpenAI/Claude/Ollama) -
the Flask route and the chat UI will not need any changes.
"""
import re
from datetime import datetime, timedelta

from database import get_doctor
from reminders import send_whatsapp, send_sms

CLINIC = {
    "name": "CityCare Clinic",
    "phone": "+91 98765 43210",
    "address": "12 MG Road, near City Mall, Bengaluru 560001",
    "hours": "Mon - Sat: 9:00 AM - 8:00 PM",
}

# per-chat-session booking context (multi-turn conversation)
CTX = {}

# injected by app.py (kept as a stub so this module can be tested alone)
def make_booking(*args, **kwargs):
    raise RuntimeError("make_booking not injected")


def _dates(n):
    out = []
    for i in range(1, n + 1):
        d = datetime.now() + timedelta(days=i)
        out.append({"label": d.strftime("%a, %d %b"),
                    "short": d.strftime("%a %d/%m"),
                    "iso": d.strftime("%Y-%m-%d")})
    return out


def _r(text, actions=None):
    return {"reply": text, "actions": actions or []}


def _doc_actions(doctors):
    return [{"t": d["name"].replace("Dr. ", "Dr. "), "m": f"__doc__{d['id']}"} for d in doctors]


QUICK = [["Book appointment", "I want to book an appointment"],
         ["Doctors", "Show doctors"], ["Fees", "What are the fees?"],
         ["Timings", "Clinic timings"]]


def chat_reply(session_id, message, doctors):
    t = message.lower().strip()
    ctx = CTX.get(session_id)

    # ---------- multi-turn booking flow ----------
    if ctx and ctx.get("stage") == "name":
        if not re.match(r"^[a-zA-Z .]{3,}$", t):
            return _r("Please type the patient's full name (letters only).")
        ctx["name"] = t.title()
        ctx["stage"] = "phone"
        return _r(f"Thanks {ctx['name'].split()[0]}! What is the 10-digit mobile number for confirmation?")

    if ctx and ctx.get("stage") == "phone":
        phone = re.sub(r"\s", "", t)
        if not re.match(r"^\d{10}$", phone):
            return _r("That doesn't look like a valid 10-digit number. Try again?")
        d = get_doctor(ctx["doc_id"])
        dates = _dates(10)
        date_label = dates[ctx["date_idx"]]["label"]
        booking_id = make_booking(ctx["doc_id"], dates[ctx["date_idx"]]["iso"],
                              ctx["time"], ctx["name"], phone)
        wa = (f"Hi {ctx['name'].split()[0]}, your appointment with {d['name']} is confirmed "
              f"for {date_label} at {ctx['time']}. Booking ID {booking_id}. - CityCare")
        send_whatsapp(phone, wa)
        send_sms(phone, f"CityCare: {d['name']}, {date_label} {ctx['time']}. ID {booking_id}.")
        CTX.pop(session_id, None)
        return _r(f"Done! <b>{d['name']}</b>, <b>{date_label} at {ctx['time']}</b>. "
                  f"Booking ID <b>{booking_id}</b>.<br><br>WhatsApp + SMS confirmation sent to "
                  f"+91 {phone}. Reminders will follow 24h and 2h before your visit.")

    if t.startswith("__doc__"):
        doc = get_doctor(int(t[7:]))
        if not doc:
            return _r("Which doctor would you like?", _doc_actions(doctors))
        dates = _dates(4)
        CTX[session_id] = {"stage": "date", "doc_id": doc["id"], "dates": dates}
        return _r(f"<b>{doc['name']}</b> - {doc['spec']}, &#8377;{doc['fee']}. Pick a date:",
                  [{"t": x["short"], "m": f"__date__{i}"} for i, x in enumerate(dates)])

    if t.startswith("__date__"):
        if not ctx:
            return _r("Which doctor would you like?", _doc_actions(doctors))
        ctx["date_idx"] = int(t[8:])
        ctx["stage"] = "time"
        doc = get_doctor(ctx["doc_id"])
        return _r("Pick a time slot:", [{"t": s, "m": f"__time__{s}"} for s in doc["slots"]])

    if t.startswith("__time__"):
        if not ctx:
            return _r("Which doctor would you like?", _doc_actions(doctors))
        ctx["time"] = t[8:]
        ctx["stage"] = "name"
        return _r(f"Great - <b>{ctx['dates'][ctx['date_idx']]['label']} at {ctx['time']}</b>. "
                  f"What is the patient's name?")

    # ---------- single-message intents ----------
    if re.match(r"^(hi|hii+|hello|hey|namaste|good (morning|afternoon|evening))\b", t):
        return _r("Hello! How can I help today - booking, doctors, fees or timings?",
                  [{"t": q[0], "m": q[1]} for q in QUICK])

    if re.search(r"book|appointment|consult|schedule", t):
        return _r("Sure! Which doctor would you like to see?", _doc_actions(doctors))

    if re.search(r"fee|cost|price|charge", t):
        lines = "<br>".join(f"&#8226; {d['name']} - <b>&#8377;{d['fee']}</b>" for d in doctors)
        return _r(f"Consultation fees:<br>{lines}<br>Follow-up within 7 days is free.")

    if re.search(r"time|hour|open|timing|when", t):
        return _r(f"We're open <b>{CLINIC['hours']}</b>. Sunday closed. Online booking is open 24/7.")

    if re.search(r"where|address|location|direction|parking", t):
        return _r(f"<b>{CLINIC['address']}</b><br>Landmark: opposite metro gate 2. Free parking for patients.")

    if re.search(r"remind|notification|whatsapp|sms", t):
        return _r("Every booking gets:<br>&#8226; Instant WhatsApp + SMS confirmation"
                  "<br>&#8226; Reminder <b>24h</b> before your visit"
                  "<br>&#8226; A nudge <b>2h</b> before with your token number")

    if re.search(r"lab|test|blood|x-?ray|report", t):
        return _r("Our in-house lab does blood tests, X-ray and sonography with <b>same-day "
                  "digital reports</b> on WhatsApp. Walk in any time for routine tests.")

    if re.search(r"cancel", t):
        return _r("To cancel, tell me your booking ID (e.g. CC4821) or call the front desk - "
                  "the patient gets an instant WhatsApp + SMS update.")

    if re.match(r"^cc\d{4}$", t):
        return _r(f"I've noted cancellation request <b>{t.upper()}</b>. Our team confirms "
                  f"cancellations on WhatsApp within 5 minutes.")

    if re.search(r"emergency|urgent", t):
        return _r(f"For emergencies call <b>{CLINIC['phone']}</b> immediately. For everything "
                  f"else, I can book you the earliest slot - usually within 2 hours.")

    if re.search(r"doctor|specialist|cardio|derma|pedia|gyn|ortho|physician", t):
        lines = "<br>".join(f"&#8226; <b>{d['name']}</b> - {d['spec']}, {d['exp']} yrs, &#8377;{d['fee']}"
                            for d in doctors)
        return _r("Our specialists:<br>" + lines,
                  [{"t": "Book now", "m": "I want to book an appointment"}])

    if re.search(r"thank", t):
        return _r("You're welcome! Feel better soon.")

    return _r("I can help with <b>bookings, doctors, fees, timings, location, lab tests and "
              "reminders</b>. Try one of these:", [{"t": q[0], "m": q[1]} for q in QUICK])
