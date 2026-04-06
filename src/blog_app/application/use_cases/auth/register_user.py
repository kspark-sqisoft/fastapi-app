from blog_app.application.errors import EmailAlreadyRegisteredError
from blog_app.application.ports.password_hasher import PasswordHasher
from blog_app.application.ports.user_repository import UserRepository
from blog_app.domain.entities.user import User


def register_user(
    email: str,
    password: str,
    *,
    display_name: str = "",
    users: UserRepository,
    password_hasher: PasswordHasher,
) -> User:
    normalized = email.strip().lower()
    if users.get_by_email(normalized):
        raise EmailAlreadyRegisteredError()
    hashed = password_hasher.hash(password)
    name = display_name.strip()
    user = User(id=None, email=normalized, hashed_password=hashed, display_name=name)
    return users.add(user)
