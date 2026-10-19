"""CityCare - database layer (SQLite, pure Python, no setup needed).

All booking rules (validation, slot conflicts, booking IDs) live in
`book_appointment()` so the web wizard and the chatbot share one path.
"""
import json
import os
import re
import secrets
import sqlite3
from datetime import date, datetime

from werkzeug.security import check_password_hash, generate_password_hash

DB = os.getenv("CLINIC_DB") or os.path.join(os.path.dirname(__file__), "clinic.db")

DOCTOR_COLS = ("id, name, spec, exp, fee, color, about, slots, is_active")

DOCTORS_SEED = [
    {"id":1,"name":"Dr. Misbah Ambar","spec":"BHUMS","exp":None,"fee":300,"color":"#cd5f37","about":"Clinic consultation.","slots":["09:30","10:15","11:00","12:30","14:30","16:00","17:30"],"is_active":1},
    {"id":2,"name":"Dr. Farooq","spec":"MBBS","exp":None,"fee":500,"color":"#8b3f25","about":"Clinic consultation.","slots":["10:00","11:30","15:00","17:30"],"is_active":1},
    {"id":3,"name":"Dr. Arshad","spec":"Haddi Specialist","exp":None,"fee":400,"color":"#b56a48","about":"Clinic consultation.","slots":["09:00","10:30","13:30","15:30","18:00"],"is_active":1},
]

STATUSES = ("Confirmed", "Completed", "Cancelled")


class BookingError(Exception):
    """Expected rule violation - safe to show the message to the user."""


class SlotTakenError(BookingError):
    """The requested doctor/date/time is already booked."""

    def __init__(self, msg="That slot was just taken - please pick another time."):
        super().__init__(msg)


# ================= setup =================
def get_db():
    con = sqlite3.connect(DB, timeout=10)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    # CLINIC_DB often points at a volume (e.g. /data/clinic.db) that a freshly
    # built container has not created yet - sqlite3 cannot make the folder itself.
    os.makedirs(os.path.dirname(os.path.abspath(DB)), exist_ok=True)
    con = get_db()
    con.executescript("""
    CREATE TABLE IF NOT EXISTS doctors(
        id INTEGER PRIMARY KEY, name TEXT, spec TEXT, exp INTEGER,
        fee INTEGER, color TEXT, about TEXT, slots TEXT,
        pass_hash TEXT, is_active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS bookings(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id TEXT UNIQUE, doctor_id INTEGER,
        appt_date TEXT, appt_time TEXT,
        patient_name TEXT, phone TEXT, email TEXT, reason TEXT,
        status TEXT DEFAULT 'Confirmed',
        remind_24h INTEGER DEFAULT 0, remind_2h INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now','localtime')));
    CREATE TABLE IF NOT EXISTS chat_state(
        session_id TEXT PRIMARY KEY, state TEXT,
        updated_at TEXT DEFAULT (datetime('now','localtime')));
    CREATE UNIQUE INDEX IF NOT EXISTS ux_slot
        ON bookings(doctor_id, appt_date, appt_time)
        WHERE status <> 'Cancelled';
    """)
    doc_cols = [r["name"] for r in con.execute("PRAGMA table_info(doctors)")]
    if "pass_hash" not in doc_cols:      # upgrade a clinic.db created before hashing
        con.execute("ALTER TABLE doctors ADD COLUMN pass_hash TEXT")
    if "is_active" not in doc_cols:
        con.execute("ALTER TABLE doctors ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1")

    if con.execute("SELECT COUNT(*) c FROM doctors").fetchone()["c"] == 0:
        for d in DOCTORS_SEED:
            con.execute(
                "INSERT INTO doctors(id,name,spec,exp,fee,color,about,slots,pass_hash,is_active)"
                " VALUES(?,?,?,?,?,?,?,?,?,?)",
                (d["id"], d["name"], d["spec"], d["exp"], d["fee"], d["color"],
                 d["about"], json.dumps(d["slots"]),
                 generate_password_hash(default_demo_password(d["id"])), 1))
    else:                               # seed passwords for rows that have none
        for r in con.execute("SELECT id, pass_hash FROM doctors").fetchall():
            if not r["pass_hash"]:
                con.execute("UPDATE doctors SET pass_hash=? WHERE id=?",
                            (generate_password_hash(default_demo_password(r["id"])),
                             r["id"]))
    con.commit()
    con.close()


def default_demo_password(doctor_id):
    """Demo credential only - rotate every doctor's password before going live."""
    return f"citycare{doctor_id}123"


# ================= validation helpers =================
def normalize_phone(raw):
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if not re.match(r"^[6-9]\d{9}$", digits):
        raise BookingError("Enter a valid 10-digit mobile number")
    return digits


def validate_name(raw):
    name = (raw or "").strip()
    if len(name) < 3 or not re.match(r"^[\w .'-]{3,}$", name, re.UNICODE):
        raise BookingError("Enter the patient's full name")
    return name


def validate_email(raw):
    email = (raw or "").strip()
    if email and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$", email):
        raise BookingError("Enter a valid email address")
    return email


