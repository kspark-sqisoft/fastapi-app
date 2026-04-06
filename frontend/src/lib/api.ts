const TOKEN_KEY = "blog_token"
const REFRESH_KEY = "blog_refresh_token"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

/** 액세스·리프레시를 함께 저장합니다. null이면 해당 키를 제거합니다. */
export function persistAuthTokens(access: string | null, refresh: string | null) {
  if (access) localStorage.setItem(TOKEN_KEY, access)
  else localStorage.removeItem(TOKEN_KEY)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  else localStorage.removeItem(REFRESH_KEY)
}

/** Dev: Vite proxy forwards /api and /static. Prod: set VITE_API_ORIGIN e.g. http://localhost:8000 */
export function apiOrigin(): string {
  return (import.meta.env.VITE_API_ORIGIN as string | undefined)?.replace(/\/$/, "") ?? ""
}

function apiPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`
  const origin = apiOrigin()
  return origin ? `${origin}${p}` : p
}

export class ApiError extends Error {
  status: number
  body?: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: string | unknown }
    if (typeof j.detail === "string") return j.detail
    if (Array.isArray(j.detail)) return JSON.stringify(j.detail)
    return res.statusText || "Request failed"
  } catch {
    return res.statusText || "Request failed"
  }
}

export type TokenResponse = {
  access_token: string
  refresh_token: string
  token_type: string
}

let refreshInflight: Promise<boolean> | null = null

async function tryRefreshAccessToken(): Promise<boolean> {
  const rt = getRefreshToken()
  if (!rt) return false

  if (!refreshInflight) {
    refreshInflight = (async () => {
      try {
        const res = await fetch(apiPath("/api/v1/auth/refresh"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: rt }),
        })
        if (!res.ok) {
          persistAuthTokens(null, null)
          return false
        }
        const data = (await res.json()) as TokenResponse
        persistAuthTokens(data.access_token, data.refresh_token)
        return true
      } catch {
        persistAuthTokens(null, null)
        return false
      } finally {
        refreshInflight = null
      }
    })()
  }
  return refreshInflight
}

type ApiJsonInit = RequestInit & { auth?: boolean; _retryAfterRefresh?: boolean }

export async function apiJson<T>(path: string, init: ApiJsonInit = {}): Promise<T> {
  const useAuth = init.auth !== false
  const retryAfterRefresh = init._retryAfterRefresh === true
  const fetchInit = { ...init } as Record<string, unknown>
  delete fetchInit.auth
  delete fetchInit._retryAfterRefresh

  const headers = new Headers((fetchInit.headers as HeadersInit) ?? undefined)
  if (!headers.has("Content-Type") && fetchInit.body && !(fetchInit.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }
  if (useAuth) {
    const t = getToken()
    if (t) headers.set("Authorization", `Bearer ${t}`)
  }
  const res = await fetch(apiPath(path), { ...(fetchInit as RequestInit), headers })

  if (res.status === 401 && useAuth && !retryAfterRefresh && getRefreshToken()) {
    const ok = await tryRefreshAccessToken()
    if (ok) {
      return apiJson<T>(path, { ...init, _retryAfterRefresh: true })
    }
  }

  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export type UserPublic = {
  id: number
  email: string
  display_name: string
  profile_image_url: string | null
  created_at: string | null
}

export type Post = {
  id: number
  title: string
  content: string
  author_id: number
  image_url: string | null
  created_at: string | null
  updated_at: string | null
}

export const api = {
  register: (body: { email: string; password: string; display_name?: string }) =>
    apiJson<UserPublic>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    }),

  login: (body: { email: string; password: string }) =>
    apiJson<TokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    }),

  me: () => apiJson<UserPublic>("/api/v1/auth/me"),

  patchMe: (body: { display_name?: string; clear_profile_image?: boolean }) =>
    apiJson<UserPublic>("/api/v1/auth/me", { method: "PATCH", body: JSON.stringify(body) }),

  uploadAvatar: async (file: File) => {
    const fd = new FormData()
    fd.append("image", file)
    return apiJson<UserPublic>("/api/v1/auth/me/avatar", { method: "POST", body: fd })
  },

  posts: () => apiJson<Post[]>("/api/v1/posts", { auth: false }),

  post: (id: number) => apiJson<Post>(`/api/v1/posts/${id}`, { auth: false }),

  createPost: async (title: string, content: string, image?: File | null) => {
    const fd = new FormData()
    fd.append("title", title)
    fd.append("content", content)
    if (image) fd.append("image", image)
    return apiJson<Post>("/api/v1/posts", { method: "POST", body: fd })
  },

  patchPost: (id: number, body: { title?: string; content?: string }) =>
    apiJson<Post>(`/api/v1/posts/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  deletePost: (id: number) =>
    apiJson<void>(`/api/v1/posts/${id}`, { method: "DELETE" }),

  deletePostImage: (id: number) =>
    apiJson<Post>(`/api/v1/posts/${id}/image`, { method: "DELETE" }),

  uploadPostImage: async (id: number, file: File) => {
    const fd = new FormData()
    fd.append("image", file)
    return apiJson<Post>(`/api/v1/posts/${id}/image`, { method: "POST", body: fd })
  },
}
