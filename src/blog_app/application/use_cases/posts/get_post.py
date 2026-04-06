from blog_app.application.errors import PostNotFoundError
from blog_app.application.ports.post_repository import PostRepository
from blog_app.domain.entities.post import Post


def get_post(post_id: int, *, posts: PostRepository) -> Post:
    post = posts.get_by_id(post_id)
    if post is None:
        raise PostNotFoundError()
    return post
