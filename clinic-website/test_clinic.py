"""CityCare test suite - no third-party test runner needed.

    python -m unittest -v test_clinic      (or: python test_clinic.py)

Every test runs against its own temporary SQLite file, so your clinic.db is
never touched. Messages are in demo mode and their output is swallowed.
"""
import contextlib
import io
import os
import tempfile
import unittest
from datetime import date, datetime, timedelta


class _TempDatabase(unittest.TestCase):
    """Shared fixture: a fresh database + Flask test client per test."""

    def setUp(self):
        import database
        from werkzeug.security import generate_password_hash
        self.db = database
        fd, self.db_path = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        os.unlink(self.db_path)                  # init_db must create it
        self._old_db = database.DB
        database.DB = self.db_path
        # werkzeug's default scrypt hash is far too slow for a database per test
        self.addCleanup(setattr, database, "generate_password_hash",
                        database.generate_password_hash)
        database.generate_password_hash = lambda pw: generate_password_hash(
            pw, method="pbkdf2:sha256:1000")
        database.init_db()
        import app as app_module
        self.app = app_module
        self.client = app_module.app.test_client()
        self.doctors = database.all_doctors()
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
    def login(self, doctor_id=1, password=None):
        password = password or self.db.default_demo_password(doctor_id)
        return self.client.post("/doctor", data={"doctor_id": doctor_id,
                                                 "password": password},
                                follow_redirects=False)

    def insert(self, doctor_id, day, time, name="Test Patient", phone="9812345678",
               status="Confirmed"):
        """Insert a row directly - used when the fixture needs an exact time."""
        con = self.db.get_db()
        bid = self.db.new_booking_id(con)
        con.execute("INSERT INTO bookings(booking_id,doctor_id,appt_date,appt_time,"
                    "patient_name,phone,status) VALUES(?,?,?,?,?,?,?)",
                    (bid, doctor_id, day, time, name, phone, status))
        con.commit()
        con.close()
        return bid

    def book(self, doctor_id=1, time="09:30", day=None, name="Ravi Kumar",
             phone="9812349812"):
        return self.client.post("/api/book", json={
            "doctor_id": doctor_id, "date": day or self.tomorrow, "time": time,
            "name": name, "phone": phone})

    def chat(self, message, sid="t-chat"):
        return self.client.post("/api/chat", json={"session_id": sid,
                                                   "message": message}).get_json()


class TestBookingRules(_TempDatabase):
    def test_phone_formats_are_normalised(self):
        for raw in ("9812349812", "98123 49812", "+91 9812349812", "09812349812"):
            self.assertEqual(self.db.normalize_phone(raw), "9812349812", raw)

    def test_bad_phones_rejected(self):
        for raw in ("12345", "5812349812", "981234981", "abcdefghij"):
            with self.assertRaises(self.db.BookingError):
                self.db.normalize_phone(raw)

    def test_names_and_emails(self):
        self.assertEqual(self.db.validate_name("Ravi Kumar"), "Ravi Kumar")
        self.assertEqual(self.db.validate_name("Dr. Meera Iyer"), "Dr. Meera Iyer")
        self.assertEqual(self.db.validate_name("Ayesha Begum"), "Ayesha Begum")
        for bad in ("Ra", "", "x"):
            with self.assertRaises(self.db.BookingError):
                self.db.validate_name(bad)
        # angle brackets must never reach a name - that is the XSS defence
        for bad in ("Ravi <script>alert(1)</script>", "A\">"):
            with self.assertRaises(self.db.BookingError):
                self.db.validate_name(bad)
        self.assertEqual(self.db.validate_email(""), "")
        self.assertEqual(self.db.validate_email("a@b.co"), "a@b.co")
        for bad in ("no-at-sign", "a@b", "a b@c.co"):
            with self.assertRaises(self.db.BookingError):
                self.db.validate_email(bad)

    def test_past_date_rejected(self):
        with self.assertRaises(self.db.BookingError):
            self.db.validate_date("2020-01-01")
        self.assertEqual(self.db.validate_date(date.today().strftime("%Y-%m-%d")),
                         date.today().strftime("%Y-%m-%d"))

    def test_time_must_be_offered_by_the_doctor(self):
        with self.assertRaises(self.db.BookingError) as ctx:
            self.db.book_appointment(1, self.tomorrow, "23:00", "Ravi Kumar", "9812349812")
        self.assertIn("not offered", str(ctx.exception))

    def test_unknown_doctor(self):
        with self.assertRaises(self.db.BookingError):
            self.db.book_appointment(99, self.tomorrow, "09:30", "Ravi", "9812349812")

    def test_double_booking_is_rejected(self):
        self.db.book_appointment(1, self.tomorrow, "09:30", "First Person", "9812349812")
        with self.assertRaises(self.db.SlotTakenError):
            self.db.book_appointment(1, self.tomorrow, "09:30", "Second Person", "9812349813")

    def test_two_doctors_can_share_a_time(self):
        """17:30 is on both rosters - the slot index is per doctor."""
        self.db.book_appointment(1, self.tomorrow, "17:30", "A Person", "9812349812")
        bid = self.db.book_appointment(2, self.tomorrow, "17:30", "B Person", "9812349813")
        self.assertTrue(bid.startswith("CC"))

    def test_cancelled_slot_opens_again(self):
        bid = self.db.book_appointment(1, self.tomorrow, "09:30", "A Person", "9812349812")
        self.db.update_booking_status(bid, "Cancelled")
        again = self.db.book_appointment(1, self.tomorrow, "09:30", "B Person", "9812349813")
        self.assertNotEqual(bid, again)

    def test_booking_id_format_and_availability(self):
        bid = self.db.book_appointment(1, self.tomorrow, "09:30", "A Person", "9812349812")
        self.assertRegex(bid, r"^CC\d{6}$")
        doc = self.db.get_doctor(1)
        self.assertEqual(self.db.free_slots(1, self.tomorrow),
                         [s for s in doc["slots"] if s != "09:30"])


