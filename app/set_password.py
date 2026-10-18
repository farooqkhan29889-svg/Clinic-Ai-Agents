"""Set a doctor's login password.

    python set_password.py <doctor_id> <new password>

Passwords are stored hashed (PBKDF2) in clinic.db, so they cannot be read back -
re-run this script to change one. Run `python set_password.py list` to see ids.
"""
import sys

from werkzeug.security import generate_password_hash

from database import all_doctors, get_db, get_doctor, init_db

MIN_LENGTH = 8


def main(argv):
    init_db()
    if len(argv) == 2 and argv[1] == "list":
        for d in all_doctors():
            print(f"{d['id']}  {d['name']}  -  {d['spec']}")
        return 0
    if len(argv) != 3:
        print(__doc__.strip())
        return 1
    try:
        doc_id = int(argv[1])
    except ValueError:
        print("doctor_id must be a number")
        return 1
    password = argv[2]
    doc = get_doctor(doc_id)
    if not doc:
        print(f"No doctor with id {doc_id}. Try: python set_password.py list")
        return 1
    if len(password) < MIN_LENGTH:
        print(f"Password must be at least {MIN_LENGTH} characters")
        return 1

    con = get_db()
    con.execute("UPDATE doctors SET pass_hash=? WHERE id=?",
                (generate_password_hash(password), doc_id))
    con.commit()
    con.close()
    print(f"Password updated for {doc['name']} (id {doc_id}).")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
