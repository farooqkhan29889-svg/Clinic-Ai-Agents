"""CityCare - AI assistant brain (pure Python).

Rule-based intents keep the demo fully offline. To use a real LLM later,
replace the body of `chat_reply()` with an API call (OpenAI/Claude/Ollama) -
the chat UI will not need any changes.

Bookings go through `database.book_appointment()`, the same validated path the
booking wizard uses, so the chatbot cannot bypass input or slot-conflict rules.
Conversation state lives in SQLite (`chat_state`), so an unfinished booking
survives a restart and is shared across workers.
"""
import re
from datetime import datetime, timedelta

from database import (BookingError, SlotTakenError, book_appointment,
                      clear_chat_state, find_booking_by_id_and_phone, free_slots,
                      get_doctor, load_chat_state, save_chat_state,
                      update_booking_status, validate_name)
from reminders import send_sms, send_whatsapp

CLINIC = {
    "name": "CityCare Clinic",
    "phone": "+91 98765 43210",
    "address": "12 MG Road, near City Mall, Bengaluru 560001",
    "hours": "Mon - Sat: 9:00 AM - 8:00 PM",
}

EXIT_WORDS = ("cancel", "quit", "stop", "back", "menu", "restart", "exit")
BOOK_ID_RE = re.compile(r"\bCC[\s-]*(\d{4,6})\b", re.IGNORECASE)

QUICK = [["Book appointment", "I want to book an appointment"],
         ["Doctors", "Show doctors"], ["Fees", "What are the fees?"],
         ["Timings", "Clinic timings"]]


# ================= conversation state =================
class Session:
    """One chat conversation's state, persisted once per reply."""

    def __init__(self, session_id):
        self.id = session_id
        self.data = load_chat_state(session_id) or {}
        self._dropped = False

    def update(self, **fields):
        self.data.update(fields)

    def drop(self):
        self._dropped = True
        self.data = {}
        clear_chat_state(self.id)

    def save(self):
        if self._dropped:
            return
        if self.data:
            save_chat_state(self.id, self.data)
        else:
            clear_chat_state(self.id)


# ================= small helpers =================
def _r(text, actions=None):
    return {"reply": text, "actions": actions or []}


def _doc_actions(doctors):
    return [{"t": d["name"], "m": f"__doc__{d['id']}"} for d in doctors]


def _date_actions(dates):
    return [{"t": x["short"], "m": f"__date__{i}"} for i, x in enumerate(dates)]


def _time_actions(slots):
    return [{"t": s, "m": f"__time__{s}"} for s in slots]


def _dates(n):
    today = datetime.now().date()
    out = []
    for i in range(1, n + 1):
        d = today + timedelta(days=i)
        out.append({"label": d.strftime("%a, %d %b"),
                    "short": d.strftime("%a %d/%m"),
                    "iso": d.strftime("%Y-%m-%d")})
    return out


def _to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return -1


def _next_action(t, prefix):
    """Read the payload of an action message like '__time__09:30'."""
    return t[len(prefix):].strip() if t.startswith(prefix) else None


# ================= entry point =================
def chat_reply(session_id, message, doctors):
    session = Session(session_id)
    try:
        return _dispatch(session, message.lower().strip(), doctors)
    finally:
        session.save()


def _dispatch(s, t, doctors):
    ctx = s.data
    # leave the current flow
    if ctx and re.fullmatch(r"(?:%s)" % "|".join(EXIT_WORDS), t):
        s.drop()
        return _r("No problem, I've dropped that. Anything else?",
                  [{"t": q[0], "m": q[1]} for q in QUICK])

    if t.startswith("__doc__"):
        doc = get_doctor(_to_int(_next_action(t, "__doc__")))
        if not doc:
            return _r("Which doctor would you like?", _doc_actions(doctors))
        return _start_booking(s, doc)

    if ctx.get("flow") == "book":
        handled = _booking_step(s, t, doctors)
        if handled:
            return handled

    if ctx.get("flow") == "cancel":
        return _cancel_step(s, t)

    reply = _intent(s, t, doctors)
    if reply is not None:
        return reply

    # free-form text during booking: answer above if we recognised it, else
    # nudge them back to the step they were on
    if ctx.get("flow") == "book":
        return _nudge(s, doctors)
    return _r("I can help with <b>bookings, doctors, fees, timings, location, lab tests, "
              "cancellations and reminders</b>. Try one of these:",
              [{"t": q[0], "m": q[1]} for q in QUICK])