class TestApi(_TempDatabase):
    def test_doctors_public_but_without_password_hashes(self):
        rows = self.client.get("/api/doctors").get_json()
        self.assertEqual(len(rows), 6)
        self.assertNotIn("pass_hash", rows[0])

    def test_bookings_need_login(self):
        res = self.client.get("/api/bookings")
        self.assertEqual(res.status_code, 401)
        self.assertFalse(res.get_json()["ok"])

    def test_dashboard_redirects_anonymous(self):
        res = self.client.get("/doctor/dashboard")
        self.assertEqual(res.status_code, 302)
        self.assertIn("/doctor", res.headers["Location"])

    def test_book_returns_json_errors(self):
        self.assertEqual(self.book(time="23:00").status_code, 400)
        res = self.book()
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()["ok"])
        self.assertEqual(self.book(name="Second At Same Slot", phone="9812349813")
                         .status_code, 409)

    def test_malformed_body_is_json_400(self):
        res = self.client.post("/api/book", data="{ not json",
                               content_type="application/json")
        self.assertIn(res.status_code, (400, 415))
        self.assertIn("error", res.get_json())

    def test_availability_endpoint(self):
        self.db.book_appointment(1, self.tomorrow, "09:30", "A Person", "9812349812")
        data = self.client.get(f"/api/availability?doctor_id=1&date={self.tomorrow}").get_json()
        self.assertNotIn("09:30", data["free"])
        self.assertIn("10:15", data["free"])

    def test_availability_rejects_past_date(self):
        res = self.client.get("/api/availability?doctor_id=1&date=2020-01-01")
        self.assertEqual(res.status_code, 400)


class TestDoctorAuthentication(_TempDatabase):
    def test_each_doctor_has_own_password(self):
        self.assertEqual(self.login(1).status_code, 302)
        self.assertEqual(self.client.post("/doctor", data={"doctor_id": 2,
                                                          "password": "citycare1123"}
                                          ).status_code, 401)
        self.assertEqual(self.login(2).status_code, 302)

    def test_wrong_password_does_not_create_session(self):
        res = self.client.post("/doctor", data={"doctor_id": 1, "password": "guess"})
        self.assertEqual(res.status_code, 401)
        self.assertEqual(self.client.get("/api/bookings").status_code, 401)

    def test_passwords_are_stored_hashed(self):
        con = self.db.get_db()
        stored = con.execute("SELECT pass_hash FROM doctors WHERE id=1").fetchone()["pass_hash"]
        con.close()
        self.assertNotIn("citycare", stored)
        self.assertIn(stored.split(":")[0], ("pbkdf2", "scrypt", "argon2"))

    def test_set_password_changes_login(self):
        from werkzeug.security import generate_password_hash
        con = self.db.get_db()
        con.execute("UPDATE doctors SET pass_hash=? WHERE id=1",
                    (generate_password_hash("newsecret1"),))
        con.commit()
        con.close()
        self.assertEqual(self.client.post("/doctor", data={"doctor_id": 1,
                                                           "password": "newsecret1"}
                                          ).status_code, 302)


