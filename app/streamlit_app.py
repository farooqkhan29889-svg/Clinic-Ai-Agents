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

The look lives in _CSS below plus .streamlit/config.toml. Patient-supplied text
is never put inside HTML - it goes through st.markdown/st.caption, and only
fixed strings are wrapped in the pill and chip markup.
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

_CSS = """
<style>
/* ---------- page ---------- */
.stApp {
  background:
    radial-gradient(1000px 460px at 92% -10%, rgba(15,118,110,.10), transparent 62%),
    radial-gradient(820px 420px at -8% 2%, rgba(13,148,136,.07), transparent 58%),
    #fcfeff;
}
[data-testid="stMainBlockContainer"] { padding-top: 2rem; padding-bottom: 3.5rem; }
[data-testid="stHeader"] { background: transparent; }
[data-testid="stAppDeployButton"] { display: none; }
h1, h2, h3 { letter-spacing: -.02em; color: #0b1f2d; }
[data-testid="stCaptionContainer"] { color: #64748b; font-size: .8rem; }
[data-testid="stMarkdownContainer"] p { line-height: 1.55; }
[data-testid="stHorizontalBlock"] { gap: 1rem; }

/* ---------- banner ---------- */
.cc-hero { border: 1px solid #dbe7ea; border-radius: 18px; padding: 1.05rem 1.3rem;
  background: linear-gradient(135deg, #ffffff 0%, #eff9f7 100%);
  box-shadow: 0 1px 3px rgba(15,23,42,.06); margin-bottom: 1.15rem; }
.cc-eyebrow { font-size: .68rem; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; color: #0f766e; }
.cc-title { font-size: 1.5rem; font-weight: 700; color: #0b1f2d; margin-top: .15rem; }
.cc-sub { color: #475569; font-size: .88rem; margin-top: .3rem; line-height: 1.5; }
.cc-chips { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .8rem; }
.cc-chip { font-size: .74rem; color: #134e4a; background: #fff;
  border: 1px solid #d6e6e3; border-radius: 999px; padding: .24rem .68rem; }

/* ---------- pills and reference numbers ---------- */
.cc-pill { display: inline-block; font-size: .72rem; font-weight: 600;
  padding: .18rem .6rem; border-radius: 999px; border: 1px solid transparent; }
.cc-ok   { color: #065f46; background: #d1fae5; border-color: #a7f3d0; }
.cc-done { color: #1e40af; background: #dbeafe; border-color: #bfdbfe; }
.cc-off  { color: #64748b; background: #f1f5f9; border-color: #e2e8f0; }
.cc-ref { font-family: ui-monospace, SFMono-Regular, monospace; font-size: .78rem;
  color: #334155; background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 6px; padding: .1rem .4rem; }
.cc-label { font-size: .66rem; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: #94a3b8; }

/* ---------- metrics ---------- */
[data-testid="stMetric"] { border: 1px solid #e3ecef; border-radius: 14px;
  padding: .75rem 1rem; background: #fff; box-shadow: 0 1px 2px rgba(15,23,42,.05); }
[data-testid="stMetricLabel"] { color: #64748b; font-size: .68rem; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase; }
[data-testid="stMetricValue"] { color: #0b1f2d; font-size: 1.65rem; font-weight: 700; }

/* ---------- buttons ---------- */
[data-testid="stBaseButton-secondary"], [data-testid="stFormSubmitButton"] button {
  border-radius: 10px; font-weight: 600; padding: .45rem 1.05rem;
  border: 1px solid #cbd5e1; box-shadow: none; transition: border-color .15s, color .15s; }
[data-testid="stBaseButton-secondary"]:hover { border-color: #0f766e; color: #0f766e; }
[data-testid="stFormSubmitButton"] button[kind="primary"] {
  background: #0f766e; border-color: #0f766e; color: #fff; }
[data-testid="stFormSubmitButton"] button[kind="primary"]:hover {
  background: #115e59; border-color: #115e59; color: #fff; }

/* ---------- inputs ---------- */
[data-testid="stTextInput"] > div, [data-testid="stTextArea"] > div {
  border-radius: 10px; border-color: #cbd5e1; }
[data-testid="stSelectbox"] div[data-baseweb="select"] > div {
  border-radius: 10px; border-color: #cbd5e1; }
[data-testid="stForm"] { border: 1px solid #e3ecef; border-radius: 18px; background: #fff;
  padding: 1.1rem 1.2rem; box-shadow: 0 1px 3px rgba(15,23,42,.05); }

/* ---------- sidebar ---------- */
[data-testid="stSidebar"] { border-right: 1px solid #e2e8f0; }
[data-testid="stSidebarContent"] { padding-top: 1.1rem; }
.cc-brand { display: flex; align-items: center; gap: .6rem; margin-bottom: 1rem; }
.cc-mark { width: 34px; height: 34px; border-radius: 10px; display: grid;
  place-items: center; background: #0f766e; color: #fff; font-weight: 700;
  font-size: .78rem; letter-spacing: .02em; }
.cc-name { font-weight: 700; color: #0b1f2d; font-size: .97rem; line-height: 1.1; }
.cc-tag { color: #64748b; font-size: .72rem; }
.cc-nav { font-size: .66rem; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; color: #94a3b8; margin: .2rem 0 .35rem; }
[data-testid="stSidebar"] [data-testid="stRadioGroup"] { gap: .18rem; }
[data-testid="stSidebar"] [data-testid="stRadioOption"] { border-radius: 10px;
  padding: .42rem .6rem; color: #334155; font-size: .88rem; }
[data-testid="stSidebar"] [data-testid="stRadioOption"]:hover { background: #e6f4f1; }
[data-testid="stSidebar"] [data-testid="stRadioOption"][data-selected="true"] {
  background: #0f766e; color: #fff; font-weight: 600; }
[data-testid="stSidebar"] [data-testid="stRadioOption"] > div > div:not([data-testid]) {
  display: none; }
.cc-contact { border-top: 1px solid #d8e5e2; margin-top: 1.1rem; padding-top: .8rem; }

/* ---------- chat, alerts, expanders ---------- */
[data-testid="stChatMessage"] { border-radius: 14px; border: 1px solid #e3ecef;
  background: #fff; }
[data-testid="stChatInput"] textarea { border-radius: 12px; }
[data-testid="stAlertContainer"] { border-radius: 12px; }
[data-testid="stExpander"] { border: 1px solid #e3ecef; border-radius: 12px;
  background: #fbfdfe; }
</style>
"""

