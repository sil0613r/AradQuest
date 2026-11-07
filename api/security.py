"""Password hashing with bcrypt. Stored hashes go in jucatori.password_hash."""
import bcrypt

# bcrypt only reads the first 72 bytes of a password, so longer ones are rejected at registration.
MAX_PASSWORD_BYTES = 72

# Used when the email is unknown, so a failed login takes about as long as a real one.
_DUMMY_HASH = bcrypt.hashpw(b"unused-password", bcrypt.gensalt())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _matches(password: str, hashed: bytes) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed)
    except ValueError:   # malformed input, for example a password longer than 72 bytes
        return False


def verify_password(password: str, stored_hash: str | None) -> bool:
    if stored_hash is None:
        _matches(password, _DUMMY_HASH)
        return False
    return _matches(password, stored_hash.encode())
