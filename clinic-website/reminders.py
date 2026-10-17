"""CityCare - WhatsApp + SMS reminders.

Demo mode: messages are printed to the terminal.
Live mode:   set TWILIO_SID / TWILIO_TOKEN / TWILIO_FROM / WHATSAPP_FROM
             env vars and `pip install twilio` - then messages send for real.
"""
import os


def _client():
    try:
        from twilio.rest import Client  # optional dependency
        sid, token = os.getenv("TWILIO_SID"), os.getenv("TWILIO_TOKEN")
        if sid and token:
            return Client(sid, token)
    except ImportError:
        pass
    return None


def send_whatsapp(to, body):
    c = _client()
    if c:
        c.messages.create(from_=os.getenv("WHATSAPP_FROM", "whatsapp:+14155238886"),
                          to="whatsapp:+91" + to, body=body)
        return "sent"
    print(f"[DEMO WhatsApp -> +91 {to}] {body}")
    return "demo"


def send_sms(to, body):
    c = _client()
    if c:
        c.messages.create(from_=os.getenv("TWILIO_FROM", "+15005550006"),
                          to="+91" + to, body=body)
        return "sent"
    print(f"[DEMO SMS -> +91 {to}] {body}")
    return "demo"


def send_confirmation(booking_id, doctor_name, date, time, patient, phone):
    wa = (f"Hi {patient.split()[0]}, your appointment with {doctor_name} is confirmed "
          f"for {date} at {time}. Booking ID {booking_id}. Reply C to cancel. - CityCare")
    sms = f"CityCare: {doctor_name} on {date} {time}. ID {booking_id}. Arrive 10 min early."
    send_whatsapp(phone, wa)
    send_sms(phone, sms)


def send_reminder(booking_id, doctor_name, date, time, patient, phone, hours_before):
    wa = (f"Reminder: your visit with {doctor_name} is in {hours_before} hours "
          f"({date}, {time}). Booking ID {booking_id}. - CityCare")
    send_whatsapp(phone, wa)
    send_sms(phone, wa)
