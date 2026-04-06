from sqlalchemy import select
from sqlalchemy.orm import Session

from blog_app.domain.entities.user import User
from blog_app.infrastructure.persistence.models import UserModel


class SqlAlchemyUserRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, user: User) -> User:
        row = UserModel(
            email=user.email,
            hashed_password=user.hashed_password,
            display_name=user.display_name or "",
            profile_image_path=user.profile_image_path,
        )
        self._session.add(row)
        self._session.flush()
        self._session.refresh(row)
        return self._to_entity(row)

    def get_by_id(self, user_id: int) -> User | None:
        row = self._session.get(UserModel, user_id)
        return self._to_entity(row) if row else None

    def get_by_email(self, email: str) -> User | None:
        stmt = select(UserModel).where(UserModel.email == email)
        row = self._session.scalars(stmt).first()
        return self._to_entity(row) if row else None

    def update_profile(
        self,
        user_id: int,
        *,
        display_name: str | None = None,
        profile_image_path: str | None = None,
        clear_profile_image: bool = False,
    ) -> User | None:
        row = self._session.get(UserModel, user_id)
        if row is None:
            return None
        if display_name is not None:
            row.display_name = display_name
        if clear_profile_image:
            row.profile_image_path = None
        elif profile_image_path is not None:
            row.profile_image_path = profile_image_path
        self._session.flush()
        self._session.refresh(row)
        return self._to_entity(row)

    @staticmethod
    def _to_entity(row: UserModel) -> User:
        return User(
            id=row.id,
            email=row.email,
            hashed_password=row.hashed_password,
            display_name=row.display_name or "",
            profile_image_path=row.profile_image_path,
            created_at=row.created_at,
        )
