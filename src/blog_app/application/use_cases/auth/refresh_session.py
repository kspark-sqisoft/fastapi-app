from blog_app.application.errors import InvalidRefreshTokenError, UserNotFoundError
from blog_app.application.ports.token_service import TokenService
from blog_app.application.ports.user_repository import UserRepository
from blog_app.application.use_cases.auth.get_user import get_user_by_id


def refresh_session(
    refresh_token: str,
    *,
    users: UserRepository,
    tokens: TokenService,
) -> tuple[str, str]:
    uid = tokens.subject_from_refresh_token(refresh_token)
    if uid is None:
        raise InvalidRefreshTokenError()
    try:
        get_user_by_id(uid, users=users)
    except UserNotFoundError:
        raise InvalidRefreshTokenError()
    sub_s = str(uid)
    access = tokens.create_access_token(subject=sub_s)
    new_refresh = tokens.create_refresh_token(subject=sub_s)
    return access, new_refresh
