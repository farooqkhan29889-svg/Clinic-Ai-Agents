"""CityCare - Streamlit UI (the only front end).

    streamlit run streamlit_app.py

One script, four pages: booking wizard, doctors, chat assistant, doctor panel.
Every write goes through the shared Python brain, so there is exactly one path
for each rule:
  bookings   -> database.book_appointment()      (all rules, one path)
  chatbot    -> chatbot.chat_reply()             (state stays in SQLite)
  reminders  -> reminders.process_due_reminders()

Streamlit re-runs this script on every interaction, so there is no background
reminder thread: use the sidebar button, or run `python reminders.py` from cron.
"""
import html
import os
import re
import uuid
from datetime import date, timedelta

import streamlit as st

from chatbot import CLINIC, chat_reply
from database import (BookingError, SlotTakenError, all_doctors, book_appointment,
                      count_doctor_bookings, default_demo_password, doctor_bookings,
                      free_slots, get_booking, get_doctor, init_db,
                      update_booking_status, verify_doctor_password)
from reminders import (process_due_reminders, send_confirmation, send_sms,
                       send_whatsapp)

PER_PAGE = 25
STATUSES = ("Confirmed", "Completed", "Cancelled")

init_db()

try:
    st.set_page_config(page_title="CityCare Clinic", page_icon=":material/add:",
                       layout="wide", initial_sidebar_state="collapsed")
except TypeError:                       # very old Streamlit has no sidebar state arg
    st.set_page_config(page_title="CityCare Clinic", page_icon=":material/add:",
                       layout="wide")


def rich(text):
    """Chatbot replies carry HTML. Escape everything first so a patient's name can
    never inject markup, then restore only the tags this project emits."""
    out = html.escape(str(text), quote=False)
    out = re.sub(r"&lt;br\s*/?&gt;", "\n\n", out)
    out = (out.replace("&amp;#8226;", "- ").replace("&amp;#8377;", "Rs ")
              .replace("&amp;#8377", "Rs ").replace("&amp;middot;", " - "))
    for tag, mark in (("b", "**"), ("i", "*")):
        out = out.replace(f"&lt;{tag}&gt;", mark).replace(f"&lt;/{tag}&gt;", mark)
    return out


