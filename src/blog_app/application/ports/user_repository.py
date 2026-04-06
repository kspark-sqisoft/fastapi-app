from typing import Protocol

from blog_app.domain.entities.user import User


class UserRepository(Protocol):
    def add(self, user: User) -> User: ...
    def get_by_id(self, user_id: int) -> User | None: ...
    def get_by_email(self, email: str) -> User | None: ...
    def update_profile(
        self,
        user_id: int,
        *,
        display_name: str | None = None,
        profile_image_path: str | None = None,
        clear_profile_image: bool = False,
    ) -> User | None: ...
