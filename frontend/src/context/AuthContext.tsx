import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { ApiError, api, getToken, setToken, type UserPublic } from "@/lib/api"

type AuthContextValue = {
  user: UserPublic | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    const t = getToken()
    if (!t) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await api.me()
      setUser(me)
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setToken(null)
        setUser(null)
      }
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshMe().catch(() => {
      setLoading(false)
    })
  }, [refreshMe])

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await api.login({ email, password })
    setToken(access_token)
    await refreshMe()
  }, [refreshMe])

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      await api.register({ email, password, display_name: displayName || undefined })
      await login(email, password)
    },
    [login],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshMe }),
    [user, loading, login, register, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
