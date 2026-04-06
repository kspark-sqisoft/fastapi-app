import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ApiError, api, type Post } from "@/lib/api"
import { resolvePublicMediaUrl } from "@/lib/mediaUrl"
import { useAuth } from "@/context/AuthContext"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function PostPage() {
  const { id } = useParams<{ id: string }>()
  const postId = Number(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!Number.isFinite(postId)) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const p = await api.post(postId)
        if (!cancelled) setPost(p)
      } catch (e) {
        if (!cancelled) toast.error(e instanceof ApiError ? e.message : "글을 불러오지 못했습니다")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [postId])

  const isOwner = user && post && user.id === post.author_id

  async function handleDelete() {
    if (!post || !window.confirm("이 글을 삭제할까요?")) return
    try {
      await api.deletePost(post.id)
      toast.success("삭제했습니다")
      navigate("/")
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "삭제에 실패했습니다")
    }
  }

  if (!Number.isFinite(postId)) {
    return <p className="text-destructive">잘못된 주소입니다.</p>
  }

  if (loading) return <p className="text-muted-foreground">불러오는 중…</p>
  if (!post) return <p className="text-muted-foreground">글을 찾을 수 없습니다.</p>

  return (
    <article className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          ← 목록
        </Link>
        {isOwner ? (
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/posts/${post.id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              수정
            </Link>
            <Button variant="destructive" size="sm" type="button" onClick={() => void handleDelete()}>
              삭제
            </Button>
          </div>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-semibold">{post.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            작성자 #{post.author_id}
            {post.created_at ? ` · ${new Date(post.created_at).toLocaleString()}` : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {post.image_url ? (
            <figure className="overflow-hidden rounded-lg border bg-muted/30">
              <img
                src={resolvePublicMediaUrl(post.image_url) ?? post.image_url}
                alt=""
                className="w-full max-h-[480px] object-contain mx-auto"
              />
            </figure>
          ) : null}
          <Separator />
          <div className="max-w-none whitespace-pre-wrap text-base leading-relaxed">{post.content}</div>
        </CardContent>
      </Card>
    </article>
  )
}