st.markdown(_CSS, unsafe_allow_html=True)


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


def hero(title, sub, chips=(), eyebrow="CityCare Clinic"):
    """Banner at the top of a page. Every string here is app copy, not patient data."""
    chip_html = "".join(f'<span class="cc-chip">{html.escape(str(c))}</span>'
                        for c in chips)
    st.markdown(
        f'<div class="cc-hero"><div class="cc-eyebrow">{html.escape(eyebrow)}</div>'
        f'<div class="cc-title">{html.escape(title)}</div>'
        f'<div class="cc-sub">{html.escape(sub)}</div>'
        + (f'<div class="cc-chips">{chip_html}</div>' if chips else "")
        + "</div>",
        unsafe_allow_html=True)


_PILL = {"Confirmed": "cc-ok", "Completed": "cc-done", "Cancelled": "cc-off"}


def pill(status):
    return (f'<span class="cc-pill {_PILL.get(status, "cc-off")}">'
            f'{html.escape(str(status))}</span>')


def chip_row(items, label=None):
    head = f'<span class="cc-label">{label}</span> ' if label else ""
    return (f'<div class="cc-chips">{head}'
            + "".join(f'<span class="cc-chip">{html.escape(str(i))}</span>'
                      for i in items) + "</div>")


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


# ================= sidebar =================
st.sidebar.markdown(
    '<div class="cc-brand"><div class="cc-mark">CC</div><div>'
    '<div class="cc-name">CityCare Clinic</div>'
    '<div class="cc-tag">Multi-speciality care</div></div></div>',
    unsafe_allow_html=True)
st.sidebar.markdown('<div class="cc-nav">Menu</div>', unsafe_allow_html=True)
page = st.sidebar.radio("Go to", ["Book appointment", "Doctors and fees",
                                  "Chat assistant", "Doctor panel"],
                        label_visibility="collapsed")
if st.sidebar.button("Send due reminders now"):
    st.sidebar.write(process_due_reminders())
st.sidebar.markdown(
    f'<div class="cc-contact"><div class="cc-nav">Clinic</div>'
    f'<div class="cc-tag">{html.escape(CLINIC["address"])}</div>'
    f'<div class="cc-tag">{html.escape(CLINIC["hours"])} - Sunday closed</div>'
    f'<div class="cc-tag">{html.escape(CLINIC["phone"])}</div></div>',
    unsafe_allow_html=True)
if not os.getenv("CLINIC_DB"):
    st.sidebar.warning("CLINIC_DB is unset: bookings live in clinic.db inside the "
                       "container, so a redeploy deletes them. Point it at a mounted "
                       "volume, e.g. CLINIC_DB=/data/clinic.db")

