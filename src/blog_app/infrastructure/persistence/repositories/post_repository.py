from sqlalchemy import select
from sqlalchemy.orm import Session

from blog_app.domain.entities.post import Post
from blog_app.infrastructure.persistence.models import PostModel


class SqlAlchemyPostRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, post: Post) -> Post:
        row = PostModel(
            title=post.title,
            content=post.content,
            author_id=post.author_id,
            image_path=post.image_path,
        )
        self._session.add(row)
        self._session.flush()
        self._session.refresh(row)
        return self._to_entity(row)

    def get_by_id(self, post_id: int) -> Post | None:
        row = self._session.get(PostModel, post_id)
        return self._to_entity(row) if row else None

    def list_all(self, skip: int = 0, limit: int = 100) -> list[Post]:
        stmt = (
            select(PostModel)
            .order_by(PostModel.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        rows = self._session.scalars(stmt).all()
        return [self._to_entity(r) for r in rows]

    def list_by_author(
        self, author_id: int, skip: int = 0, limit: int = 100
    ) -> list[Post]:
        stmt = (
            select(PostModel)
            .where(PostModel.author_id == author_id)
            .order_by(PostModel.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        rows = self._session.scalars(stmt).all()
        return [self._to_entity(r) for r in rows]

    def update(self, post: Post) -> Post:
        row = self._session.get(PostModel, post.id)
        if row is None:
            raise ValueError("post not found")
        row.title = post.title
        row.content = post.content
        row.image_path = post.image_path
        self._session.flush()
        self._session.refresh(row)
        return self._to_entity(row)

    def delete(self, post_id: int) -> None:
        row = self._session.get(PostModel, post_id)
        if row is not None:
            self._session.delete(row)

    @staticmethod
    def _to_entity(row: PostModel) -> Post:
        return Post(
            id=row.id,
            title=row.title,
            content=row.content,
            author_id=row.author_id,
            image_path=row.image_path,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
