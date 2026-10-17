"""Create demo appointments so the doctor dashboard has data.

Run once:   python seed_demo.py
"""
from datetime import datetime, timedelta

from database import create_booking, init_db

SAMPLES = [
    # name,            phone,        reason,                                doctor_id, day_offset, time
    ("Ayesha Begum",    "9812345601", "Headache and mild fever since 2 days", 1, 0, "10:15"),
    ("Mohammed Irfan",  "9812345602", "Chest discomfort on climbing stairs",  2, 0, "11:30"),
    ("Sneha Reddy",     "9812345603", "Skin rash on both arms",               3, 0, "15:30"),
    ("Vikram Singh",    "9812345604", "Knee pain after morning walk",         6, 1, "09:30"),
    ("Fatima Noor",     "9812345605", "Routine pregnancy checkup",            5, 1, "11:30"),
    ("Arjun Desai",     "9812345606", "Child fever and cough",                4, 1, "16:30"),
]

init_db()
today = datetime.now()
for name, phone, reason, doc, off, time in SAMPLES:
    date = (today + timedelta(days=off)).strftime("%Y-%m-%d")
    bid = create_booking(doc, date, time, name, phone, reason=reason)
    print(f"created {bid}: {name} -> doctor {doc} on {date} {time}")
print("\nDone! Open http://127.0.0.1:5000/doctor and log in (password: citycare123)")
