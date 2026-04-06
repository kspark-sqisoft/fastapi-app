from blog_app.application.errors import UserNotFoundError
from blog_app.application.ports.user_repository import UserRepository
from blog_app.domain.entities.user import User


def update_profile(
    user_id: int,
    *,
    display_name: str | None = None,
    profile_image_path: str | None = None,
    clear_profile_image: bool = False,
    users: UserRepository,
) -> User:
    if users.get_by_id(user_id) is None:
        raise UserNotFoundError()
    if profile_image_path is not None and clear_profile_image:
        raise ValueError(
            "profile_image_path and clear_profile_image are mutually exclusive"
        )
    dn = display_name.strip() if display_name is not None else None
    updated = users.update_profile(
        user_id,
        display_name=dn,
        profile_image_path=profile_image_path,
        clear_profile_image=clear_profile_image,
    )
    if updated is None:
        raise UserNotFoundError()
    return updated
