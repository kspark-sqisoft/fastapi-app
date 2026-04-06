import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { Layout } from "@/components/Layout"
import { Home } from "@/pages/Home"
import { Login } from "@/pages/Login"
import { EditPost } from "@/pages/EditPost"
import { NewPost } from "@/pages/NewPost"
import { PostPage } from "@/pages/PostPage"
import { Profile } from "@/pages/Profile"
import { Register } from "@/pages/Register"

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="text-muted-foreground p-4">…</p>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="posts/new" element={<Protected><NewPost /></Protected>} />
        <Route path="posts/:id/edit" element={<Protected><EditPost /></Protected>} />
        <Route path="posts/:id" element={<PostPage />} />
        <Route path="profile" element={<Protected><Profile /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </BrowserRouter>
  )
}