def upcoming_days(n=10):
    today = date.today()
    return [(today + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(n + 1)]


def label_day(iso):
    if not iso:
        return "Any date"
    prefix = "Today - " if iso == date.today().strftime("%Y-%m-%d") else ""
    return prefix + date.fromisoformat(iso).strftime("%a, %d %b")


def notify_status_change(b, status):
    """Notify the patient the way a cancel/complete from the dashboard should."""
    if status == "Cancelled":
        msg = (f"CityCare: your appointment {b['booking_id']} with {b['doctor_name']} "
               f"on {b['appt_date']} at {b['appt_time']} was cancelled. Call us to rebook.")
        send_whatsapp(b["phone"], msg)
        send_sms(b["phone"], msg)
    elif status == "Completed":
        send_whatsapp(b["phone"], f"CityCare: thank you for visiting! Your consultation "
                                  f"({b['booking_id']}) is complete. Get well soon.")


st.sidebar.title("CityCare Clinic")
st.sidebar.caption(CLINIC["address"])
st.sidebar.caption(CLINIC["hours"])
st.sidebar.caption(CLINIC["phone"])
page = st.sidebar.radio("Go to", ["Book appointment", "Doctors and fees",
                                  "Chat assistant", "Doctor panel"],
                        label_visibility="collapsed")
if st.sidebar.button("Send due reminders now"):
    st.sidebar.write(process_due_reminders())
if not os.getenv("CLINIC_DB"):
    st.sidebar.warning("CLINIC_DB is unset: bookings live in clinic.db inside the "
                       "container, so a redeploy deletes them. Point it at a mounted "
                       "volume, e.g. CLINIC_DB=/data/clinic.db")

# ================= book appointment =================
if page == "Book appointment":
    st.title("Book an appointment")
    doctors = all_doctors()
    with st.form("wizard"):
        doc = st.selectbox("Doctor", doctors,
                           format_func=lambda d: f"{d['name']} - {d['spec']} "
                                                 f"(Rs {d['fee']})")
        day = st.selectbox("Date", upcoming_days(), format_func=label_day)
        slots = free_slots(doc["id"], day)
        time = (st.selectbox("Time", slots) if slots
                else st.warning("Fully booked on that date - pick another day."))
        name = st.text_input("Patient name", max_chars=60)
        phone = st.text_input("10-digit mobile", max_chars=15)
        email = st.text_input("Email (optional)", max_chars=120)
        reason = st.text_area("Reason for visit (optional)", max_chars=300)
        go = st.form_submit_button("Confirm booking", type="primary")

    if go:
        if not slots:
            st.error("That date has no free slot for this doctor.")
        else:
            try:
                bid = book_appointment(doc["id"], day, time, name, phone, email, reason)
            except SlotTakenError:
                rest = free_slots(doc["id"], day)
                st.error(f"{time} was just taken. Still free on {label_day(day)}: "
                         f"{', '.join(rest) if rest else 'nothing'}")
            except BookingError as exc:
                st.error(str(exc))
            else:
                b = get_booking(bid)
                send_confirmation(bid, b["doctor_name"], b["appt_date"], b["appt_time"],
                                  b["patient_name"], b["phone"])
                st.success(f"Booking **{bid}** confirmed - {doc['name']}, "
                           f"{label_day(day)} at {time}. WhatsApp + SMS sent to "
                           f"{b['phone']}.")
                st.info("To cancel later, use the chat assistant: it needs the "
                        "booking ID and the mobile number on that booking.")

# ================= doctors =================
elif page == "Doctors and fees":
    st.title("Our specialists")
    for d in all_doctors():
        with st.container(border=True):
            st.markdown(f"### {d['name']}")
            st.caption(f"{d['spec']} - {d['exp']} years - Rs {d['fee']} consultation")
            st.write(d["about"])
            st.write("**Slots:** " + ", ".join(d["slots"]))
    st.info(f"Open {CLINIC['hours']}, Sunday closed. Clinic phone {CLINIC['phone']}. "
            f"Follow-up within 7 days is free. In-house lab: blood tests, X-ray and "
            f"sonography with same-day digital reports on WhatsApp.")

# ================= chat assistant =================
elif page == "Chat assistant":
    st.title("Chat assistant")
    st.session_state.setdefault("chat_id", uuid.uuid4().hex[:16])
    st.session_state.setdefault("chat_log", [])

    def send(text):
        st.session_state.chat_log.append({"role": "user", "text": text})
        reply = chat_reply(st.session_state.chat_id, text, all_doctors())
        st.session_state.chat_log.append({"role": "assistant",
                                          "text": rich(reply["reply"]),
                                          "actions": reply["actions"]})

    for entry in st.session_state.chat_log:
        with st.chat_message(entry["role"]):
            st.markdown(entry["text"])

    asked = st.chat_input("book, doctors, fees, timings, cancel an appointment")
    if asked:
        send(asked)
        st.rerun()

    actions = (st.session_state.chat_log[-1].get("actions")
               if st.session_state.chat_log else []) or []
    for start in range(0, len(actions), 4):          # rows of 4: 6 doctors must all show
        cols = st.columns(4)
        for col, act in zip(cols, actions[start:start + 4]):
            if col.button(act["t"], key=f"quick{start}-{act['m']}"):
                send(act["m"])
                st.rerun()

    if st.button("End this chat"):
        st.session_state.pop("chat_id", None)
        st.session_state.chat_log = []
        st.rerun()

# ================= doctor panel =================
else:
    doc_id = st.session_state.get("doctor_id")

    if not doc_id:
        st.title("Doctor login")
        with st.form("login"):
            pick = st.selectbox("Doctor", all_doctors(), format_func=lambda d: d["name"])
            pw = st.text_input("Password", type="password")
            ok = st.form_submit_button("Log in", type="primary")
        if ok:
            if verify_doctor_password(pick["id"], pw):
                st.session_state["doctor_id"] = pick["id"]
                st.rerun()
            st.error("Wrong doctor or password")
        if os.getenv("SHOW_DEMO_HINT", "1") == "1":
            st.caption(f"Demo password: `citycare<doctor id>123` (doctor 1 = "
                       f"`{default_demo_password(1)}`). Change it with "
                       f"`python set_password.py <doctor_id> <new password>`")

    else:
        me = get_doctor(doc_id)
        top = st.columns([4, 1])
        top[0].title(f"Welcome, {me['name']}")
        top[0].caption(f"{me['spec']} - today is "
                       f"{date.today().strftime('%d %b %Y')}")
        if top[1].button("Log out"):
            st.session_state.pop("doctor_id", None)
            st.rerun()

        f1, f2, f3 = st.columns(3)
        view = f1.selectbox("Scope", ["mine", "all"],
                            format_func=lambda v: "My patients" if v == "mine"
                            else "All doctors")
        status_f = f2.selectbox("Status", [""] + list(STATUSES),
                                format_func=lambda s: s or "All statuses")
        date_f = f3.selectbox("Date", [""] + upcoming_days(14), format_func=label_day)
        scope = None if view == "all" else doc_id

        m1, m2, m3 = st.columns(3)
        today_iso = date.today().strftime("%Y-%m-%d")
        m1.metric("Appointments today", count_doctor_bookings(doc_id=scope,
                                                              date=today_iso))
        m2.metric("Confirmed (in view)",
                  count_doctor_bookings(doc_id=scope, date=date_f or None,
                                        status="Confirmed"))
        m3.metric("Completed (in view)",
                  count_doctor_bookings(doc_id=scope, date=date_f or None,
                                        status="Completed"))

        total = count_doctor_bookings(doc_id=scope, date=date_f or None,
                                      status=status_f or None)
        pages = max(1, -(-total // PER_PAGE))
        page_no = min(max(1, st.session_state.get("dash_page", 1)), pages)
        rows = doctor_bookings(doc_id=scope, date=date_f or None, status=status_f or None,
                               limit=PER_PAGE, offset=(page_no - 1) * PER_PAGE)

        if not rows:
            st.write("No appointments found for this filter.")
        for b in rows:
            with st.container(border=True):
                c1, c2, c3, c4 = st.columns([3, 2, 2, 3])
                c1.markdown(f"**{b['patient_name']}**  \n`{b['booking_id']}`")
                c2.write(f"{b['appt_date']}  \n{b['appt_time']}")
                c3.write(f"{b['doctor_name']}"
                         + ("\n*other doctor*" if view == "all" and
                            b["doctor_id"] != doc_id else ""))
                c4.markdown(f"Status: **{b['status']}**")
                owned = b["doctor_id"] == doc_id
                with st.expander("Patient details"):
                    st.write(f"Phone `{b['phone']}` - {b['email'] or 'no email'}")
                    st.write(f"Reason: {b['reason'] or '-'}")
                    st.write(f"Booked at: {b['created_at']}")
                    if not owned:
                        st.caption("Read-only: only the treating doctor can change "
                                   "this appointment.")
                    else:
                        buttons = st.columns(len(STATUSES))
                        for col, status in zip(buttons, STATUSES):
                            if status == b["status"]:
                                continue
                            if col.button(f"Mark {status}", key=f"s{b['id']}{status}"):
                                try:
                                    update_booking_status(b["booking_id"], status,
                                                          owner_id=doc_id)
                                except BookingError as exc:
                                    st.error(str(exc))
                                else:
                                    notify_status_change(b, status)
                                    st.session_state["dash_note"] = (
                                        f"{b['booking_id']} marked {status}.")
                                    st.rerun()

        note = st.session_state.pop("dash_note", None)
        if note:
            st.success(note + " Patient notified on WhatsApp + SMS.")

        n1, n2, n3 = st.columns([3, 1, 1])
        n1.write(f"{total} appointment{'s' if total != 1 else ''} in this view "
                 f"- page {page_no} of {pages}")
        if page_no > 1 and n2.button("Prev", key="prev"):
            st.session_state["dash_page"] = page_no - 1
            st.rerun()
        if page_no < pages and n3.button("Next", key="next"):
            st.session_state["dash_page"] = page_no + 1
            st.rerun()
