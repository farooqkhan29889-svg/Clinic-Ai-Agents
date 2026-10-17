"""CityCare - database layer (SQLite, pure Python, no setup needed)."""
import json
import os
import sqlite3

DB = os.path.join(os.path.dirname(__file__), "clinic.db")

DOCTORS_SEED = [
    {"id":1,"name":"Dr. Priya Sharma","spec":"General physician","exp":12,"fee":500,"color":"#0f766e","about":"Cold, fever, diabetes management and preventive checkups.","slots":["09:30","10:15","11:00","12:30","14:30","16:00","17:30"]},
    {"id":2,"name":"Dr. Arun Patel","spec":"Cardiologist","exp":15,"fee":1200,"color":"#b91c1c","about":"Heart health, blood pressure and ECG review.","slots":["10:00","11:30","15:00","17:30"]},
    {"id":3,"name":"Dr. Meera Iyer","spec":"Dermatologist","exp":9,"fee":800,"color":"#15803d","about":"Skin, hair, allergy and cosmetic dermatology.","slots":["09:00","10:30","13:30","15:30","18:00"]},
    {"id":4,"name":"Dr. Rahul Verma","spec":"Pediatrician","exp":11,"fee":700,"color":"#6d28d9","about":"Child health, vaccination and growth tracking.","slots":["09:30","11:00","12:30","16:30","18:30"]},
    {"id":5,"name":"Dr. Kavitha Nair","spec":"Gynecologist","exp":14,"fee":900,"color":"#be185d","about":"Women's health, pregnancy care and PCOS.","slots":["10:00","11:30","14:00","16:00","17:30"]},
    {"id":6,"name":"Dr. Sanjay Kulkarni","spec":"Orthopedist","exp":18,"fee":1000,"color":"#b45309","about":"Joint pain, fractures and sports injuries.","slots":["09:30","11:30","13:00","15:30","17:00"]},
]


def get_db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    con = get_db()
    con.executescript("""
    CREATE TABLE IF NOT EXISTS doctors(
        id INTEGER PRIMARY KEY, name TEXT, spec TEXT, exp INTEGER,
        fee INTEGER, color TEXT, about TEXT, slots TEXT);
    CREATE TABLE IF NOT EXISTS bookings(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id TEXT UNIQUE, doctor_id INTEGER,
        appt_date TEXT, appt_time TEXT,
        patient_name TEXT, phone TEXT, email TEXT, reason TEXT,
        status TEXT DEFAULT 'Confirmed',
        remind_24h INTEGER DEFAULT 0, remind_2h INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now','localtime')));
    """)
    if con.execute("SELECT COUNT(*) c FROM doctors").fetchone()["c"] == 0:
        for d in DOCTORS_SEED:
            con.execute("INSERT INTO doctors VALUES(?,?,?,?,?,?,?,?)",
                        (d["id"], d["name"], d["spec"], d["exp"], d["fee"],
                         d["color"], d["about"], json.dumps(d["slots"])))
    con.commit()
    con.close()


def all_doctors():
    con = get_db()
    rows = con.execute("SELECT * FROM doctors ORDER BY id").fetchall()
    con.close()
    return [dict(r) | {"slots": json.loads(r["slots"])} for r in rows]


def get_doctor(doc_id):
    con = get_db()
    row = con.execute("SELECT * FROM doctors WHERE id=?", (doc_id,)).fetchone()
    con.close()
    return dict(row) | {"slots": json.loads(row["slots"])} if row else None


def create_booking(doctor_id, date, time, name, phone, email="", reason=""):
    booking_id = "CC" + str(1000 + (os.urandom(2)[0] * 256 + os.urandom(1)[0]) % 9000)
    con = get_db()
    con.execute(
        "INSERT INTO bookings(booking_id,doctor_id,appt_date,appt_time,patient_name,phone,email,reason)"
        " VALUES(?,?,?,?,?,?,?,?)",
        (booking_id, doctor_id, date, time, name, phone, email, reason))
    con.commit()
    con.close()
    return booking_id


def list_bookings():
    con = get_db()
    rows = con.execute(
        "SELECT b.*, d.name doctor_name, d.spec FROM bookings b"
        " JOIN doctors d ON d.id=b.doctor_id ORDER BY b.id DESC").fetchall()
    con.close()
    return [dict(r) for r in rows]


def get_doctor_name(doc_id):
    d = get_doctor(doc_id)
    return d["name"] if d else "your doctor"


# ---------- doctor panel ----------
def doctor_bookings(doc_id=None, date=None, status=None):
    sql = ("SELECT b.*, d.name doctor_name, d.spec doctor_spec, d.color doctor_color"
           " FROM bookings b JOIN doctors d ON d.id=b.doctor_id WHERE 1=1")
    params = []
    if doc_id:
        sql += " AND b.doctor_id=?"; params.append(doc_id)
    if date:
        sql += " AND b.appt_date=?"; params.append(date)
    if status:
        sql += " AND b.status=?"; params.append(status)
    sql += " ORDER BY b.appt_date, b.appt_time"
    con = get_db()
    rows = con.execute(sql, params).fetchall()
    con.close()
    return [dict(r) for r in rows]


def get_booking(booking_id):
    con = get_db()
    row = con.execute(
        "SELECT b.*, d.name doctor_name, d.spec doctor_spec, d.color doctor_color"
        " FROM bookings b JOIN doctors d ON d.id=b.doctor_id"
        " WHERE b.booking_id=?", (booking_id,)).fetchone()
    con.close()
    return dict(row) if row else None


def update_booking_status(booking_id, status):
    con = get_db()
    con.execute("UPDATE bookings SET status=? WHERE booking_id=?", (status, booking_id))
    con.commit()
    con.close()