def validate_date(raw):
    value = (raw or "").strip()
    try:
        chosen = datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise BookingError("Pick a valid date (YYYY-MM-DD)")
    if chosen < date.today():
        raise BookingError("That date is in the past - pick an upcoming day")
    return value


def clean_time(raw):
    return (raw or "").strip()


# ================= doctors =================
def _doctor_from_row(row):
    return dict(row) | {"slots": json.loads(row["slots"])}


def all_doctors():
    con = get_db()
    rows = con.execute(f"SELECT {DOCTOR_COLS} FROM doctors WHERE is_active=1 ORDER BY id").fetchall()
    con.close()
    return [_doctor_from_row(r) for r in rows]


def get_doctor(doc_id):
    con = get_db()
    row = con.execute(f"SELECT {DOCTOR_COLS} FROM doctors WHERE id=? AND is_active=1",
                      (doc_id,)).fetchone()
    con.close()
    return _doctor_from_row(row) if row else None


def verify_doctor_password(doc_id, password):
    con = get_db()
    row = con.execute("SELECT pass_hash FROM doctors WHERE id=? AND is_active=1", (doc_id,)).fetchone()
    con.close()
    return bool(row and row["pass_hash"] and
                check_password_hash(row["pass_hash"], password or ""))


# ================= availability =================
def taken_times(doc_id, day):
    """Times already booked for this doctor on this date (active bookings)."""
    con = get_db()
    rows = con.execute(
        "SELECT appt_time FROM bookings WHERE doctor_id=? AND appt_date=?"
        " AND status <> 'Cancelled'", (doc_id, day)).fetchall()
    con.close()
    return [r["appt_time"] for r in rows]


def free_slots(doc_id, day):
    doc = get_doctor(doc_id)
    if not doc:
        raise BookingError("Unknown doctor")
    taken = set(taken_times(doc_id, day))
    return [s for s in doc["slots"] if s not in taken]


# ================= bookings =================
def new_booking_id(con):
    for _ in range(50):
        bid = "CC%06d" % (secrets.randbelow(900000) + 100000)
        if not con.execute("SELECT 1 FROM bookings WHERE booking_id=?", (bid,)).fetchone():
            return bid
    raise BookingError("Booking system is busy - please try again")


def book_appointment(doctor_id, day, time, name, phone, email="", reason=""):
    """The single validated entry point for creating a booking.

    Raises BookingError (bad input) or SlotTakenError (conflict).
    """
    doc = get_doctor(doctor_id)
    if not doc:
        raise BookingError("Unknown doctor")
    day = validate_date(day)
    time = clean_time(time)
    if time not in doc["slots"]:
        raise BookingError("That time slot is not offered by this doctor")
    name = validate_name(name)
    phone = normalize_phone(phone)
    email = validate_email(email)
    reason = (reason or "").strip()[:300]

    con = get_db()
    try:
        booking_id = new_booking_id(con)
        con.execute(
            "INSERT INTO bookings(booking_id,doctor_id,appt_date,appt_time,"
            "patient_name,phone,email,reason) VALUES(?,?,?,?,?,?,?,?)",
            (booking_id, doc["id"], day, time, name, phone, email, reason))
        con.commit()
    except sqlite3.IntegrityError:
        con.rollback()
        raise SlotTakenError()
    finally:
        con.close()
    return booking_id


def list_bookings(doc_id=None, limit=None, offset=0):
    sql = ("SELECT b.id, b.booking_id, b.doctor_id, b.appt_date, b.appt_time,"
           " b.patient_name, b.phone, b.email, b.reason, b.status, b.created_at,"
           " d.name doctor_name, d.spec FROM bookings b"
           " JOIN doctors d ON d.id=b.doctor_id WHERE d.is_active=1")
    params = []
    if doc_id is not None:
        sql += " AND b.doctor_id=?"
        params.append(doc_id)
    sql += " ORDER BY b.id DESC"
    if limit:
        sql += " LIMIT ? OFFSET ?"
        params = params + [limit, offset]
    con = get_db()
    rows = con.execute(sql, params).fetchall()
    con.close()
    return [dict(r) for r in rows]


# ---------- doctor panel ----------
def _booking_filters(doc_id, date, status):
    where, params = ["EXISTS (SELECT 1 FROM doctors active_doc "
                     "WHERE active_doc.id=b.doctor_id AND active_doc.is_active=1)"], []
    if doc_id:
        where.append("b.doctor_id=?"); params.append(doc_id)
    if date:
        where.append("b.appt_date=?"); params.append(date)
    if status:
        where.append("b.status=?"); params.append(status)
    return " AND ".join(where), params


def doctor_bookings(doc_id=None, date=None, status=None, limit=None, offset=0):
    where, params = _booking_filters(doc_id, date, status)
    sql = ("SELECT b.*, d.name doctor_name, d.spec doctor_spec, d.color doctor_color"
           " FROM bookings b JOIN doctors d ON d.id=b.doctor_id WHERE " + where +
           " ORDER BY b.appt_date, b.appt_time")
    if limit:
        sql += " LIMIT ? OFFSET ?"
        params = params + [limit, offset]
    con = get_db()
    rows = con.execute(sql, params).fetchall()
    con.close()
    return [dict(r) for r in rows]


