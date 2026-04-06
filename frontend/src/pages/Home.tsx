import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { ApiError, api, type Post } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await api.posts()
        if (!cancelled) setPosts(list)
      } catch (e) {
        if (!cancelled) toast.error(e instanceof ApiError ? e.message : "목록을 불러오지 못했습니다")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <p className="text-muted-foreground">불러오는 중…</p>
  }

  if (!posts.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        아직 글이 없습니다. 로그인 후 첫 글을 작성해 보세요.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">글 목록</h1>
        <p className="text-muted-foreground mt-1">최신 순으로 표시됩니다.</p>
      </div>
      <ul className="space-y-4">
        {posts.map((p) => (
          <li key={p.id}>
            <Link to={`/posts/${p.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl">{p.title}</CardTitle>
                    {p.image_url ? <Badge variant="secondary">이미지</Badge> : null}
                  </div>
                  <CardDescription>
                    작성자 #{p.author_id}
                    {p.created_at
                      ? ` · ${new Date(p.created_at).toLocaleString()}`
                      : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{p.content}</p>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
