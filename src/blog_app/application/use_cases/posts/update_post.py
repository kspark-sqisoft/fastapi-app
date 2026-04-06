from blog_app.application.errors import ForbiddenError, PostNotFoundError
from blog_app.application.ports.post_repository import PostRepository
from blog_app.application.sentinel import UNSET
from blog_app.domain.entities.post import Post


def update_post(
    post_id: int,
    *,
    title: str | None,
    content: str | None,
    image_path: str | None | object = UNSET,
    editor_user_id: int,
    posts: PostRepository,
) -> Post:
    existing = posts.get_by_id(post_id)
    if existing is None:
        raise PostNotFoundError()
    if existing.author_id != editor_user_id:
        raise ForbiddenError()
    new_title = title.strip() if title is not None else existing.title
    new_content = content if content is not None else existing.content
    new_image = existing.image_path
    if image_path is not UNSET:
        new_image = image_path  # type: ignore[assignment]
    updated = Post(
        id=existing.id,
        title=new_title,
        content=new_content,
        author_id=existing.author_id,
        image_path=new_image,
        created_at=existing.created_at,
        updated_at=existing.updated_at,
    )
    return posts.update(updated)
