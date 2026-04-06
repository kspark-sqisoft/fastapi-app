# FastAPI 클린 아키텍처 블로그 (공부용)

회원가입·로그인(JWT)·게시글 CRUD·프로필/글 이미지 업로드를 포함한 **풀스택 예제**입니다.

- **백엔드**: FastAPI, 클린 아키텍처, **[uv](https://docs.astral.sh/uv/)** 로 의존성 관리, SQLite 또는 **PostgreSQL**
- **프론트엔드**: `frontend/` — **React (Vite)**, **Tailwind CSS v4**, **[shadcn/ui](https://ui.shadcn.com/)**
- **인프라**: `docker-compose.yml`(Postgres) + **`docker-compose.dev.yml`**(핫 리로드) / **`docker-compose.release.yml`**(Nginx 정적 배포)

---

## 사전 요구사항

- **Python 3.11 이상** (이 저장소는 `pyproject.toml`의 `requires-python`과 맞춥니다.)
- **[uv](https://github.com/astral-sh/uv)** 설치  
  - macOS (Homebrew): `brew install uv`  
  - 공식 스크립트: [Installing uv](https://docs.astral.sh/uv/getting-started/installation/)
- **프론트 개발**: **Node.js 20+** 및 npm (또는 pnpm 등)
- **Docker Compose**로 DB/API를 띄울 경우: Docker Desktop 등

설치 확인:

```bash
uv --version
python3 --version
node --version
```

---

## Docker Compose

공통 파일 **`docker-compose.yml`** 은 **PostgreSQL** 만 정의합니다. API/웹은 아래 **dev** 또는 **release** 파일과 **함께** 실행합니다.

```bash
# 항상 두 파일을 같이 지정합니다
docker compose -f docker-compose.yml -f docker-compose.dev.yml ...
docker compose -f docker-compose.yml -f docker-compose.release.yml ...
```

- **postgres**: `localhost:5432`, 사용자/DB/비밀번호 모두 `blog`
- 업로드: 호스트 `./uploads` ↔ 컨테이너 `/app/uploads` (dev/release API에서 마운트)

중지(예: dev 스택):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

DB 볼륨까지 지우려면:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

### Dev (핫 리로드)

API에 **`uvicorn --reload`**, 프론트에 **Vite HMR**. 기동 순서는 Compose **`depends_on`**: postgres → **api** → **web**.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- API: **http://localhost:8000** (`./src` 마운트, 코드 수정 시 자동 재시작)
- 프론트: **http://localhost:5173** (`./frontend` 마운트, HMR; 프록시 대상은 컨테이너 네트워크의 `http://api:8000` — 환경변수 **`VITE_DEV_API_PROXY`**)
- 로컬에서 백엔드만 띄운 뒤 프론트만 돌릴 때는 프록시 기본값 **`127.0.0.1:8000`** 이 그대로 쓰입니다.

### Release (배포용 이미지)

API는 **`Dockerfile`**, 웹은 **`frontend/Dockerfile`**(빌드 + Nginx). 브라우저는 **한 출처**로 `8080`만 열면 되고, Nginx가 `/api`, `/static` 을 API로 넘깁니다.

```bash
docker compose -f docker-compose.yml -f docker-compose.release.yml up --build -d
```

- UI: **http://localhost:8080** (정적 React + API 프록시)

### 호스트에서만 개발 (Docker는 DB만)

1. DB: `docker compose up -d postgres` (루트 `docker-compose.yml` 단독으로 가능)
2. 백엔드: `uv run uvicorn blog_app.main:app --reload --host 127.0.0.1 --port 8000` (또는 `uv run blog-serve`)
3. 프론트: `cd frontend && npm run dev` → **5173**, API는 **8000** 으로 프록시

`.env` 의 `DATABASE_URL`:

```env
DATABASE_URL=postgresql+psycopg2://blog:blog@localhost:5432/blog
```

---

## 프론트엔드 (React + Tailwind + shadcn/ui)

디렉터리: `frontend/`

```bash
cd frontend
npm install
npm run dev
```

- 기본 주소: **http://localhost:5173**
- 로컬 개발 시 프록시는 **`VITE_DEV_API_PROXY`** 가 있으면 그 주소( Docker dev 컨테이너에서는 `http://api:8000` ), 없으면 **`http://127.0.0.1:8000`**
- 별도 도메인에 빌드 결과만 올릴 때는 `frontend/.env.example` 의 **`VITE_API_ORIGIN`** 과 백엔드 **`CORS_ORIGINS`** 를 맞춥니다.

화면: 글 목록/상세(이미지 표시), **글 수정**(`/posts/:id/edit`: 제목·본문·이미지 교체/제거), 로그인·가입, 새 글(multipart), 프로필 이름·아바타.

---

## 현재 폴더에서 프로젝트 만들기 (참고 절차)

이 저장소는 이미 아래와 같이 **빈 디렉터리에서** 초기화된 상태를 가정합니다. 처음부터 따라 해 보려면:

```bash
mkdir fastapi-app && cd fastapi-app
uv init --name blog_app --package
```

- `uv init`: `pyproject.toml`, `src/<패키지명>/` 등 기본 뼈대 생성  
- `--package`: 라이브러리/앱 코드를 `src/` 레이아웃으로 둠 (권장)

이후 이 README의 **의존성 추가** 절차와 소스 트리를 그대로 맞추면 동일한 구조가 됩니다.

---

## 라이브러리 설치 절차

프로젝트 루트(`pyproject.toml`이 있는 폴더)에서:

### 1) 의존성 설치(동기화)

```bash
uv sync
```

- `uv.lock`이 있으면 그에 맞춰 `.venv`에 설치합니다.  
- 처음 클론 후에는 **반드시** `uv sync` 한 번 실행하는 습관을 들이면 됩니다.

### 2) 개별 패키지 추가(참고)

이미 `pyproject.toml`에 명시되어 있으므로 일반적으로는 필요 없습니다. 새로 비슷한 프로젝트를 만들 때 참고용으로:

```bash
uv add fastapi 'uvicorn[standard]' sqlalchemy 'python-jose[cryptography]' bcrypt pydantic-settings email-validator
```

- `zsh`에서는 패키지 extras 대괄호(`[...]`)를 **따옴표**로 감싸야 합니다.

### 3) 개발용 도구(선택)

```bash
uv add --dev ruff mypy
```

### 4) 랜덤 게시글 시드 (선택)

`.env` 의 `DATABASE_URL` 이 가리키는 DB에 **랜덤 글 20개**를 넣습니다. `seed@example.com` 사용자가 없으면 만들고(비밀번호 기본 `seedseed12`), 그 계정으로 글을 작성합니다.

```bash
uv run blog-seed
uv run blog-seed -n 50
uv run blog-seed --email demo@example.com --password yourpass12
```

---

## 아키텍처 (클린 아키텍처)

### 의존성 방향

**도메인 → 애플리케이션 → 인프라 / 프레젠테이션** 순으로, **안쪽은 바깥쪽을 모릅니다.**

- **Domain**: 비즈니스 개념(엔티티). 프레임워크·DB·HTTP 없음.
- **Application**: 유스케이스(동작)와 **포트(인터페이스, `Protocol`)**. “무엇을 할지”만 정의.
- **Infrastructure**: 포트의 구현(SQLAlchemy 저장소, bcrypt, JWT 등). “어떻게 할지”.
- **Presentation**: FastAPI 라우터, Pydantic 스키마, DI(`Depends`). HTTP 어댑터.

```mermaid
flowchart TB
  subgraph presentation [Presentation]
    API[FastAPI routers / schemas / deps]
  end
  subgraph application [Application]
    UC[Use cases]
    PORTS[Ports: Repository, TokenService, PasswordHasher]
  end
  subgraph domain [Domain]
    E[Entities: User, Post]
  end
  subgraph infrastructure [Infrastructure]
    REPO[SQLAlchemy repositories]
    SEC[bcrypt / JWT]
    DB[(SQLite + ORM models)]
  end
  API --> UC
  UC --> PORTS
  UC --> E
  REPO -. implements .-> PORTS
  SEC -. implements .-> PORTS
  REPO --> DB
  API --> REPO
  API --> SEC
```

### 디렉터리 구조

| 경로 | 역할 |
|------|------|
| `src/blog_app/domain/entities/` | 엔티티 (`User`, `Post`) |
| `src/blog_app/application/ports/` | 저장소·보안 추상화 (`Protocol`) |
| `src/blog_app/application/use_cases/` | 회원가입, 로그인, 글 CRUD 등 순수 로직 |
| `src/blog_app/application/errors.py` | 애플리케이션 수준 예외 |
| `src/blog_app/infrastructure/persistence/` | DB 엔진, ORM 모델, 저장소 구현체, SQLite 컬럼 보정 |
| `src/blog_app/infrastructure/files/` | 로컬 디스크 이미지 저장(`LocalFileStorage`) |
| `src/blog_app/infrastructure/security/` | bcrypt 해시, JWT 발급/검증 |
| `src/blog_app/presentation/api/` | FastAPI 라우트, `Depends`로 유스케이스에 연결 |
| `src/blog_app/presentation/schemas/` | 요청/응답 Pydantic 모델 |
| `src/blog_app/presentation/upload_util.py` | 업로드 용량·MIME 검사 |
| `src/blog_app/presentation/url_helper.py` | `/static/...` 절대 URL 생성 |
| `src/blog_app/config.py` | `pydantic-settings` 기반 설정 |
| `src/blog_app/main.py` | 앱 팩토리, 라우터 마운트, 시작 시 테이블 생성 |

공부 포인트:

1. 유스케이스는 **`UserRepository` 같은 Protocol**만 알고, SQLAlchemy는 모릅니다.  
2. 테스트 시 **가짜 저장소**를 넣어 유스케이스만 단위 테스트하기 쉽습니다.  
3. 프레임워크를 바꿔도 도메인·유스케이스는 그대로 둘 수 있습니다.

---

## 환경 변수

`.env.example`을 복사해 `.env`를 만듭니다.

```bash
cp .env.example .env
```

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `DATABASE_URL` | SQLAlchemy URL | `sqlite:///./blog.db` |
| `SECRET_KEY` | JWT 서명 키 | 개발용 기본값 (**운영에서는 반드시 변경**) |
| `JWT_ALGORITHM` | JWT 알고리즘 | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 액세스 토큰 유효 시간(분) | `1440` |
| `APP_NAME` | OpenAPI 제목 등 | `Clean Blog API` |
| `UPLOAD_DIR` | 이미지 저장 디렉터리(프로젝트 기준) | `uploads` |
| `MAX_UPLOAD_BYTES` | 이미지 최대 크기(바이트) | `5242880`(5MB) |

---

## 실행 방법

프로젝트 루트에서 실행합니다.

### 방법 A: uvicorn 직접 (가장 흔함)

```bash
uv run uvicorn blog_app.main:app --reload --host 127.0.0.1 --port 8000
```

- `--reload`: 코드 변경 시 자동 재시작(개발용).  
- 브라우저에서 문서: `http://127.0.0.1:8000/docs` (Swagger UI)

### 방법 B: 패키지 스크립트

```bash
uv run blog-serve
```

- `pyproject.toml`의 `[project.scripts]` → `blog-serve` → `blog_app.__main__:main`  
- 기본: `127.0.0.1:8000`, `reload=True`

### 방법 C: 모듈 실행

```bash
uv run python -m blog_app
```

### 데이터베이스

- 기본은 **SQLite** 파일 `blog.db`(프로젝트 루트).  
- 최초 기동 시 `main.py`의 lifespan에서 `create_all`로 테이블이 생성됩니다.  
- 기존 SQLite DB에는 `sqlite_migrate`가 부족한 컬럼을 `ALTER TABLE`로 보정합니다.  
- DB를 초기화하려면 서버를 끄고 `blog.db` 파일을 삭제하면 됩니다.  
- 업로드 파일은 `UPLOAD_DIR`(기본 `uploads/`)에 저장되며, 앱이 **`/static`** 으로 같은 경로를 마운트해 브라우저에서 이미지 URL로 열 수 있습니다.

---

## API 요약

기본 prefix: **`/api/v1`**

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/auth/register` | 없음 | 회원가입(JSON, 선택 `display_name`) |
| POST | `/auth/login` | 없음 | 로그인 → `access_token` |
| GET | `/auth/me` | Bearer | 현재 사용자(`display_name`, `profile_image_url`) |
| PATCH | `/auth/me` | Bearer | 프로필(JSON: `display_name`, `clear_profile_image`) |
| POST | `/auth/me/avatar` | Bearer | 프로필 이미지 업로드(multipart 필드 `image`) |
| GET | `/posts` | 없음 | 목록 (`?author_id=&skip=&limit=`), 각 항목에 `image_url` |
| GET | `/posts/{id}` | 없음 | 단건, `image_url`로 글 이미지 표시 가능 |
| POST | `/posts` | Bearer | 글 작성(**multipart**: `title`, `content`, 선택 `image`) |
| POST | `/posts/{id}/image` | Bearer | 글 이미지 추가·교체(multipart `image`, 작성자만) |
| DELETE | `/posts/{id}/image` | Bearer | 글 이미지 제거(작성자만) |
| PATCH | `/posts/{id}` | Bearer | 제목·본문 JSON 수정(작성자만) |
| DELETE | `/posts/{id}` | Bearer | 삭제(작성자만, 이미지 파일은 응답 후 정리) |
| GET | `/static/...` | 없음 | 저장된 이미지 파일 |
| GET | `/health` | 없음 | 헬스 체크 |

인증 헤더 예: `Authorization: Bearer <access_token>`

### curl 예시

```bash
# 회원가입 (표시 이름 선택)
curl -s -X POST http://127.0.0.1:8000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"yourpassword","display_name":"나"}'

# 로그인
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"yourpassword"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 프로필 이름 수정
curl -s -X PATCH http://127.0.0.1:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"display_name":"새 이름"}'

# 프로필 이미지 (필드 이름: image)
curl -s -X POST http://127.0.0.1:8000/api/v1/auth/me/avatar \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@./photo.png;type=image/png"

# 글 작성 (multipart, 이미지 선택 필드명: image)
curl -s -X POST http://127.0.0.1:8000/api/v1/posts \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=제목" \
  -F "content=본문" \
  -F "image=@./photo.png;type=image/png"

# 단건 조회 — 응답의 image_url 을 브라우저에서 열면 이미지 확인
curl -s http://127.0.0.1:8000/api/v1/posts/1

# 목록
curl -s http://127.0.0.1:8000/api/v1/posts
```

---

## 운영·학습 시 참고

- **비밀번호**: `bcrypt`로 해시합니다. `passlib` 대신 최신 `bcrypt`와의 호환을 위해 직접 사용합니다.  
- **마이그레이션**: 공부용으로 Alembic은 넣지 않았습니다. SQLite는 시작 시 컬럼 보정만 수행합니다. 스키마를 자주 바꾸면 Alembic 도입을 권장합니다.  
- **이미지**: JPEG/PNG/WebP/GIF만 허용하며, 파일 시그니처와 `Content-Type`이 맞아야 저장됩니다.  
- **비동기**: 저장소는 동기 SQLAlchemy입니다. 트래픽이 커지면 async 엔진·세션으로 인프라만 확장하는 연습을 할 수 있습니다.

---

## 라이선스

학습용 예제입니다. 필요에 맞게 자유롭게 수정하세요.
