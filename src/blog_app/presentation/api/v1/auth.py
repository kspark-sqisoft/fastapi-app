from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from blog_app.application.errors import EmailAlreadyRegisteredError, InvalidCredentialsError, UserNotFoundError
from blog_app.application.use_cases.auth.get_user import get_user_by_id
from blog_app.application.use_cases.auth.login_user import login_user
from blog_app.application.use_cases.auth.register_user import register_user
from blog_app.application.use_cases.auth.update_profile import update_profile as apply_profile_update
from blog_app.domain.entities.user import User
from blog_app.presentation.api.deps import (
    get_current_user_id,
    get_db,
    get_file_storage,
    get_password_hasher,
    get_token_service,
)
from blog_app.presentation.schemas.auth import (
    ProfileUpdateRequest,
    TokenResponse,
    UserLoginRequest,
    UserPublic,
    UserRegisterRequest,
)
from blog_app.presentation.upload_util import read_image_upload
from blog_app.presentation.url_helper import static_file_url
from blog_app.infrastructure.files.local_file_storage import LocalFileStorage
from blog_app.infrastructure.persistence.repositories.user_repository import SqlAlchemyUserRepository
from blog_app.infrastructure.security.bcrypt_password_hasher import BcryptPasswordHasher
from blog_app.infrastructure.security.jwt_token_service import JwtTokenService

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_public(user: User, request: Request) -> UserPublic:
    assert user.id is not None
    return UserPublic(
        id=user.id,
        email=user.email,
        display_name=user.display_name or "",
        profile_image_url=static_file_url(request, user.profile_image_path),
        created_at=user.created_at,
    )


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(
    request: Request,
    body: UserRegisterRequest,
    db: Session = Depends(get_db),
    hasher: BcryptPasswordHasher = Depends(get_password_hasher),
) -> UserPublic:
    users = SqlAlchemyUserRepository(db)
    name = body.display_name.strip() if body.display_name else ""
    try:
        user = register_user(
            body.email,
            body.password,
            display_name=name,
            users=users,
            password_hasher=hasher,
        )
    except EmailAlreadyRegisteredError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    return _user_public(user, request)


@router.post("/login", response_model=TokenResponse)
def login(
    body: UserLoginRequest,
    db: Session = Depends(get_db),
    hasher: BcryptPasswordHasher = Depends(get_password_hasher),
    tokens: JwtTokenService = Depends(get_token_service),
) -> TokenResponse:
    users = SqlAlchemyUserRepository(db)
    try:
        access, _uid = login_user(
            body.email, body.password, users=users, password_hasher=hasher, tokens=tokens
        )
    except InvalidCredentialsError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return TokenResponse(access_token=access)


@router.get("/me", response_model=UserPublic)
def me(
    request: Request,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> UserPublic:
    users = SqlAlchemyUserRepository(db)
    try:
        user = get_user_by_id(user_id, users=users)
    except UserNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _user_public(user, request)


@router.patch("/me", response_model=UserPublic)
def patch_me(
    request: Request,
    body: ProfileUpdateRequest,
    background_tasks: BackgroundTasks,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    storage: LocalFileStorage = Depends(get_file_storage),
) -> UserPublic:
    if body.display_name is None and not body.clear_profile_image:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No changes requested")
    users = SqlAlchemyUserRepository(db)
    try:
        current = get_user_by_id(user_id, users=users)
    except UserNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    old_avatar = current.profile_image_path
    try:
        user = apply_profile_update(
            user_id,
            display_name=body.display_name,
            clear_profile_image=body.clear_profile_image,
            users=users,
        )
    except UserNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if body.clear_profile_image and old_avatar:
        background_tasks.add_task(storage.delete_if_exists, old_avatar)
    return _user_public(user, request)


@router.post("/me/avatar", response_model=UserPublic)
async def upload_avatar(
    request: Request,
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    storage: LocalFileStorage = Depends(get_file_storage),
) -> UserPublic:
    users = SqlAlchemyUserRepository(db)
    try:
        current = get_user_by_id(user_id, users=users)
    except UserNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    data, ct = await read_image_upload(image)
    try:
        rel = storage.save_avatar(user_id, data, ct)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    old = current.profile_image_path
    try:
        user = apply_profile_update(user_id, profile_image_path=rel, users=users)
    except UserNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if old:
        background_tasks.add_task(storage.delete_if_exists, old)
    return _user_public(user, request)
