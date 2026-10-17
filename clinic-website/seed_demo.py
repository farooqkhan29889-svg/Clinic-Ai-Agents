"""Create demo appointments so the doctor dashboard has data.

Run once:   python seed_demo.py
"""
from datetime import datetime, timedelta

from database import BookingError, book_appointment, init_db

SAMPLES = [
    # name,            phone,        reason,                                doctor_id, day_offset, time
    ("Ayesha Begum",    "9812345601", "Headache and mild fever since 2 days", 1, 1, "10:15"),
    ("Mohammed Irfan",  "9812345602", "Chest discomfort on climbing stairs",  2, 1, "11:30"),
    ("Sneha Reddy",     "9812345603", "Skin rash on both arms",               3, 1, "15:30"),
    ("Vikram Singh",    "9812345604", "Knee pain after morning walk",         6, 2, "09:30"),
    ("Fatima Noor",     "9812345605", "Routine pregnancy checkup",            5, 2, "11:30"),
    ("Arjun Desai",     "9812345606", "Child fever and cough",                4, 2, "16:30"),
]

init_db()
today = datetime.now().date()
for name, phone, reason, doc, off, time in SAMPLES:
    day = (today + timedelta(days=off)).strftime("%Y-%m-%d")
    try:
        bid = book_appointment(doc, day, time, name, phone, reason=reason)
    except BookingError as exc:
        print(f"skipped {name}: {exc}")
        continue
    print(f"created {bid}: {name} -> doctor {doc} on {day} {time}")
print("\nDone! Open http://127.0.0.1:5000/doctor - password is citycare<doctor id>123")
