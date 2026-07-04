import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import get_settings
from app.db.session import SyncSessionLocal
from app.models import User
from app.models.user import UserRole

def main():
    settings = get_settings()
    if not sys.argv[1:]:
        print("Usage: python scripts/promote_user.py <username>")
        sys.exit(1)

    username = sys.argv[1]
    role = sys.argv[2].lower() if len(sys.argv) > 2 else "developer"
    if role not in [r.value for r in UserRole]:
        print(f"Invalid role: {role}. Valid: {[r.value for r in UserRole]}")
        sys.exit(1)

    db = SyncSessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"User '{username}' not found.")
            sys.exit(1)
        old_role = user.role.value
        user.role = UserRole(role)
        db.commit()
        print(f"Promoted '{username}' from {old_role} -> {role}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