class TestOwnership(_TempDatabase):
    def test_cannot_change_another_doctors_booking(self):
        other = self.db.book_appointment(2, self.tomorrow, "10:00", "A Person", "9812349812")
        self.login(1)
        res = self.client.post("/api/booking/status",
                               json={"booking_id": other, "status": "Completed"})
        self.assertEqual(res.status_code, 403)
        self.assertEqual(self.db.get_booking(other)["status"], "Confirmed")

    def test_own_booking_can_be_completed(self):
        mine = self.db.book_appointment(1, self.tomorrow, "09:30", "A Person", "9812349812")
        self.login(1)
        res = self.client.post("/api/booking/status",
                               json={"booking_id": mine, "status": "Completed"})
        self.assertTrue(res.get_json()["ok"])
        self.assertEqual(self.db.get_booking(mine)["status"], "Completed")

    def test_unknown_booking_id_is_404(self):
        self.login(1)
        self.assertEqual(self.client.post("/api/booking/status",
                                          json={"booking_id": "CC000000",
                                                "status": "Completed"}).status_code, 404)

    def test_bad_status_value_is_400(self):
        self.login(1)
        self.assertEqual(self.client.post("/api/booking/status",
                                          json={"booking_id": "CC1",
                                                "status": "Nonsense"}).status_code, 400)

    def test_other_doctors_patient_page_is_read_only(self):
        other = self.db.book_appointment(2, self.tomorrow, "10:00", "A Person", "9812349812")
        self.login(1)
        page = self.client.get(f"/doctor/patient/{other}").get_data(as_text=True)
        self.assertIn("only the treating doctor", page)
        self.assertNotIn("Mark completed", page)

    def test_own_patient_page_shows_actions(self):
        mine = self.db.book_appointment(1, self.tomorrow, "09:30", "A Person", "9812349812")
        self.login(1)
        page = self.client.get(f"/doctor/patient/{mine}").get_data(as_text=True)
        self.assertIn("Mark completed", page)

    def test_bookings_api_only_returns_own_rows(self):
        self.db.book_appointment(1, self.tomorrow, "09:30", "Mine", "9812349812")
        self.db.book_appointment(2, self.tomorrow, "10:00", "Theirs", "9812349813")
        self.login(1)
        rows = self.client.get("/api/bookings").get_json()
        self.assertEqual([r["patient_name"] for r in rows], ["Mine"])
        self.assertEqual(len(self.client.get("/api/bookings?view=all").get_json()), 2)


class TestChatbot(_TempDatabase):
    def test_full_booking_conversation(self):
        self.assertIn("Hello!", self.chat("hello")["reply"])
        self.assertIn("Which doctor", self.chat("I want to book an appointment")["reply"])
        self.assertIn("Pick a date", self.chat("__doc__1")["reply"])
        slot = self.chat("__date__0")["actions"][0]["m"]
        self.assertIn("patient's name", self.chat(slot)["reply"])
        self.assertIn("10-digit", self.chat("ravi kumar")["reply"])
        self.assertIn("Done!", self.chat("9812349812")["reply"])
        row = self.db.list_bookings()[0]
        self.assertEqual(row["patient_name"], "Ravi Kumar")
        self.assertRegex(row["booking_id"], r"^CC\d{6}$")

    def test_state_survives_a_second_session_object(self):
        """Proves the conversation is in SQLite, not in memory."""
        import chatbot
        self.chat("__doc__1")
        self.chat("__date__0")
        session = chatbot.Session("t-chat")
        self.assertEqual(session.data["stage"], "time")
        self.assertEqual(session.data["doc_id"], 1)

    def test_taken_slot_offers_alternatives(self):
        self.db.book_appointment(1, self.tomorrow, "09:30", "First", "9812345678")
        self.chat("__doc__1")
        actions = self.chat("__date__0")["actions"]
        self.assertEqual([a["t"] for a in actions],
                         [s for s in self.db.get_doctor(1)["slots"] if s != "09:30"])
        self.assertIn("not free", self.chat("__time__09:30")["reply"])

    def test_cancel_requires_matching_mobile(self):
        bid = self.db.book_appointment(1, self.tomorrow, "09:30", "A Person", "9812349812")
        self.assertIn("10-digit", self.chat(f"cancel {bid}")["reply"])
        self.assertIn("No booking", self.chat("9999999999")["reply"])
        self.assertEqual(self.db.get_booking(bid)["status"], "Confirmed")
        self.assertIn("Cancelled", self.chat("9812349812")["reply"])
        self.assertEqual(self.db.get_booking(bid)["status"], "Cancelled")

    def test_booking_flow_can_be_abandoned(self):
        self.chat("__doc__1")
        self.assertIn("dropped", self.chat("cancel")["reply"].lower())
        self.assertIsNone(self.db.load_chat_state("t-chat"))
        # a stale date action from the dropped flow is treated as free text
        self.assertIn("I can help", self.chat("__date__0")["reply"])

    def test_informational_intents(self):
        fees = self.chat("what are the fees?")["reply"]
        self.assertIn("Consultation fees", fees)
        self.assertIn("&#8377;500", fees)
        self.assertIn("MG Road", self.chat("where are you?")["reply"])
        self.assertIn("9:00", self.chat("timings?")["reply"])
        self.assertIn("emergencies", self.chat("this is urgent")["reply"])


