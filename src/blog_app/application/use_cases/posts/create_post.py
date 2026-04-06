from blog_app.application.ports.post_repository import PostRepository
from blog_app.domain.entities.post import Post


def create_post(
    title: str,
    content: str,
    author_id: int,
    *,
    image_path: str | None = None,
    posts: PostRepository,
) -> Post:
    post = Post(
        id=None,
        title=title.strip(),
        content=content,
        author_id=author_id,
        image_path=image_path,
    )
    return posts.add(post)
