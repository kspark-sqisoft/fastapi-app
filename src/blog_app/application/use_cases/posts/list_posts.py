from blog_app.application.ports.post_repository import PostRepository
from blog_app.domain.entities.post import Post


def list_posts(
    *,
    posts: PostRepository,
    author_id: int | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Post]:
    if author_id is not None:
        return posts.list_by_author(author_id, skip=skip, limit=limit)
    return posts.list_all(skip=skip, limit=limit)