def _nudge(s, doctors):
    ctx = s.data
    doc = get_doctor(ctx.get("doc_id"))
    if not doc:
        return _r("Which doctor would you like?", _doc_actions(doctors))
    stage = ctx.get("stage")
    if stage == "date":
        return _r(f"Still booking with <b>{doc['name']}</b> - pick a date:",
                  _date_actions(ctx["dates"]))
    if stage == "time":
        day = ctx["dates"][ctx["date_idx"]]
        return _r(f"Pick a time slot for {day['label']}:",
                  _time_actions(free_slots(doc["id"], day["iso"])))
    if stage == "name":
        return _r("What is the patient's name? (say <b>cancel</b> to stop)")
    if stage == "phone":
        return _r("What is the 10-digit mobile number? (say <b>cancel</b> to stop)")
    return _r("Which doctor would you like?", _doc_actions(doctors))


# ================= single-message intents =================
def _intent(s, t, doctors):
    # cancellation first: "cancel my appointment" also matches the booking intent
    if re.search(r"cancel", t) or BOOK_ID_RE.search(t):
        m = BOOK_ID_RE.search(t)
        if m:
            return _start_cancel(s, "CC" + m.group(1))
        return _r("I can cancel it for you. What is your booking ID? It looks like "
                  "<b>CC123456</b> and is in your confirmation message.")

    if re.match(r"^(hi|hii+|hello|hey|namaste|good (morning|afternoon|evening))\b", t):
        return _r("Hello! How can I help today - booking, doctors, fees or timings?",
                  [{"t": q[0], "m": q[1]} for q in QUICK])

    if re.search(r"book|appointment|consult|schedule", t):
        return _r("Sure! Which doctor would you like to see?", _doc_actions(doctors))

    if re.search(r"fee|cost|price|charge", t):
        lines = "<br>".join(f"&#8226; {d['name']} - <b>&#8377;{d['fee']}</b>" for d in doctors)
        return _r(f"Consultation fees:<br>{lines}<br>Follow-up within 7 days is free.")

    if re.search(r"time|hour|open|timing|when", t):
        return _r(f"We're open <b>{CLINIC['hours']}</b>. Sunday closed. "
                  f"Online booking is open 24/7.")

    if re.search(r"where|address|location|direction|parking", t):
        return _r(f"<b>{CLINIC['address']}</b><br>Landmark: opposite metro gate 2. "
                  f"Free parking for patients.")

    if re.search(r"remind|notification|whatsapp|sms", t):
        return _r("Every booking gets:<br>&#8226; Instant WhatsApp + SMS confirmation"
                  "<br>&#8226; Reminder <b>24h</b> before your visit"
                  "<br>&#8226; A nudge <b>2h</b> before with your booking ID")

    if re.search(r"lab|test|blood|x-?ray|report", t):
        return _r("Our in-house lab does blood tests, X-ray and sonography with <b>same-day "
                  "digital reports</b> on WhatsApp. Walk in any time for routine tests.")

    if re.search(r"emergency|urgent", t):
        return _r(f"For emergencies call <b>{CLINIC['phone']}</b> immediately. For everything "
                  f"else, I can book you the earliest slot - usually within 2 hours.")

    if re.search(r"doctor|specialist|cardio|derma|pedia|gyn|ortho|physician", t):
        lines = "<br>".join(f"&#8226; <b>{d['name']}</b> - {d['spec']}, {d['exp']} yrs, "
                            f"&#8377;{d['fee']}" for d in doctors)
        return _r("Our specialists:<br>" + lines,
                  [{"t": "Book now", "m": "I want to book an appointment"}])

    if re.search(r"thank", t):
        return _r("You're welcome! Feel better soon.")

    return None


# ================= booking flow =================
def _start_booking(s, doc):
    dates = _dates(4)
    s.update(flow="book", stage="date", doc_id=doc["id"], dates=dates,
             date_idx=None, time=None, name=None)
    return _r(f"<b>{doc['name']}</b> - {doc['spec']}, &#8377;{doc['fee']}. Pick a date:",
              _date_actions(dates))


