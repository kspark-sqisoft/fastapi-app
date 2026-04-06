import { Link, Outlet, useNavigate } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext"
import { resolvePublicMediaUrl } from "@/lib/mediaUrl"
import { cn } from "@/lib/utils"

export function Layout() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-svh flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-10">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4">
          <Link to="/" className="font-semibold tracking-tight text-lg">
            Clean Blog
          </Link>
          <nav className="flex items-center gap-2">
            {loading ? (
              <span className="text-muted-foreground text-sm">…</span>
            ) : user ? (
              <>
                <Link
                  to="/posts/new"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  새 글
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "rounded-full",
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={resolvePublicMediaUrl(user.profile_image_url)} alt="" />
                      <AvatarFallback>
                        {(user.display_name || user.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => {
                        navigate("/profile")
                      }}
                    >
                      프로필
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        logout()
                        navigate("/")
                      }}
                    >
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  로그인
                </Link>
                <Link to="/register" className={cn(buttonVariants({ size: "sm" }))}>
                  가입
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
