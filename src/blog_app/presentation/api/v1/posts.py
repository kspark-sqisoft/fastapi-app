from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from blog_app.application.errors import ForbiddenError, PostNotFoundError
from blog_app.application.use_cases.posts.create_post import create_post
from blog_app.application.use_cases.posts.delete_post import delete_post
from blog_app.application.use_cases.posts.get_post import get_post
from blog_app.application.use_cases.posts.list_posts import list_posts
from blog_app.application.use_cases.posts.update_post import update_post
from blog_app.domain.entities.post import Post
from blog_app.presentation.api.deps import get_current_user_id, get_db, get_file_storage
from blog_app.presentation.schemas.post import PostResponse, PostUpdateRequest
from blog_app.presentation.upload_util import read_image_upload
from blog_app.presentation.url_helper import static_file_url
from blog_app.infrastructure.files.local_file_storage import LocalFileStorage
from blog_app.infrastructure.persistence.repositories.post_repository import (
    SqlAlchemyPostRepository,
)

router = APIRouter(prefix="/posts", tags=["posts"])


def _post_response(p: Post, request: Request) -> PostResponse:
    assert p.id is not None
    return PostResponse(
        id=p.id,
        title=p.title,
        content=p.content,
        author_id=p.author_id,
        image_url=static_file_url(request, p.image_path),
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@router.get("", response_model=list[PostResponse])
def list_posts_endpoint(
    request: Request,
    author_id: int | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[PostResponse]:
    repo = SqlAlchemyPostRepository(db)
    items = list_posts(posts=repo, author_id=author_id, skip=skip, limit=limit)
    return [_post_response(p, request) for p in items]


@router.get("/{post_id}", response_model=PostResponse)
def get_post_endpoint(
    post_id: int, request: Request, db: Session = Depends(get_db)
) -> PostResponse:
    repo = SqlAlchemyPostRepository(db)
    try:
        p = get_post(post_id, posts=repo)
    except PostNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )
    return _post_response(p, request)


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post_endpoint(
    request: Request,
    title: str = Form(..., min_length=1, max_length=500),
    content: str = Form(..., min_length=1),
    image: UploadFile | None = File(None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    storage: LocalFileStorage = Depends(get_file_storage),
) -> PostResponse:
    repo = SqlAlchemyPostRepository(db)
    image_rel: str | None = None
    if image is not None and (image.filename or "").strip():
        data, ct = await read_image_upload(image)
        try:
            image_rel = storage.save_post_image(data, ct)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    p = create_post(title, content, user_id, image_path=image_rel, posts=repo)
    return _post_response(p, request)


@router.post("/{post_id}/image", response_model=PostResponse)
async def upload_post_image(
    post_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    storage: LocalFileStorage = Depends(get_file_storage),
) -> PostResponse:
    repo = SqlAlchemyPostRepository(db)
    try:
        existing = get_post(post_id, posts=repo)
    except PostNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )
    if existing.author_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to edit this post",
        )
    data, ct = await read_image_upload(image)
    try:
        rel = storage.save_post_image(data, ct)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    old = existing.image_path
    try:
        p = update_post(
            post_id,
            title=None,
            content=None,
            image_path=rel,
            editor_user_id=user_id,
            posts=repo,
        )
    except PostNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )
    except ForbiddenError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to edit this post",
        )
    if old:
        background_tasks.add_task(storage.delete_if_exists, old)
    return _post_response(p, request)


@router.delete("/{post_id}/image", response_model=PostResponse)
def delete_post_image(
    post_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    storage: LocalFileStorage = Depends(get_file_storage),
) -> PostResponse:
    repo = SqlAlchemyPostRepository(db)
    try:
        existing = get_post(post_id, posts=repo)
    except PostNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )
    if existing.author_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to edit this post",
        )
    if not existing.image_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post has no image"
        )
    old = existing.image_path
    try:
        p = update_post(
            post_id,
            title=None,
            content=None,
            image_path=None,
            editor_user_id=user_id,
            posts=repo,
        )
    except PostNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )
    except ForbiddenError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to edit this post",
        )
    background_tasks.add_task(storage.delete_if_exists, old)
    return _post_response(p, request)


@router.patch("/{post_id}", response_model=PostResponse)
def update_post_endpoint(
    post_id: int,
    request: Request,
    body: PostUpdateRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> PostResponse:
    repo = SqlAlchemyPostRepository(db)
    if body.title is None and body.content is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update"
        )
    try:
        p = update_post(
            post_id,
            title=body.title,
            content=body.content,
            editor_user_id=user_id,
            posts=repo,
        )
    except PostNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )
    except ForbiddenError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to edit this post",
        )
    return _post_response(p, request)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post_endpoint(
    post_id: int,
    background_tasks: BackgroundTasks,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    storage: LocalFileStorage = Depends(get_file_storage),
) -> None:
    repo = SqlAlchemyPostRepository(db)
    existing = repo.get_by_id(post_id)
    try:
        delete_post(post_id, requester_user_id=user_id, posts=repo)
    except PostNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )
    except ForbiddenError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to delete this post",
        )
    if existing and existing.image_path:
        background_tasks.add_task(storage.delete_if_exists, existing.image_path)