def _booking_step(s, t, doctors):
    """Returns a reply dict, or None when the text is not a booking step."""
    ctx = s.data
    stage = ctx.get("stage")
    if stage not in ("date", "time", "name", "phone"):
        return None
    doc = get_doctor(ctx["doc_id"])
    if not doc:
        s.drop()
        return _r("Which doctor would you like?", _doc_actions(doctors))

    if stage == "date":
        payload = _next_action(t, "__date__")
        if payload is None:
            return None
        idx = _to_int(payload)
        if not 0 <= idx < len(ctx["dates"]):
            return _r("Pick one of the dates below:", _date_actions(ctx["dates"]))
        ctx["date_idx"] = idx
        open_slots = free_slots(doc["id"], ctx["dates"][idx]["iso"])
        if not open_slots:
            return _r(f"{ctx['dates'][idx]['label']} is fully booked with "
                      f"{doc['name']}. Try another date:", _date_actions(ctx["dates"]))
        ctx["stage"] = "time"
        return _r(f"{ctx['dates'][idx]['label']} with <b>{doc['name']}</b>. "
                  f"Pick a time slot:", _time_actions(open_slots))

    if stage == "time":
        slot = _next_action(t, "__time__")
        if slot is None:
            return None
        day = ctx["dates"][ctx["date_idx"]]
        open_slots = free_slots(doc["id"], day["iso"])
        if slot not in open_slots:
            return _r(f"Sorry, {slot} is not free on {day['label']}. Pick another:",
                      _time_actions(open_slots))
        ctx["time"] = slot
        ctx["stage"] = "name"
        return _r(f"Great - <b>{day['label']} at {slot}</b>. What is the patient's name?")

    if stage == "name":
        try:
            ctx["name"] = validate_name(t).title()
        except BookingError:
            return _r("Please type the patient's full name (at least 3 letters).")
        ctx["stage"] = "phone"
        return _r(f"Thanks {ctx['name'].split()[0]}! What is the 10-digit mobile number "
                  f"for confirmation? Say <b>cancel</b> to stop.")

    # stage == "phone": everything typed here is the number
    digits = re.sub(r"\D", "", t)
    if not re.fullmatch(r"[6-9]\d{9}", digits):
        return _r("That doesn't look like a valid 10-digit Indian mobile number. "
                  "Try again, or say <b>cancel</b>.")
    day = ctx["dates"][ctx["date_idx"]]
    try:
        booking_id = book_appointment(doc["id"], day["iso"], ctx["time"],
                                      ctx["name"], digits)
    except SlotTakenError:
        open_slots = free_slots(doc["id"], day["iso"])
        if not open_slots:
            s.drop()
            return _r(f"{ctx['time']} on {day['label']} was just taken with "
                      f"{doc['name']}, and that day is now full. Please start again.")
        ctx["stage"] = "time"
        return _r(f"Sorry - {ctx['time']} on {day['label']} was just taken. "
                  f"Pick another time:", _time_actions(open_slots))
    except BookingError as exc:
        s.drop()
        return _r(f"{exc} Please start the booking again - say <b>book</b>.")

    s.drop()
    first = ctx["name"].split()[0]
    send_whatsapp(digits, f"Hi {first}, your appointment with {doc['name']} is confirmed "
                          f"for {day['label']} at {ctx['time']}. Booking ID {booking_id}. "
                          f"- CityCare")
    send_sms(digits, f"CityCare: {doc['name']}, {day['label']} {ctx['time']}. ID {booking_id}.")
    return _r(f"Done! <b>{doc['name']}</b>, <b>{day['label']} at {ctx['time']}</b>. "
              f"Booking ID <b>{booking_id}</b>.<br><br>WhatsApp + SMS confirmation sent to "
              f"+91 {digits}. Reminders will follow 24h and 2h before your visit.")


# ================= cancellation flow =================
def _start_cancel(s, booking_id):
    s.update(flow="cancel", stage="cancel_phone", booking_id=booking_id)
    return _r(f"Thanks - I have <b>{booking_id}</b>. For your security, confirm the "
              f"10-digit mobile number on that booking. Say <b>quit</b> to stop.")


def _cancel_step(s, t):
    ctx = s.data
    bid = ctx["booking_id"]
    digits = re.sub(r"\D", "", t)
    if not re.fullmatch(r"[6-9]\d{9}", digits):
        return _r(f"Please type the 10-digit mobile number on booking <b>{bid}</b> "
                  f"(or say <b>quit</b> to stop).")
    b = find_booking_by_id_and_phone(bid, digits)
    if not b:
        return _r(f"No booking <b>{bid}</b> matches that mobile number. Check both, "
                  f"or say <b>quit</b> to stop.")
    if b["status"] == "Cancelled":
        s.drop()
        return _r(f"<b>{bid}</b> was already cancelled - nothing to do.")
    if b["status"] == "Completed":
        s.drop()
        return _r(f"<b>{bid}</b> is marked as completed. Call {CLINIC['phone']} to "
                  f"discuss it with the clinic.")

    update_booking_status(bid, "Cancelled")
    s.drop()
    msg = (f"CityCare: your appointment {bid} with {b['doctor_name']} on "
           f"{b['appt_date']} at {b['appt_time']} was cancelled. Call us to rebook.")
    send_whatsapp(b["phone"], msg)
    send_sms(b["phone"], msg)
    return _r(f"Cancelled <b>{bid}</b> ({b['doctor_name']}, {b['appt_date']} at "
              f"{b['appt_time']}). WhatsApp + SMS sent to the registered number. "
              f"Want to pick a new slot?")
