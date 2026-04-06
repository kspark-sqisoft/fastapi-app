from blog_app.application.errors import UserNotFoundError
from blog_app.application.ports.user_repository import UserRepository
from blog_app.domain.entities.user import User


def get_user_by_id(user_id: int, *, users: UserRepository) -> User:
    user = users.get_by_id(user_id)
    if user is None:
        raise UserNotFoundError()
    return user
