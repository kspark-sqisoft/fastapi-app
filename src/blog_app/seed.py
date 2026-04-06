"""랜덤 게시글 시드. 기본 20개, 시드 전용 사용자가 없으면 생성합니다."""

from __future__ import annotations

import argparse
import random
import sys

from sqlalchemy import select

from blog_app.config import settings
from blog_app.infrastructure.persistence.database import Base, SessionLocal, engine
from blog_app.infrastructure.persistence.models import PostModel, UserModel
from blog_app.infrastructure.persistence.sqlite_migrate import ensure_sqlite_columns
from blog_app.infrastructure.security.bcrypt_password_hasher import BcryptPasswordHasher

SEED_EMAIL = "seed@example.com"
SEED_PASSWORD = "seedseed12"

_PREFIXES = [
    "오늘의 기록",
    "짧은 생각",
    "개발 노트",
    "주말 일기",
    "읽은 것들",
    "프로젝트 메모",
    "커피 한 잔",
    "날씨와 코드",
]

_TOPICS = [
    "FastAPI",
    "React",
    "Docker",
    "PostgreSQL",
    "클린 아키텍처",
    "타입스크립트",
    "REST API",
    "배포 자동화",
]

_SENTENCES = [
    "작은 단위로 나누어 구현하면 테스트하기 쉽다.",
    "문서화는 나중의 나를 위한 선물이다.",
    "에러 메시지는 구체적일수록 좋다.",
    "로컬과 프로덕션의 차이를 최소화하려고 한다.",
    "리팩터링은 기능 추가와 함께 자주 한다.",
    "의존성 방향을 한 방향으로 유지하는 것이 중요하다.",
    "시드 데이터는 데모와 통합 테스트에 유용하다.",
    "환경 변수로 설정을 분리해 두면 배포가 편하다.",
    "트랜잭션 경계를 명확히 하는 습관이 필요하다.",
    "코드 리뷰는 배우는 기회다.",
]


def _random_title() -> str:
    p = random.choice(_PREFIXES)
    t = random.choice(_TOPICS)
    n = random.randint(1, 9999)
    return f"{p}: {t} #{n}"


def _random_content() -> str:
    paras = random.randint(2, 5)
    parts: list[str] = []
    for _ in range(paras):
        sents = random.randint(2, 4)
        block = " ".join(random.choice(_SENTENCES) for _ in range(sents))
        parts.append(block)
    return "\n\n".join(parts)


def ensure_schema() -> None:
    Base.metadata.create_all(bind=engine)
    if settings.database_url.startswith("sqlite"):
        ensure_sqlite_columns(engine)


def run(*, count: int, email: str, password: str) -> int:
    ensure_schema()
    db = SessionLocal()
    try:
        user = db.scalars(select(UserModel).where(UserModel.email == email)).first()
        if user is None:
            hasher = BcryptPasswordHasher()
            user = UserModel(
                email=email,
                hashed_password=hasher.hash(password),
                display_name="Seed",
            )
            db.add(user)
            db.flush()
            print(f"Created user {email} (id={user.id})", file=sys.stderr)
        else:
            print(f"Using existing user {email} (id={user.id})", file=sys.stderr)

        for _ in range(count):
            db.add(
                PostModel(
                    title=_random_title(),
                    content=_random_content(),
                    author_id=user.id,
                    image_path=None,
                )
            )
        db.commit()
        print(f"Inserted {count} post(s) for author_id={user.id}.")
        return 0
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed random blog posts.")
    parser.add_argument(
        "-n", "--count", type=int, default=20, help="Number of posts (default: 20)"
    )
    parser.add_argument(
        "--email",
        default=SEED_EMAIL,
        help=f"Author user email (default: {SEED_EMAIL})",
    )
    parser.add_argument(
        "--password",
        default=SEED_PASSWORD,
        help="Password when creating the seed user (default: seed default)",
    )
    args = parser.parse_args()
    if args.count < 1:
        print("count must be >= 1", file=sys.stderr)
        sys.exit(1)
    sys.exit(run(count=args.count, email=args.email, password=args.password))


if __name__ == "__main__":
    main()
