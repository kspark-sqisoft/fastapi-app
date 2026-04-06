from blog_app.application.errors import InvalidCredentialsError
from blog_app.application.ports.password_hasher import PasswordHasher
from blog_app.application.ports.token_service import TokenService
from blog_app.application.ports.user_repository import UserRepository


def login_user(
    email: str,
    password: str,
    *,
    users: UserRepository,
    password_hasher: PasswordHasher,
    tokens: TokenService,
) -> tuple[str, str, int]:
    normalized = email.strip().lower()
    user = users.get_by_email(normalized)
    if user is None or not password_hasher.verify(password, user.hashed_password):
        raise InvalidCredentialsError()
    assert user.id is not None
    sub = str(user.id)
    access = tokens.create_access_token(subject=sub)
    refresh = tokens.create_refresh_token(subject=sub)
    return access, refresh, user.id
