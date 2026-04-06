const TOKEN_KEY = "blog_token"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
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

export async function apiJson<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }
  if (init.auth !== false) {
    const t = getToken()
    if (t) headers.set("Authorization", `Bearer ${t}`)
  }
  const res = await fetch(apiPath(path), { ...init, headers })
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

export type TokenResponse = { access_token: string; token_type: string }

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