# ================= book appointment =================
if page == "Book appointment":
    hero("Book an appointment",
         "Choose a specialist and a time slot. The confirmation goes to WhatsApp and "
         "SMS as soon as you submit.",
         chips=[CLINIC["hours"], f"Call {CLINIC['phone']}", "Sunday closed",
                "Free follow-up within 7 days", "In-house lab and X-ray"])
    doctors = all_doctors()
    with st.form("wizard"):
        left, right = st.columns(2)
        with left:
            doc = st.selectbox("Doctor", doctors,
                               format_func=lambda d: f"{d['name']} - {d['spec']} "
                                                     f"(Rs {d['fee']})")
        with right:
            day = st.selectbox("Date", upcoming_days(), format_func=label_day)
        st.caption(f"{doc['spec']} - {doc['exp']} years of experience - consultation "
                   f"Rs {doc['fee']}")
        slots = free_slots(doc["id"], day)
        left, right = st.columns(2)
        with left:
            time = (st.selectbox("Time", slots) if slots
                    else st.warning("Fully booked on that date - pick another day."))
        with right:
            st.write("")
            st.caption(f"{len(slots)} of {len(doc['slots'])} slots still open on "
                       f"{label_day(day)}")
        left, right = st.columns(2)
        with left:
            name = st.text_input("Patient name", max_chars=60)
        with right:
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
                st.markdown(chip_row([f"Reference {bid}", doc["name"],
                                      f"{label_day(day)} {time}", "Rs " + str(doc["fee"]),
                                      "Report on WhatsApp"], label="Summary"),
                            unsafe_allow_html=True)
                st.info("To cancel later, use the chat assistant: it needs the "
                        "booking ID and the mobile number on that booking.")

# ================= doctors =================
elif page == "Doctors and fees":
    hero("Our specialists",
         "Six departments under one roof. Book online, pay at the counter, and get "
         "digital reports on WhatsApp the same day.",
         chips=["Blood tests", "X-ray", "Sonography", "Same-day digital reports"])
    docs = all_doctors()
    for start in range(0, len(docs), 2):
        cols = st.columns(2)
        for col, d in zip(cols, docs[start:start + 2]):
            card = col.container(border=True)
            with card:
                st.markdown(f"**{d['name']}**")
                st.caption(f"{d['spec']} - {d['exp']} years - Rs {d['fee']} consultation")
                st.write(d["about"])
                st.markdown(chip_row(d["slots"], label="Slots"),
                            unsafe_allow_html=True)
    st.info(f"Open {CLINIC['hours']}, Sunday closed. Clinic phone {CLINIC['phone']}. "
            f"Follow-up within 7 days is free. In-house lab: blood tests, X-ray and "
            f"sonography with same-day digital reports on WhatsApp.")

# ================= chat assistant =================
elif page == "Chat assistant":
    hero("Chat assistant",
         "Ask about doctors, fees, timings or test reports. It can also book and "
         "cancel without leaving the chat.",
         chips=["24/7 online booking", "Cancellations need booking ID + mobile"])
    st.session_state.setdefault("chat_id", uuid.uuid4().hex[:16])
    st.session_state.setdefault("chat_log", [])

    def send(text):
        st.session_state.chat_log.append({"role": "user", "text": text})
        reply = chat_reply(st.session_state.chat_id, text, all_doctors())
        st.session_state.chat_log.append({"role": "assistant",
                                          "text": rich(reply["reply"]),
                                          "actions": reply["actions"]})

    if not st.session_state.chat_log:
        with st.container(border=True):
            st.markdown("**Try one of these**")
            for col, hint in zip(st.columns(4),
                                 ["I want to book an appointment", "Doctors and fees",
                                  "Opening hours?", "How to cancel?"]):
                if col.button(hint, key=f"hint{hint}"):
                    send(hint)
                    st.rerun()

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
        hero("Doctor panel", "Sign in to see the appointments booked with you.",
             eyebrow="Staff access")
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
            st.info("No appointments match this filter. Clear the date or status "
                    "above to see everything.")
        for b in rows:
            with st.container(border=True):
                c1, c2, c3, c4 = st.columns([3, 2, 2, 2])
                c1.markdown(f"**{b['patient_name']}**")
                c1.caption(f"Booked {b['created_at']}")
                c2.markdown(f"{label_day(b['appt_date'])}")
                c2.caption(f"{b['appt_time']} - `{b['booking_id']}`")
                c3.markdown(f"{b['doctor_name']}"
                            + ("\n*other doctor*" if view == "all" and
                               b["doctor_id"] != doc_id else ""))
                c4.markdown(pill(b["status"]), unsafe_allow_html=True)
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