def count_doctor_bookings(doc_id=None, date=None, status=None):
    where, params = _booking_filters(doc_id, date, status)
    con = get_db()
    total = con.execute("SELECT COUNT(*) c FROM bookings b WHERE " + where,
                        params).fetchone()["c"]
    con.close()
    return total


def get_booking(booking_id):
    con = get_db()
    row = con.execute(
        "SELECT b.*, d.name doctor_name, d.spec doctor_spec, d.color doctor_color"
        " FROM bookings b JOIN doctors d ON d.id=b.doctor_id"
        " WHERE b.booking_id=?", (booking_id,)).fetchone()
    con.close()
    return dict(row) if row else None


def update_booking_status(booking_id, status, owner_id=None):
    """Change status. With owner_id the booking must belong to that doctor."""
    if status not in STATUSES:
        raise BookingError("Unknown status")
    con = get_db()
    sql = "UPDATE bookings SET status=? WHERE booking_id=?"
    params = [status, booking_id]
    if owner_id is not None:
        sql += " AND doctor_id=?"
        params.append(owner_id)
    cur = con.execute(sql, params)
    con.commit()
    con.close()
    if cur.rowcount == 0:
        raise BookingError("Appointment not found or it belongs to another doctor")
    return True


def find_booking_by_id_and_phone(booking_id, phone):
    """Used by the chatbot: a cancellation needs both the ID and the phone."""
    con = get_db()
    row = con.execute(
        "SELECT b.*, d.name doctor_name FROM bookings b"
        " JOIN doctors d ON d.id=b.doctor_id"
        " WHERE UPPER(b.booking_id)=? AND b.phone=?",
        ((booking_id or "").upper(), normalize_phone(phone))).fetchone()
    con.close()
    return dict(row) if row else None


# ---------- reminders ----------
def bookings_needing_reminder(kind):
    """Confirmed bookings whose reminder is due and not sent yet.

    kind is '24h' or '2h'. Rows are returned with an extra `hours_left` key.
    """
    if kind not in ("24h", "2h"):
        raise ValueError(kind)
    flag = "remind_24h" if kind == "24h" else "remind_2h"
    con = get_db()
    rows = con.execute(
        f"SELECT b.*, d.name doctor_name FROM bookings b"
        f" JOIN doctors d ON d.id=b.doctor_id"
        f" WHERE b.status='Confirmed' AND b.{flag}=0").fetchall()
    con.close()
    now = datetime.now()
    due = []
    for r in rows:
        try:
            when = datetime.strptime(f"{r['appt_date']} {r['appt_time']}",
                                     "%Y-%m-%d %H:%M")
        except ValueError:
            continue
        hours_left = (when - now).total_seconds() / 3600.0
        if hours_left <= 0:
            continue
        if kind == "2h" and hours_left <= 2:
            due.append(dict(r) | {"hours_left": hours_left})
        elif kind == "24h" and hours_left <= 24 and hours_left > 2:
            due.append(dict(r) | {"hours_left": hours_left})
    return due


def claim_reminder(booking_id, kind):
    """Atomically mark a reminder as sent.

    Returns True for exactly one caller, so several workers or a cron job plus
    the background thread cannot send the same reminder twice.
    """
    flag = "remind_24h" if kind == "24h" else "remind_2h"
    con = get_db()
    cur = con.execute(
        f"UPDATE bookings SET {flag}=1"
        f" WHERE booking_id=? AND {flag}=0 AND status='Confirmed'", (booking_id,))
    con.commit()
    con.close()
    return cur.rowcount == 1


# ---------- chat conversation state ----------
CHAT_TTL_MINUTES = 120


def load_chat_state(session_id):
    """The chatbot's conversation state, or None. Lives in SQLite so a restart
    or a second worker does not lose an unfinished booking."""
    con = get_db()
    row = con.execute("SELECT state FROM chat_state WHERE session_id=?",
                      (session_id,)).fetchone()
    con.close()
    if not row or not row["state"]:
        return None
    try:
        return json.loads(row["state"])
    except ValueError:
        return None


def save_chat_state(session_id, state):
    con = get_db()
    con.execute(
        "INSERT INTO chat_state(session_id, state, updated_at)"
        " VALUES(?,?,datetime('now','localtime'))"
        " ON CONFLICT(session_id) DO UPDATE SET state=excluded.state,"
        " updated_at=datetime('now','localtime')",
        (session_id, json.dumps(state)))
    con.execute("DELETE FROM chat_state"
                " WHERE updated_at < datetime('now','localtime',?)",
                (f"-{CHAT_TTL_MINUTES} minutes",))
    con.commit()
    con.close()


def clear_chat_state(session_id):
    con = get_db()
    con.execute("DELETE FROM chat_state WHERE session_id=?", (session_id,))
    con.commit()
    con.close()
