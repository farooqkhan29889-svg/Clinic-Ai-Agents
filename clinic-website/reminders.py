"""CityCare - WhatsApp + SMS reminders.

Demo mode: messages are printed to the terminal.
Live mode:   set TWILIO_SID / TWILIO_TOKEN / TWILIO_FROM / WHATSAPP_FROM
             env vars and `pip install twilio` - then messages send for real.

Send failures never bubble up: a booking must survive a messenger outage.
"""
import os

from database import bookings_needing_reminder, claim_reminder


def _client():
    """Twilio client, or None for demo mode. Bad config must not lose a booking."""
    try:
        from twilio.rest import Client  # optional dependency
        sid, token = os.getenv("TWILIO_SID"), os.getenv("TWILIO_TOKEN")
        if sid and token:
            return Client(sid, token)
    except Exception as exc:                          # noqa: BLE001
        print(f"[messenger unavailable, falling back to demo mode] {exc}")
    return None


def _msisdn(to):
    digits = "".join(ch for ch in str(to) if ch.isdigit())
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    return "+91" + digits


def send_whatsapp(to, body):
    c = _client()
    if c:
        try:
            c.messages.create(from_=os.getenv("WHATSAPP_FROM", "whatsapp:+14155238886"),
                              to="whatsapp:" + _msisdn(to), body=body)
            return "sent"
        except Exception as exc:                      # noqa: BLE001 - keep booking alive
            print(f"[WhatsApp FAILED -> {_msisdn(to)}] {exc}")
            return "failed"
    print(f"[DEMO WhatsApp -> {_msisdn(to)}] {body}")
    return "demo"


def send_sms(to, body):
    c = _client()
    if c:
        try:
            c.messages.create(from_=os.getenv("TWILIO_FROM", "+15005550006"),
                              to=_msisdn(to), body=body)
            return "sent"
        except Exception as exc:                      # noqa: BLE001
            print(f"[SMS FAILED -> {_msisdn(to)}] {exc}")
            return "failed"
    print(f"[DEMO SMS -> {_msisdn(to)}] {body}")
    return "demo"


def send_confirmation(booking_id, doctor_name, date, time, patient, phone):
    first = patient.split()[0] if patient.split() else patient
    wa = (f"Hi {first}, your appointment with {doctor_name} is confirmed "
          f"for {date} at {time}. Booking ID {booking_id}. Reply C to cancel. - CityCare")
    sms = f"CityCare: {doctor_name} on {date} {time}. ID {booking_id}. Arrive 10 min early."
    send_whatsapp(phone, wa)
    send_sms(phone, sms)


def send_reminder(booking_id, doctor_name, date, time, patient, phone, hours_before):
    first = patient.split()[0] if patient.split() else patient
    wa = (f"Reminder: your visit with {doctor_name} is in {hours_before} hours "
          f"({date}, {time}). Booking ID {booking_id}. - CityCare")
    sms = f"CityCare reminder: {doctor_name}, {date} {time}. ID {booking_id}."
    send_whatsapp(phone, wa)
    send_sms(phone, sms)


def process_due_reminders():
    """Send the 24h and 2h reminders that are due. Safe to run on a schedule."""
    sent = {"24h": 0, "2h": 0}
    for kind in ("24h", "2h"):
        for b in bookings_needing_reminder(kind):
            # Claim first: with several workers only the winner sends the message.
            if not claim_reminder(b["booking_id"], kind):
                continue
            send_reminder(b["booking_id"], b["doctor_name"], b["appt_date"],
                          b["appt_time"], b["patient_name"], b["phone"], kind[:-1])
            sent[kind] += 1
    if sent["24h"] or sent["2h"]:
        print(f"[reminders] sent {sent}")
    return sent


if __name__ == "__main__":
    process_due_reminders()
