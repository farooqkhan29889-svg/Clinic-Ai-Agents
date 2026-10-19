"""CityCare Clinic: a complete, template-inspired appointment website."""
import html
import os
import uuid
from datetime import date, timedelta
from pathlib import Path

import streamlit as st

from chatbot import CLINIC, chat_reply
from database import (BookingError, SlotTakenError, all_doctors, book_appointment,
                      count_doctor_bookings, default_demo_password, doctor_bookings,
                      free_slots, get_booking, get_doctor, init_db,
                      update_booking_status, verify_doctor_password)
from reminders import process_due_reminders, send_confirmation, send_sms, send_whatsapp

st.set_page_config(page_title="CityCare Clinic", page_icon="🏥", layout="wide")
init_db()
STATUSES = ("Confirmed", "Completed", "Cancelled")
HERO_IMAGE = "https://images.unsplash.com/photo-1758691461935-202e2ef6b69f?auto=format&fit=crop&w=1400&q=85"
CARE_IMAGE = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=85"

_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Roboto:wght@400;500;700&display=swap');
:root{--terra:#c85d38;--terra-dark:#a84724;--cocoa:#481e0b;--ink:#30221d;--muted:#786b65;--cream:#e8f3ed;--line:#d5e5db;--pale:#e2f0e8}
html,body,[data-testid="stAppViewContainer"]{width:100%;max-width:100vw;overflow-x:hidden!important}
.stApp{overflow-x:hidden;background:radial-gradient(ellipse at 12% 0%,#d8ecdf 0%,transparent 36%),radial-gradient(ellipse at 92% 16%,#d9eee5 0%,transparent 34%),linear-gradient(180deg,#f4faf6 0%,var(--cream) 52%,#e3f0e8 100%);color:var(--ink);font-family:'Roboto',Arial,sans-serif}
.stApp button,.stApp input,.stApp textarea,.stApp select,.stApp label,.stApp [data-testid="stMarkdownContainer"],.stApp [data-testid="stCaptionContainer"]{font-family:'Roboto',Arial,sans-serif}
[data-testid="stMainBlockContainer"]{max-width:1320px;padding:.65rem 2.2rem 3rem}[data-testid="stHeader"]{background:transparent}[data-testid="stAppDeployButton"]{display:none}
h1,h2,h3,h4{color:var(--cocoa);font-family:'Poppins',Arial,sans-serif;font-weight:700;letter-spacing:-.035em}h2{margin-top:.5rem;font-size:1.8rem}
[data-testid="stMarkdownContainer"] p{line-height:1.65}[data-testid="stHorizontalBlock"]{gap:1rem}[data-testid="stCaptionContainer"]{color:var(--muted)}
.cc-topbar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;min-height:76px;margin:.35rem 0 .55rem;padding:.65rem 1rem;border:1px solid #eee4df;border-radius:16px;background:#ffffffd9;box-shadow:0 8px 26px #481e0b08}
.cc-top-left,.cc-top-right{color:var(--muted);font-size:.78rem;line-height:1.45}.cc-top-right{text-align:right}.cc-top-left strong,.cc-top-right strong{display:block;color:var(--cocoa);font-size:.68rem;letter-spacing:.1em;text-transform:uppercase}
.cc-phone-link{display:inline-flex;align-items:center;margin-top:.12rem;padding:.28rem .62rem;border:1px solid #cfe1d5;border-radius:999px;background:#edf7f0;color:#176541!important;font-weight:700;text-decoration:none!important;white-space:nowrap}.cc-phone-link:hover{background:#dceee2}
.cc-brand{display:flex;align-items:center;justify-content:center;gap:.7rem}.cc-brand-mark{display:grid;place-items:center;width:43px;height:43px;border-radius:15px;color:#fff;background:linear-gradient(145deg,#d97853,var(--terra-dark));font-family:'Poppins',sans-serif;font-size:1.15rem;font-weight:700;box-shadow:0 7px 16px #77371c25}
.cc-brand-name{color:var(--cocoa);font-family:'Poppins',sans-serif;font-size:1.08rem;font-weight:700;line-height:1.1}.cc-brand-tag{margin-top:.18rem;color:var(--muted);font-size:.68rem}
[data-testid="stRadio"]>div[role="radiogroup"]{display:flex;flex-wrap:nowrap;gap:.25rem;overflow-x:auto;border-bottom:1px solid var(--line);padding:.35rem 0 .7rem;scrollbar-width:none}
[data-testid="stRadio"]>div[role="radiogroup"]::-webkit-scrollbar{display:none}
[data-testid="stRadio"] label{flex:0 0 auto;padding:.48rem .85rem;border-radius:999px;white-space:nowrap;color:#64554d;font-size:.8rem;transition:.18s ease}
[data-testid="stRadio"] label:hover,[data-testid="stRadio"] label:has(input:checked){background:var(--pale);color:var(--terra-dark)}
[data-testid="stRadio"] label:nth-of-type(4){background:var(--terra);color:#fff!important;font-weight:700;box-shadow:0 5px 14px #a8472428}[data-testid="stRadio"] label:nth-of-type(4):hover,[data-testid="stRadio"] label:nth-of-type(4):has(input:checked){background:var(--terra-dark);color:#fff!important}
[data-testid="stRadio"] label div:first-child,[data-testid="stRadio"] label input[type="radio"]{display:none!important}
.cc-home-hero{display:grid;grid-template-columns:1.05fr .95fr;min-height:450px;margin:1.2rem 0 1.1rem;overflow:hidden;border:1px solid #eaded8;border-radius:24px;background:linear-gradient(115deg,#fffdfa 0%,#fffdfa 57%,#f4e8e3 100%);color:var(--ink);box-shadow:0 22px 58px #481e0b10}
.cc-home-copy{display:flex;flex-direction:column;justify-content:center;padding:3.25rem 2.5rem 3.25rem 3.1rem}.cc-kicker{margin-bottom:.95rem;color:var(--terra-dark);font-family:'Poppins',sans-serif;font-size:.68rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase}
.cc-home-title{max-width:690px;margin:0 0 1.05rem;color:var(--cocoa);font-family:'Poppins',sans-serif;font-size:clamp(2.7rem,4.2vw,4.45rem);font-weight:700;line-height:1.03;letter-spacing:-.06em}
.cc-home-lede{max-width:550px;color:#685a53;font-size:1.02rem;line-height:1.7}.cc-home-proof{display:flex;flex-wrap:wrap;gap:.5rem 1.15rem;margin-top:1.4rem;color:#51433c;font-size:.75rem}
.cc-home-proof span:before{content:'✓';margin-right:.42rem;color:var(--terra);font-weight:700}
.cc-hero-visual{position:relative;display:grid;min-height:390px;place-items:center;overflow:hidden;background:radial-gradient(ellipse at 74% 22%,#f5d8cb 0%,transparent 35%),radial-gradient(ellipse at 28% 76%,#edcbb7 0%,transparent 38%),linear-gradient(145deg,#f9f1ec,#f3e5dc)}
.cc-hero-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:58% center}.cc-hero-visual:after{position:absolute;inset:0;content:'';background:linear-gradient(90deg,#481e0b12 0%,transparent 55%,#481e0b10)}
.cc-hero-visual:before{content:'✚';position:absolute;z-index:1;display:grid;place-items:center;width:72px;height:72px;left:8%;top:10%;border:1px solid #ffffffa8;border-radius:50%;background:#fff9;color:#cd5f37;font-size:1.8rem;font-weight:300;box-shadow:0 12px 35px #481e0b0d}
.cc-hero-orbit{position:absolute;z-index:1;width:350px;height:350px;right:5%;top:10%;border:1px solid #ffffff8c;border-radius:50%;box-shadow:0 0 0 26px #ffffff24,0 0 0 58px #ffffff16}
.cc-hero-orbit:after{content:'';position:absolute;inset:60px;border:1px solid #481e0b24;border-radius:50%}
.cc-hero-card{position:relative;z-index:2;width:min(360px,82%);padding:1.35rem;border:1px solid #ffffffd9;border-radius:20px;background:#ffffffed;box-shadow:0 20px 42px #481e0b17}
.cc-card-kicker{color:var(--terra);font-family:'Poppins',sans-serif;font-size:.63rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase}.cc-card-title{margin:.55rem 0 .8rem;color:var(--cocoa);font-family:'Poppins',sans-serif;font-size:1.2rem;font-weight:700}
.cc-card-row{display:flex;align-items:center;gap:.65rem;padding:.57rem 0;border-top:1px solid #f0e8e3;color:#56473f;font-size:.76rem}.cc-card-icon{display:grid;flex:0 0 30px;place-items:center;height:30px;border-radius:50%;color:var(--terra-dark);background:var(--pale);font-weight:700}
[data-testid="stBaseButton-primary"],[data-testid="stFormSubmitButton"] button[kind="primary"]{border-color:var(--terra);border-radius:999px;background:var(--terra);color:#fff;box-shadow:0 8px 18px #a8472428}
[data-testid="stBaseButton-primary"]:hover,[data-testid="stFormSubmitButton"] button[kind="primary"]:hover{border-color:var(--terra-dark);background:var(--terra-dark);color:#fff}
[data-testid="stBaseButton-secondary"],[data-testid="stFormSubmitButton"] button{border:1px solid #dcc9bf;border-radius:999px;font-weight:600;box-shadow:none;transition:.18s ease}
[data-testid="stBaseButton-secondary"]:hover{color:var(--terra-dark);border-color:var(--terra)}
.cc-section-label{margin:1.85rem 0 .25rem;color:var(--terra);font-family:'Poppins',sans-serif;font-size:.67rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
.cc-section-intro{max-width:720px;margin:-.15rem 0 1rem;color:var(--muted)}.cc-about-card,.cc-contact-card{height:100%;padding:1.4rem;border:1px solid var(--line);background:#fff}
.cc-about-card{display:flex;min-height:245px;flex-direction:column;justify-content:space-between;overflow:hidden;border-radius:20px;background:linear-gradient(135deg,#fff 0%,#f5e9e2 100%)}
.cc-about-photo{display:block;width:100%;height:145px;object-fit:cover;object-position:center 55%}.cc-about-copy{padding:1rem 1.2rem 1.1rem}
.cc-about-mark{display:grid;place-items:center;width:54px;height:54px;margin-bottom:1rem;border-radius:50%;background:var(--terra);color:#fff;font-size:1.1rem;font-weight:700}
.cc-small-label{color:var(--muted);font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.cc-doctor-avatar{display:grid;place-items:center;width:62px;height:62px;margin-bottom:1rem;border-radius:50%;background:linear-gradient(135deg,#cd5f37,#481e0b);color:#fff;font-family:'Poppins',sans-serif;font-size:1.05rem;font-weight:700}
.cc-doctor-name{margin:0 0 .25rem;color:var(--cocoa);font-family:'Poppins',sans-serif;font-size:1.08rem;font-weight:700}.cc-fee{color:var(--terra-dark);font-size:.9rem;font-weight:700}
[data-testid="stVerticalBlockBorderWrapper"]{border-color:var(--line)!important;border-radius:16px!important;background:#fff;box-shadow:0 8px 28px #481e0b09}
[data-testid="stForm"]{border:1px solid var(--line);border-radius:18px;background:#fff;padding:1.25rem;box-shadow:0 8px 28px #481e0b0a}
[data-testid="stTextInput"]>div,[data-testid="stTextArea"]>div,[data-testid="stSelectbox"] div[data-baseweb="select"]>div{border-radius:4px;border-color:#d9c9c2}
[data-testid="stMetric"]{border:1px solid var(--line);border-radius:4px;background:#fff;padding:.8rem 1rem}[data-testid="stMetricLabel"]{color:var(--muted);font-size:.67rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}[data-testid="stMetricValue"]{color:var(--cocoa);font-family:'Poppins',sans-serif;font-size:1.5rem;font-weight:700}
.cc-page-hero{position:relative;overflow:hidden;margin:.9rem 0 1.4rem;padding:2rem 2.2rem;border-radius:22px;background:linear-gradient(110deg,#cd5f37 0%,#a84724 68%,#481e0b 100%);color:#fff;box-shadow:0 18px 38px #481e0b18}
.cc-page-hero:after{content:'';position:absolute;top:-110px;right:-50px;width:280px;height:280px;border:1px solid #ffffff3d;border-radius:50%;box-shadow:0 0 0 30px #ffffff0d}
.cc-page-kicker{color:#f9ddd1;font-family:'Poppins',sans-serif;font-size:.68rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase}.cc-page-title{position:relative;z-index:1;margin:.35rem 0;color:#fff;font-family:'Poppins',sans-serif;font-size:2rem;font-weight:700}.cc-page-sub{position:relative;z-index:1;max-width:740px;color:#fff1eb;line-height:1.6}
.cc-chip{display:inline-block;position:relative;z-index:1;margin:.35rem .3rem 0 0;padding:.28rem .72rem;border:1px solid #ffffff4d;border-radius:999px;color:#fff;font-size:.72rem}
.cc-pill{display:inline-block;padding:.2rem .6rem;border-radius:999px;font-size:.7rem;font-weight:700}.cc-ok{color:#16633b;background:#e0f3e8}.cc-done{color:#234c91;background:#e7eefb}.cc-off{color:#68615c;background:#f0edea}
.cc-facts-title{margin:.2rem 0 1rem}.cc-fact-card{height:100%;min-height:112px;padding:1.15rem 1.3rem;border:1px solid var(--line);border-left:3px solid var(--terra);border-radius:16px;background:#fff;box-shadow:0 8px 25px #481e0b08}.cc-fact-value{color:var(--cocoa);font-family:'Poppins',sans-serif;font-size:1.48rem;font-weight:700;line-height:1.25}.cc-fact-label{margin-top:.4rem;color:var(--muted);font-size:.74rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.cc-service-card{position:relative;height:100%;min-height:190px;margin-bottom:.65rem;padding:1.3rem;border:1px solid var(--line);border-radius:18px;background:#fff;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}.cc-service-card:hover{transform:translateY(-3px);border-color:#d5b4a4;box-shadow:0 14px 32px #481e0b10}.cc-service-icon{display:grid;place-items:center;width:46px;height:46px;margin-bottom:1.2rem;border-radius:14px;background:var(--pale);color:var(--terra-dark);font-family:'Poppins',sans-serif;font-size:.75rem;font-weight:700}.cc-service-card p{margin:.55rem 0 0;color:var(--muted);font-size:.83rem;line-height:1.65}
.cc-final-cta{margin-top:2rem;padding:2.2rem;border-radius:22px;color:#fff;background:linear-gradient(108deg,#cd5f37,#a84724 68%,#481e0b);box-shadow:0 16px 35px #481e0b16}.cc-final-cta h2{color:#fff;font-size:1.9rem}.cc-final-cta p{max-width:650px;color:#fff1eb}
.cc-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.85rem;margin-top:2.4rem;padding:1.2rem 0 .5rem;border-top:1px solid var(--line);color:var(--muted);font-size:.75rem}.cc-footer-copy{line-height:1.7}.cc-socials{display:flex;align-items:center;flex-wrap:wrap;gap:.5rem}.cc-social-link{display:inline-flex;align-items:center;gap:.4rem;padding:.48rem .78rem;border:1px solid #d5e5db;border-radius:999px;background:#fff;color:#245b40!important;font-size:.74rem;font-weight:700;text-decoration:none!important;transition:background .18s,border-color .18s,transform .18s}.cc-social-link:hover{transform:translateY(-1px);border-color:#9fc6ad;background:#edf7f0}.cc-social-symbol{display:grid;place-items:center;width:19px;height:19px;border-radius:50%;background:#e5f2e9;color:#176541;font-size:.67rem;font-weight:800}
[data-testid="stChatMessage"]{border:1px solid var(--line);border-radius:8px;background:#fff}[data-testid="stExpander"]{border:1px solid var(--line);border-radius:4px;background:#fff}[data-testid="stAlertContainer"]{border-radius:4px}
@media(max-width:760px){[data-testid="stMainBlockContainer"]{padding:.35rem 1rem 2.5rem}.cc-topbar{grid-template-columns:1fr auto;gap:.35rem;min-height:66px}.cc-brand{grid-column:1;justify-content:flex-start;grid-row:1}.cc-top-left{display:none}.cc-top-right{grid-column:2;grid-row:1;font-size:.69rem}.cc-home-hero{grid-template-columns:1fr}.cc-home-copy{padding:2.2rem 1.4rem 1.7rem}.cc-home-title{font-size:2.8rem}.cc-hero-visual{min-height:255px}.cc-hero-visual:before{width:58px;height:58px;left:6%;top:7%;font-size:1.45rem}.cc-hero-orbit{width:245px;height:245px;right:calc(50% - 122px);top:5px}.cc-hero-card{width:min(340px,84%);padding:1.05rem}.cc-about-photo{height:180px}.cc-page-hero{padding:1.6rem}[data-testid="stHorizontalBlock"]{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:.75rem}[data-testid="stHorizontalBlock"]>[data-testid="column"]{width:100%!important;max-width:100%!important;min-width:0!important}}
</style>
"""
_PLASERY_CSS = (Path(__file__).parent / "assets" / "plasery.css").read_text(encoding="utf-8")
st.markdown('<style>:root{--bs-primary:#cd5f37;--bs-dark:#481e0b;--bs-light:#f7f3f0;'
            '--bs-white:#fff;--bs-secondary:#786b65;--bs-secondery:#786b65;}</style>', unsafe_allow_html=True)
st.markdown(f"<style>\n{_PLASERY_CSS}\n</style>", unsafe_allow_html=True)
st.markdown(_CSS, unsafe_allow_html=True)


def esc(value):
    return html.escape(str(value or ""), quote=True)


def upcoming_days(n=14):
    return [(date.today() + timedelta(days=i)).isoformat() for i in range(n + 1)]


def label_day(value):
    prefix = "Today · " if value == date.today().isoformat() else ""
    return prefix + date.fromisoformat(value).strftime("%a, %d %b")


def hero(title, subtitle, eyebrow="CITYCARE CLINIC", chips=()):
    badges = "".join(f'<span class="cc-chip">{esc(chip)}</span>' for chip in chips)
    st.markdown(f'<section class="cc-page-hero"><div class="cc-page-kicker">{esc(eyebrow)}</div>'
                f'<div class="cc-page-title">{esc(title)}</div><div class="cc-page-sub">{esc(subtitle)}</div>{badges}</section>',
                unsafe_allow_html=True)


def go_to(label):
    # Store navigation intent for the next run. The radio widget owns its key
    # after it is created, so changing it in the same run raises a Streamlit error.
    st.session_state["pending_site_nav"] = label
    st.rerun()


def notify_status(booking, status):
    if status == "Cancelled":
        message = (f"CityCare: appointment {booking['booking_id']} with {booking['doctor_name']} "
                   f"on {booking['appt_date']} at {booking['appt_time']} was cancelled. Call us to rebook.")
        send_whatsapp(booking["phone"], message)
        send_sms(booking["phone"], message)
    elif status == "Completed":
        send_whatsapp(booking["phone"], f"CityCare: appointment {booking['booking_id']} is marked complete. Thank you.")


st.markdown('<div class="cc-topbar">'
            f'<div class="cc-top-left"><strong>Clinic hours</strong>{esc(CLINIC["hours"])} · Sunday closed</div>'
            '<div class="cc-brand"><div class="cc-brand-mark">C</div><div><div class="cc-brand-name">CityCare Clinic</div>'
            '<div class="cc-brand-tag">Care, closer to home</div></div></div>'
            f'<div class="cc-top-right"><strong>Call the clinic</strong><a class="cc-phone-link" href="tel:+918770465561">{esc(CLINIC["phone"])}</a></div></div>',
            unsafe_allow_html=True)

nav = {"Home":"Home", "Our doctors":"Doctors and fees", "Services":"Clinic information",
       "Appointments":"Book appointment", "Contact":"Contact", "Assistant":"Chat assistant", "Staff":"Doctor panel"}
pending_nav = st.session_state.pop("pending_site_nav", None)
if pending_nav in nav:
    st.session_state["site_nav"] = pending_nav
nav_label = st.radio("Main navigation", list(nav), horizontal=True, key="site_nav", label_visibility="collapsed")
page = nav[nav_label]
doctors = all_doctors()


if page == "Home":
    st.markdown(
        '<section class="cc-home-hero"><div class="cc-home-copy"><div class="cc-kicker">A WARM WELCOME TO CITYCARE</div>'
        '<h1 class="cc-home-title">Care that feels personal. Every visit.</h1>'
        '<div class="cc-home-lede">Meet our clinic doctors, see consultation fees clearly, and choose an appointment time that works for you.</div>'
        '<div class="cc-home-proof"><span>Three clinic doctors</span><span>Fees shown up front</span><span>Simple online booking</span></div></div>'
        '<div class="cc-hero-visual"><img class="cc-hero-photo" src="' + HERO_IMAGE + '" alt="A doctor listening to a patient during a clinic consultation" loading="lazy"><div class="cc-hero-orbit"></div><div class="cc-hero-card"><div class="cc-card-kicker">Plan your visit</div>'
        '<div class="cc-card-title">A clearer way to book care</div><div class="cc-card-row"><span class="cc-card-icon">01</span>Choose a clinic doctor</div>'
        '<div class="cc-card-row"><span class="cc-card-icon">02</span>Pick an available time</div><div class="cc-card-row"><span class="cc-card-icon">03</span>Keep your booking reference</div>'
        '</div></div></section>', unsafe_allow_html=True)
    first, second, call = st.columns([1, 1, 2])
    with first:
        if st.button("Make an appointment", type="primary", key="home_book"): go_to("Appointments")
    with second:
        if st.button("Meet the doctors", key="home_doctors"): go_to("Our doctors")
    with call:
        st.caption(f"Questions? Call {CLINIC['phone']} · {CLINIC['hours']}")

    about, glance = st.columns([1.1, .9], gap="large")
    with about:
        st.markdown('<div class="cc-section-label">ABOUT CITYCARE</div>', unsafe_allow_html=True)
        st.subheader("A thoughtful clinic visit, from the first step")
        st.markdown('<div class="cc-section-intro">Review the clinic team, consultation fees, and sample appointment availability before choosing a time. Keep your booking reference handy if you need to ask a question.</div>', unsafe_allow_html=True)
        if st.button("More about the clinic", key="home_about"): go_to("Services")
    with glance:
        st.markdown('<div class="cc-about-card"><img class="cc-about-photo" src="' + CARE_IMAGE + '" alt="Stethoscope on a clinic desk" loading="lazy"><div class="cc-about-copy"><div class="cc-small-label">CITYCARE AT A GLANCE</div>'
                    '<h3 style="margin:.35rem 0 .5rem">Personal care, clearly arranged</h3>'
                    '<p style="color:#786b65;margin:0">Doctor details, listed fees, clinic hours, and booking support in one place.</p>'
                    '<div class="cc-small-label" style="margin-top:.85rem">OPEN MONDAY TO SATURDAY</div></div></div>', unsafe_allow_html=True)

    fee_values = [int(d["fee"]) for d in doctors]
    facts = [(str(len(doctors)), "Clinic doctors"), (CLINIC["hours"].split(":")[0].strip(), "Clinic hours"),
             (f"₹{min(fee_values)}–₹{max(fee_values)}" if fee_values else "Call us", "Listed consultation fees")]
    st.markdown('<div class="cc-section-label">IMPORTANT FACTS</div>', unsafe_allow_html=True)
    st.markdown('<h2 class="cc-facts-title">The details, at a glance</h2>', unsafe_allow_html=True)
    fact_cols = st.columns(3)
    for col, (value, label) in zip(fact_cols, facts):
        with col:
            st.markdown(f'<div class="cc-fact-card"><div class="cc-fact-value">{esc(value)}</div>'
                        f'<div class="cc-fact-label">{esc(label)}</div></div>', unsafe_allow_html=True)

    st.markdown('<div class="cc-section-label">CLINIC SERVICES</div>', unsafe_allow_html=True)
    st.subheader("A simpler way to plan your visit")
    st.markdown('<div class="cc-section-intro">Find the right information, review your options, and book directly with CityCare.</div>', unsafe_allow_html=True)
    services = [
        ("01", "Doctor consultations", "Compare the clinic doctors, qualifications, and listed consultation fees.", "Our doctors", "Our doctors"),
        ("02", "Appointment booking", "Choose a doctor and a sample time, then keep your booking reference.", "Book appointment", "Appointments"),
        ("03", "Clinic information", "Check the clinic address, contact number, and opening hours.", "View clinic details", "Services"),
    ]
    service_cols = st.columns(3)
    for col, (num, title, detail, button_label, target) in zip(service_cols, services):
        with col:
            st.markdown(f'<div class="cc-service-card"><div class="cc-service-icon">{num}</div>'
                        f'<div class="cc-doctor-name">{esc(title)}</div><p>{esc(detail)}</p></div>', unsafe_allow_html=True)
            if st.button(button_label, key=f"service_{num}"):
                go_to(target)

    st.markdown('<div class="cc-section-label">OUR SPECIALISTS</div>', unsafe_allow_html=True)
    st.subheader("Meet your clinic team")
    st.markdown('<div class="cc-section-intro">Review listed qualifications and consultation fees before you choose an appointment.</div>', unsafe_allow_html=True)
    cols = st.columns(max(1, min(3, len(doctors))))
    for col, doctor in zip(cols, doctors[:3]):
        initials = "".join(p[0] for p in doctor["name"].replace("Dr.", "").split()[:2]).upper()
        with col.container(border=True):
            st.markdown(f'<div class="cc-doctor-avatar">{esc(initials)}</div><div class="cc-doctor-name">{esc(doctor["name"])}</div>', unsafe_allow_html=True)
            st.caption(doctor["spec"])
            st.markdown(f'<div class="cc-fee">₹{doctor["fee"]} <span style="font-weight:400;color:#786b65">consultation</span></div>', unsafe_allow_html=True)
            if st.button("Book this doctor", key=f"home_doc_{doctor['id']}"):
                st.session_state["selected_doctor_id"] = doctor["id"]
                go_to("Appointments")
    if st.button("View all doctors", key="home_all_doctors"): go_to("Our doctors")

    st.markdown('<div class="cc-section-label">WHY CITYCARE</div>', unsafe_allow_html=True)
    st.subheader("The details you need, before you book")
    items = [("01", "Clear consultation fees", "The listed fee is shown alongside each doctor's details."),
             ("02", "Simple appointment flow", "Choose a doctor, date, and available sample time in one form."),
             ("03", "A useful booking reference", "Keep the reference shown after saving your appointment.")]
    cols = st.columns(3)
    for col, (num, title, detail) in zip(cols, items):
        with col.container(border=True):
            st.markdown(f'<div class="cc-section-label" style="margin-top:0">{num}</div>', unsafe_allow_html=True)
            st.markdown(f"**{title}**")
            st.write(detail)

    st.markdown('<div class="cc-section-label">CONTACT US</div>', unsafe_allow_html=True)
    st.subheader("We’re here to help you plan a visit")
    a, b = st.columns(2)
    with a.container(border=True):
        st.markdown("**Call CityCare Clinic**")
        st.write(CLINIC["phone"])
        st.write(CLINIC["address"])
    with b.container(border=True):
        st.markdown("**Clinic hours**")
        st.write(CLINIC["hours"])
        st.caption("Sunday: Closed · Appointment times shown online are sample schedule data.")
    st.markdown('<section class="cc-final-cta"><div class="cc-kicker">YOUR NEXT STEP</div><h2>Make your next visit easy to plan.</h2>'
                '<p>Compare the clinic doctors and listed fees, then choose an appointment time.</p></section>', unsafe_allow_html=True)
    if st.button("Book an appointment", type="primary", key="home_final_book"): go_to("Appointments")


elif page == "Book appointment":
    hero("Make an appointment", "Choose a doctor, select a date and time, then save your booking reference.",
         "APPOINTMENTS", ["Consultation fees listed", "Sample availability"])
    st.info("Appointment times shown are sample schedule data for this prototype.")
    if not doctors:
        st.warning("No active doctors are currently listed. Please contact the clinic.")
    else:
        chosen_id = st.session_state.pop("selected_doctor_id", None)
        idx = next((i for i, d in enumerate(doctors) if d["id"] == chosen_id), 0)
        with st.form("booking_form"):
            left, right = st.columns(2)
            doctor = left.selectbox("Doctor", doctors, index=idx,
                format_func=lambda d:f"{d['name']} · {d['spec']} · ₹{d['fee']}")
            day = right.selectbox("Appointment date", upcoming_days(), format_func=label_day)
            slots = free_slots(doctor["id"], day)
            st.caption(f"{doctor['spec']} · Consultation ₹{doctor['fee']}")
            time = st.selectbox("Available sample time", slots) if slots else None
            if not slots: st.warning("No sample times are available on this date. Choose another date.")
            a, b = st.columns(2)
            patient = a.text_input("Patient name", max_chars=60)
            phone = b.text_input("10-digit mobile number", max_chars=15)
            email = st.text_input("Email (optional)", max_chars=120)
            reason = st.text_area("Reason for visit (optional)", max_chars=300)
            submitted = st.form_submit_button("Confirm appointment", type="primary", disabled=not bool(slots))
        if submitted:
            try:
                bid = book_appointment(doctor["id"], day, time, patient, phone, email, reason)
            except SlotTakenError:
                st.error("That time was just booked. Please select another sample time.")
            except BookingError as exc:
                st.error(str(exc))
            else:
                booking = get_booking(bid)
                if booking:
                    send_confirmation(bid, booking["doctor_name"], booking["appt_date"], booking["appt_time"], booking["patient_name"], booking["phone"])
                st.success(f"Appointment saved with {doctor['name']} for {label_day(day)} at {time}.")
                st.markdown(f"**Booking reference: `{bid}`** · Keep this reference for questions or changes.")


elif page == "Doctors and fees":
    hero("Our doctors", "Meet the CityCare team and review qualifications and consultation fees.",
         "THE CITYCARE TEAM", ["Three doctors", "Fees shown up front"])
    for start in range(0, len(doctors), 3):
        cols = st.columns(max(1, min(3, len(doctors[start:]))))
        for col, doctor in zip(cols, doctors[start:start + 3]):
            initials = "".join(p[0] for p in doctor["name"].replace("Dr.", "").split()[:2]).upper()
            with col.container(border=True):
                st.markdown(f'<div class="cc-doctor-avatar">{esc(initials)}</div><div class="cc-doctor-name">{esc(doctor["name"])}</div>', unsafe_allow_html=True)
                st.caption(doctor["spec"])
                st.markdown(f'<div class="cc-fee">₹{doctor["fee"]} consultation</div>', unsafe_allow_html=True)
                st.markdown("**Sample appointment times**")
                st.write(" · ".join(doctor["slots"]))
                if st.button("Book this doctor", key=f"directory_{doctor['id']}"):
                    st.session_state["selected_doctor_id"] = doctor["id"]
                    go_to("Appointments")
    st.caption("Availability is prototype schedule data and may not reflect the clinic's live calendar.")


elif page == "Clinic information":
    hero("Clinic information", "Useful details to help you prepare for an appointment.",
         "BEFORE YOUR VISIT", [CLINIC["hours"], f"Call {CLINIC['phone']}"])
    left, right = st.columns([1.1, .9])
    with left:
        st.subheader("Doctor qualifications and fees")
        for d in doctors:
            with st.container(border=True):
                st.markdown(f"**{d['name']}** · {d['spec']}")
                st.caption(f"Listed consultation fee: ₹{d['fee']}")
    with right:
        st.subheader("Frequently asked questions")
        with st.expander("How do I book?"):
            st.write("Open Appointments, choose a doctor, date, and sample time, then complete the form.")
        with st.expander("Are times live?"):
            st.write("No. The displayed time slots are sample schedule data for this prototype.")
        with st.expander("How do I change or cancel a booking?"):
            st.write("Use the clinic assistant with your booking reference and mobile number, or call the clinic.")
        with st.expander("Does the assistant give medical advice?"):
            st.write("No. It helps with clinic information and appointments, not diagnosis or treatment advice.")
    st.info(f"Clinic address: {CLINIC['address']} · Sunday closed.")


elif page == "Contact":
    hero("Contact CityCare", "Reach the clinic for appointment questions or help planning your visit.",
         "WE’RE HERE TO HELP", ["Call the clinic", "Monday to Saturday"])
    a, b = st.columns(2)
    with a.container(border=True):
        st.subheader("Clinic desk")
        st.markdown("**Phone**")
        st.write(CLINIC["phone"])
        st.markdown("**Address**")
        st.write(CLINIC["address"])
    with b.container(border=True):
        st.subheader("Opening hours")
        st.write(CLINIC["hours"])
        st.write("Sunday: Closed")
        st.caption("For urgent medical care, contact your local emergency service.")
    if st.button("Start an appointment booking", type="primary", key="contact_book"):
        go_to("Appointments")


elif page == "Chat assistant":
    hero("Clinic assistant", "Ask about clinic information, doctors, fees, timings, or appointments.",
         "HOW CAN WE HELP?", ["Clinic information", "Appointment support"])
    st.session_state.setdefault("chat_id", uuid.uuid4().hex[:16])
    st.session_state.setdefault("chat_log", [])
    if not st.session_state.chat_log:
        st.markdown("**Try asking**")
        for col, question in zip(st.columns(4), ["Show doctors", "What are the fees?", "Clinic timings", "Book appointment"]):
            if col.button(question, key=f"chat_hint_{question}"):
                st.session_state.chat_log.append({"role":"user", "text":question})
                reply = chat_reply(st.session_state.chat_id, question, doctors)
                st.session_state.chat_log.append({"role":"assistant", "text":reply["reply"], "actions":reply["actions"]})
                st.rerun()
    for entry in st.session_state.chat_log:
        with st.chat_message(entry["role"]):
            text = html.escape(entry["text"], quote=False).replace("&lt;br&gt;", "\n\n")
            text = text.replace("&lt;b&gt;", "**").replace("&lt;/b&gt;", "**")
            text = text.replace("&amp;#8377;", "₹").replace("&amp;#8226;", "• ")
            st.markdown(text)
    prompt = st.chat_input("Ask about doctors, fees, clinic hours, or bookings")
    if prompt:
        st.session_state.chat_log.append({"role":"user", "text":prompt})
        reply = chat_reply(st.session_state.chat_id, prompt, doctors)
        st.session_state.chat_log.append({"role":"assistant", "text":reply["reply"], "actions":reply["actions"]})
        st.rerun()
    actions = st.session_state.chat_log[-1].get("actions", []) if st.session_state.chat_log else []
    for start in range(0, len(actions), 3):
        cols = st.columns(max(1, min(3, len(actions[start:]))))
        for col, action in zip(cols, actions[start:start + 3]):
            if col.button(action["t"], key=f"chat_action_{start}_{action['m']}"):
                st.session_state.chat_log.append({"role":"user", "text":action["t"]})
                reply = chat_reply(st.session_state.chat_id, action["m"], doctors)
                st.session_state.chat_log.append({"role":"assistant", "text":reply["reply"], "actions":reply["actions"]})
                st.rerun()
    if st.button("Clear conversation", key="clear_chat"):
        st.session_state.chat_log = []
        st.session_state.pop("chat_id", None)
        st.rerun()


else:  # doctor panel
    doctor_id = st.session_state.get("doctor_id")
    if not doctor_id:
        hero("Doctor panel", "Sign in to review appointments assigned to you.", "STAFF ACCESS")
        with st.form("doctor_login"):
            selected = st.selectbox("Doctor", doctors, format_func=lambda d:d["name"])
            password = st.text_input("Password", type="password")
            login = st.form_submit_button("Log in", type="primary")
        if login:
            if verify_doctor_password(selected["id"], password):
                st.session_state["doctor_id"] = selected["id"]
                st.rerun()
            st.error("The doctor or password did not match.")
        if os.getenv("SHOW_DEMO_HINT", "1") == "1" and doctors:
            st.caption(f"Prototype password for {selected['name']}: `{default_demo_password(selected['id'])}`")
        if st.button("Send due reminders", key="staff_reminders_logged_out"):
            st.info(process_due_reminders())
    else:
        me = get_doctor(doctor_id)
        if not me:
            st.session_state.pop("doctor_id", None)
            st.rerun()
        head, logout = st.columns([4, 1])
        head.title(f"Welcome, {me['name']}")
        head.caption(f"{me['spec']} · {date.today().strftime('%d %b %Y')}")
        if logout.button("Log out"):
            st.session_state.pop("doctor_id", None)
            st.rerun()
        f1, f2 = st.columns(2)
        status_filter = f1.selectbox("Status", [""] + list(STATUSES), format_func=lambda x:x or "All statuses")
        date_filter = f2.selectbox("Date", [""] + upcoming_days(), format_func=lambda x:label_day(x) if x else "Any date")
        today = date.today().isoformat()
        metrics = st.columns(3)
        metrics[0].metric("Appointments today", count_doctor_bookings(doc_id=doctor_id, date=today))
        metrics[1].metric("Confirmed", count_doctor_bookings(doc_id=doctor_id, status="Confirmed"))
        metrics[2].metric("Completed", count_doctor_bookings(doc_id=doctor_id, status="Completed"))
        total = count_doctor_bookings(doc_id=doctor_id, date=date_filter or None, status=status_filter or None)
        pages = max(1, (total + 19) // 20)
        page_no = min(st.session_state.get("dash_page", 1), pages)
        rows = doctor_bookings(doc_id=doctor_id, date=date_filter or None, status=status_filter or None,
                               limit=20, offset=(page_no - 1) * 20)
        if not rows:
            st.info("No appointments match these filters.")
        for booking in rows:
            with st.container(border=True):
                c1, c2, c3 = st.columns([2, 2, 1])
                c1.markdown(f"**{esc(booking['patient_name'])}**")
                c1.caption(f"{label_day(booking['appt_date'])} · {booking['appt_time']} · {booking['booking_id']}")
                c2.caption(f"Phone: {booking['phone']} · {booking['email'] or 'No email'}")
                status_class = {"Confirmed":"cc-ok", "Completed":"cc-done", "Cancelled":"cc-off"}.get(booking["status"], "cc-off")
                c3.markdown(f'<span class="cc-pill {status_class}">{esc(booking["status"])}</span>', unsafe_allow_html=True)
                with st.expander("Patient details"):
                    st.write(f"Reason: {booking['reason'] or 'Not provided'}")
                    options = [s for s in STATUSES if s != booking["status"]]
                    for col, status in zip(st.columns(len(options)), options):
                        if col.button(f"Mark {status}", key=f"status_{booking['id']}_{status}"):
                            try:
                                update_booking_status(booking["booking_id"], status, owner_id=doctor_id)
                            except BookingError as exc:
                                st.error(str(exc))
                            else:
                                notify_status(booking, status)
                                st.rerun()
        prev, page_text, nxt = st.columns([1, 3, 1])
        if page_no > 1 and prev.button("Previous", key="prev_page"):
            st.session_state["dash_page"] = page_no - 1
            st.rerun()
        page_text.caption(f"{total} appointment(s) · Page {page_no} of {pages}")
        if page_no < pages and nxt.button("Next", key="next_page"):
            st.session_state["dash_page"] = page_no + 1
            st.rerun()
        if st.button("Send due reminders", key="staff_reminders"):
            st.info(process_due_reminders())


st.markdown(f'<div class="cc-footer"><div class="cc-footer-copy">CityCare Clinic · Appointments and clinic information · '
            f'<a class="cc-phone-link" href="tel:+918770465561">{esc(CLINIC["phone"])}</a> · {esc(CLINIC["hours"])}<br>'
            '<a href="https://unsplash.com/s/photos/doctor-consultation" target="_blank" rel="noopener">Illustrative photos: Unsplash</a></div>'
            '<div class="cc-socials" aria-label="Contact and social links">'
            '<a class="cc-social-link" href="https://wa.me/918770465561" target="_blank" rel="noopener" aria-label="Message CityCare on WhatsApp"><span class="cc-social-symbol">W</span>WhatsApp</a>'
            '<a class="cc-social-link" href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="Visit Instagram"><span class="cc-social-symbol">◎</span>Instagram</a>'
            '<a class="cc-social-link" href="https://www.facebook.com/" target="_blank" rel="noopener" aria-label="Visit Facebook"><span class="cc-social-symbol">f</span>Facebook</a>'
            '</div></div>', unsafe_allow_html=True)
