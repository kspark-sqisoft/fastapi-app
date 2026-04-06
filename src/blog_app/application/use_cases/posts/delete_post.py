from blog_app.application.errors import ForbiddenError, PostNotFoundError
from blog_app.application.ports.post_repository import PostRepository


def delete_post(
    post_id: int,
    *,
    requester_user_id: int,
    posts: PostRepository,
) -> None:
    existing = posts.get_by_id(post_id)
    if existing is None:
        raise PostNotFoundError()
    if existing.author_id != requester_user_id:
        raise ForbiddenError()
    posts.delete(post_id)
