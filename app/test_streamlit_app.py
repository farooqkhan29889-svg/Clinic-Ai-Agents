"""CityCare - tests for the Streamlit UI (streamlit_app.py).

    python -m unittest -v test_clinic test_streamlit_app

These drive the app the way a browser does: pick a page in the sidebar, set
widget values, click, then read what rendered and what landed in the database.
Every test gets its own temporary SQLite file, so clinic.db is never touched.

AppTest detail worth knowing: staged widget values apply to the NEXT run only,
so a whole form has to be filled in one batch before clicking submit.
"""
import contextlib
import io
import os
import tempfile
import unittest
from datetime import date, timedelta

APP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "streamlit_app.py")
PER_PAGE = 25


class _StreamlitUI(unittest.TestCase):
    def setUp(self):
        import database
        from werkzeug.security import generate_password_hash
        from streamlit.testing.v1 import AppTest
        self.db = database
        self.AppTest = AppTest

        fd, self.db_path = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        os.unlink(self.db_path)                  # init_db must create it
        self._old_db = database.DB
        database.DB = self.db_path
        self.addCleanup(setattr, database, "generate_password_hash",
                        database.generate_password_hash)
        database.generate_password_hash = lambda pw: generate_password_hash(
            pw, method="pbkdf2:sha256:1000")
        database.init_db()

        self.tomorrow = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")
        self._quiet = contextlib.redirect_stdout(io.StringIO())
        self._quiet.__enter__()
        self.addCleanup(self._quiet.__exit__, None, None, None)

    def tearDown(self):
        self.db.DB = self._old_db
        for suffix in ("", "-journal", "-wal", "-shm"):
            path = self.db_path + suffix
            if os.path.exists(path):
                os.unlink(path)

    # helpers ------------------------------------------------------------
    def open(self, page=None):
        at = self.AppTest.from_file(APP, default_timeout=60).run()
        self.no_crash(at)
        if page:
            at = at.sidebar.radio[0].set_value(page).run()
            self.no_crash(at)
        return at

    def no_crash(self, at):
        if at.exception:
            self.fail(f"streamlit_app raised: {at.exception[0].value}")

    def click(self, at, label):
        for button in at.button:
            if button.label == label:
                return button.click().run()
        self.fail(f"no button labelled {label!r} - have "
                  f"{[b.label for b in at.button]}")

    def login(self, doctor_id=1):
        at = self.open("Doctor panel")
        at.selectbox[0].set_value(self.db.get_doctor(doctor_id))
        at.text_input[0].set_value(self.db.default_demo_password(doctor_id))
        at = self.click(at, "Log in")
        self.no_crash(at)
        return at

    def book(self, doctor_id=1, time="10:15", name="Walk-in Patient",
             phone="9812349812"):
        """Fill the whole wizard in one staged batch, then submit."""
        at = self.open("Book appointment")
        at.selectbox[0].set_value(self.db.get_doctor(doctor_id))
        at.selectbox[1].set_value(self.tomorrow)
        at.selectbox[2].set_value(time)
        at.text_input[0].set_value(name)
        at.text_input[1].set_value(phone)
        at.text_area[0].set_value("routine checkup")
        return self.click(at, "Confirm booking")

    def text(self, at):
        parts = ([m.value for m in at.markdown] + [c.value for c in at.caption]
                 + [s.value for s in at.success] + [e.value for e in at.error]
                 + [i.value for i in at.info] + [t.value for t in at.title])
        return "\n".join(str(p) for p in parts)

    # ================= booking wizard =================
    def test_wizard_books_through_the_same_rules(self):
        at = self.book()
        self.no_crash(at)
        rows = self.db.list_bookings()
        self.assertEqual(len(rows), 1)
        self.assertRegex(rows[0]["booking_id"], r"^CC\d{6}$")
        self.assertEqual((rows[0]["patient_name"], rows[0]["appt_date"],
                          rows[0]["appt_time"]), ("Walk-in Patient", self.tomorrow, "10:15"))
        self.assertEqual(rows[0]["reason"], "routine checkup")
        self.assertIn(rows[0]["booking_id"], self.text(at))

    def test_wizard_never_submits_a_slot_that_is_already_taken(self):
        """A booked time drops out of the list instead of being submitted.

        The SlotTakenError branch itself needs two simultaneous submissions; that
        path is covered by test_clinic (the unique index in `book_appointment`)
        and by the chat test below, which re-offers alternatives.
        """
        taken = self.db.book_appointment(1, self.tomorrow, "10:15", "Beta Patient",
                                         "9812349811")
        at = self.book(name="Gamma Patient", phone="9812349813")
        self.no_crash(at)
        self.assertNotIn("10:15", at.selectbox[2].options)
        self.assertNotEqual(at.selectbox[2].value, "10:15")
        self.assertTrue(at.success, self.text(at))
        rows = self.db.list_bookings()
        self.assertEqual(len(rows), 2)
        booked = [r["appt_time"] for r in rows if r["patient_name"] == "Gamma Patient"]
        self.assertNotIn("10:15", booked)
        self.assertEqual(self.db.get_booking(taken)["patient_name"], "Beta Patient")

    def test_wizard_rejects_a_bad_mobile_number(self):
        at = self.book(phone="12345")
        self.no_crash(at)
        self.assertTrue(at.error, self.text(at))
        self.assertEqual(self.db.list_bookings(), [])

    def test_doctor_without_slots_on_that_day_is_refused(self):
        """A day with no free slot cannot be booked even if the widget is forced."""
        at = self.open("Book appointment")
        at.selectbox[0].set_value(self.db.get_doctor(1))
        slots = self.db.get_doctor(1)["slots"]
        for i, slot in enumerate(slots):
            self.db.book_appointment(1, self.tomorrow, slot, f"Full {i}", "9812349811")
        at.selectbox[1].set_value(self.tomorrow)
        at.text_input[0].set_value("Late Patient")
        at.text_input[1].set_value("9812349812")
        at = self.click(at, "Confirm booking")
        self.no_crash(at)
        self.assertTrue(at.error or at.warning, self.text(at))
        self.assertIn("Fully booked",
                      " ".join([e.value for e in list(at.error) + list(at.warning)]))
        self.assertEqual(len(self.db.list_bookings()), len(slots))

    # ================= chat assistant =================
    def test_chat_booking_conversation_creates_a_row(self):
        at = self.open("Chat assistant")
        at = at.chat_input[0].set_value("I want to book an appointment").run()
        self.no_crash(at)
        self.assertIn("Which doctor", self.text(at))

        # all 6 doctors must render, not just the first row of buttons
        quick = [b.label for b in at.button if (b.key or "").startswith("quick")]
        self.assertEqual(len(quick), 6, quick)

        at = at.chat_input[0].set_value("__doc__1").run()
        at = at.chat_input[0].set_value("__date__0").run()     # 0 = tomorrow
        at = at.chat_input[0].set_value("__time__09:30").run()
        at = at.chat_input[0].set_value("Echo Patient").run()
        at = at.chat_input[0].set_value("9812349819").run()
        self.no_crash(at)

        rows = self.db.list_bookings()
        self.assertEqual(len(rows), 1, self.text(at))
        self.assertEqual(rows[0]["patient_name"], "Echo Patient")
        self.assertIn("Booking ID", self.text(at))

    def test_chat_cancellation_needs_the_matching_mobile(self):
        bid = self.db.book_appointment(1, self.tomorrow, "09:30", "Hana id", "9812349817")
        at = self.open("Chat assistant")
        at = at.chat_input[0].set_value(f"cancel {bid}").run()
        at = at.chat_input[0].set_value("9999999999").run()
        self.no_crash(at)
        self.assertIn("No booking", self.text(at))
        self.assertEqual(self.db.get_booking(bid)["status"], "Confirmed")

        at = at.chat_input[0].set_value("9812349817").run()
        self.assertEqual(self.db.get_booking(bid)["status"], "Cancelled")

    # ================= doctor panel =================
    def test_login_and_scope_defaults_to_my_patients(self):
        self.db.book_appointment(1, self.tomorrow, "09:30", "First Patient", "9812349810")
        self.db.book_appointment(2, self.tomorrow, "10:00", "Other Doctor Patient",
                                 "9812349812")
        at = self.login(1)
        self.assertIn("Welcome, Dr. Priya Sharma", self.text(at))
        self.assertEqual(at.metric[0].value, "0")     # nothing scheduled today
        self.assertEqual(at.metric[1].value, "1")     # confirmed, my patients only
        self.assertIn("First Patient", self.text(at))
        self.assertNotIn("Other Doctor Patient", self.text(at))

    def test_wrong_password_stays_on_the_login_form(self):
        at = self.open("Doctor panel")
        at.selectbox[0].set_value(self.db.get_doctor(1))
        at.text_input[0].set_value("not-the-password")
        at = self.click(at, "Log in")
        self.no_crash(at)
        self.assertIn("Wrong doctor or password", self.text(at))
        self.assertNotIn("doctor_id", at.session_state)

    def test_anonymous_dashboard_is_not_rendered(self):
        at = self.open("Doctor panel")
        self.assertNotIn("Log out", [b.label for b in at.button])

    def test_other_doctors_patient_is_read_only(self):
        self.db.book_appointment(2, self.tomorrow, "10:00", "Ravi Kumar", "9812349811")
        at = self.login(1)
        self.assertNotIn("Ravi Kumar", self.text(at))     # not in "mine"
        at = at.selectbox[0].set_value("all").run()       # switch scope
        self.no_crash(at)
        self.assertIn("Ravi Kumar", self.text(at))
        self.assertIn("Read-only", self.text(at))
        self.assertNotIn("Mark Completed", [b.label for b in at.button])

    def test_own_booking_can_be_cancelled_from_the_dashboard(self):
        bid = self.db.book_appointment(1, self.tomorrow, "09:30", "Sana Ali", "9812349812")
        at = self.login(1)
        at = self.click(at, "Mark Cancelled")
        self.no_crash(at)
        self.assertEqual(self.db.get_booking(bid)["status"], "Cancelled")

    def test_dashboard_paging_moves_between_pages(self):
        slots = self.db.get_doctor(1)["slots"]
        for i in range(PER_PAGE + 3):
            day = (date.today() + timedelta(days=1 + i // len(slots))).strftime("%Y-%m-%d")
            self.db.book_appointment(1, day, slots[i % len(slots)], f"P {i}", "9812349812")
        at = self.login(1)
        self.assertIn(f"page 1 of 2", self.text(at))
        at = self.click(at, "Next")
        self.no_crash(at)
        self.assertIn("page 2 of 2", self.text(at))

    def test_reminder_button_is_available_on_every_page(self):
        at = self.open("Book appointment")
        self.assertIn("Send due reminders now", [b.label for b in at.button])


if __name__ == "__main__":
    unittest.main(verbosity=2)