class TestReminders(_TempDatabase):
    def _at(self, hours):
        when = datetime.now() + timedelta(hours=hours)
        return when.strftime("%Y-%m-%d"), when.strftime("%H:%M")

    def test_24h_and_2h_are_claimed_once(self):
        from reminders import process_due_reminders
        day, time = self._at(23)
        self.insert(1, day, time)
        day2, time2 = self._at(1.5)
        self.insert(2, day2, time2)
        sent = process_due_reminders()
        self.assertEqual(sent["24h"] + sent["2h"], 2)
        self.assertEqual(process_due_reminders()["24h"], 0, "must not send twice")

    def test_far_away_and_cancelled_are_skipped(self):
        from reminders import process_due_reminders
        day, time = self._at(48)
        self.insert(1, day, time)
        day2, time2 = self._at(20)
        self.insert(2, day2, time2, status="Cancelled")
        self.assertEqual(process_due_reminders(), {"24h": 0, "2h": 0})

    def test_sweep_endpoint_needs_login(self):
        self.assertEqual(self.client.post("/api/reminders/run").status_code, 401)
        self.login(1)
        self.assertTrue(self.client.post("/api/reminders/run").get_json()["ok"])

    def test_send_failure_does_not_break_booking(self):
        """A Twilio outage must not turn a created booking into a 500."""
        import reminders

        class DeadApi:
            class messages:
                @staticmethod
                def create(*args, **kwargs):
                    raise RuntimeError("twilio down")

        original = reminders._client
        reminders._client = lambda: DeadApi()
        try:
            res = self.book()
        finally:
            reminders._client = original
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(self.db.list_bookings()), 1)


class TestDashboardPaging(_TempDatabase):
    def _fill(self, count, doctor_id=1):
        slots = self.db.get_doctor(doctor_id)["slots"]
        for i in range(count):
            day = (date.today() + timedelta(days=1 + i // len(slots))).strftime("%Y-%m-%d")
            self.insert(doctor_id, day, slots[i % len(slots)], phone=str(9812340000 + i))

    def test_page_size_is_capped_but_total_counts_everything(self):
        self._fill(self.app.PER_PAGE + 5)
        self.login(1)
        page1 = self.client.get("/doctor/dashboard").get_data(as_text=True)
        self.assertIn(f"{self.app.PER_PAGE + 5} appointments in this view", page1)
        self.assertIn("Page 1 / 2", page1)
        self.assertEqual(page1.count(">View</a>"), self.app.PER_PAGE)
        page2 = self.client.get("/doctor/dashboard?page=2").get_data(as_text=True)
        self.assertIn("Page 2 / 2", page2)
        self.assertEqual(page2.count(">View</a>"), 5)

    def test_page_number_is_clamped_to_the_last_page(self):
        self._fill(self.app.PER_PAGE + 5)
        self.login(1)
        body = self.client.get("/doctor/dashboard?page=999").get_data(as_text=True)
        self.assertIn("Page 2 / 2", body)
        self.assertEqual(body.count(">View</a>"), 5)

    def test_short_list_has_no_pager(self):
        self._fill(3)
        self.login(1)
        body = self.client.get("/doctor/dashboard?page=999").get_data(as_text=True)
        self.assertIn("3 appointments in this view", body)
        self.assertNotIn("pager-nav", body)
        self.assertEqual(body.count(">View</a>"), 3)

    def test_pager_links_keep_the_active_filters(self):
        self._fill(self.app.PER_PAGE + 5)
        self.login(1)
        body = self.client.get("/doctor/dashboard?view=all&status=Confirmed&page=1") \
                          .get_data(as_text=True)
        self.assertIn('value="all"', body)
        self.assertIn("/doctor/dashboard?view=all&amp;date=&amp;status=Confirmed"
                      "&amp;page=2", body)


if __name__ == "__main__":
    unittest.main(verbosity=2)
