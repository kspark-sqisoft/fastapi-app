import { useEffect, useRef, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ApiError, api, type Post } from "@/lib/api"
import { resolvePublicMediaUrl } from "@/lib/mediaUrl"
import { useAuth } from "@/context/AuthContext"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function EditPost() {
  const { id } = useParams<{ id: string }>()
  const postId = Number(id)
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [newImage, setNewImage] = useState<File | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!newImage) {
      setLocalPreview(null)
      return
    }
    const u = URL.createObjectURL(newImage)
    setLocalPreview(u)
    return () => URL.revokeObjectURL(u)
  }, [newImage])

  useEffect(() => {
    if (!Number.isFinite(postId)) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const p = await api.post(postId)
        if (!cancelled) {
          setPost(p)
          setTitle(p.title)
          setContent(p.content)
        }
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

  const isOwner = Boolean(user && post && user.id === post.author_id)

  async function handleRemoveServerImage() {
    if (!post || !window.confirm("글 이미지를 제거할까요?")) return
    setPending(true)
    try {
      const p = await api.deletePostImage(post.id)
      setPost(p)
      setNewImage(null)
      if (fileRef.current) fileRef.current.value = ""
      toast.success("이미지를 제거했습니다")
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "제거에 실패했습니다")
    } finally {
      setPending(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!post) return
    setPending(true)
    try {
      const titleChanged = title.trim() !== post.title
      const contentChanged = content !== post.content
      if (titleChanged || contentChanged) {
        await api.patchPost(post.id, {
          ...(titleChanged ? { title: title.trim() } : {}),
          ...(contentChanged ? { content } : {}),
        })
      }
      if (newImage) {
        await api.uploadPostImage(post.id, newImage)
      }
      if (!titleChanged && !contentChanged && !newImage) {
        toast.info("변경된 내용이 없습니다")
        setPending(false)
        return
      }
      toast.success("저장했습니다")
      navigate(`/posts/${post.id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "저장에 실패했습니다")
    } finally {
      setPending(false)
    }
  }

  if (!Number.isFinite(postId)) {
    return <p className="text-destructive">잘못된 주소입니다.</p>
  }

  if (authLoading || loading) {
    return <p className="text-muted-foreground">불러오는 중…</p>
  }

  if (!post) {
    return <p className="text-muted-foreground">글을 찾을 수 없습니다.</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isOwner) {
    return <Navigate to={`/posts/${postId}`} replace />
  }

  const serverImageUrl = post.image_url
    ? (resolvePublicMediaUrl(post.image_url) ?? post.image_url)
    : null
  const previewSrc = localPreview ?? serverImageUrl

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to={`/posts/${post.id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          ← 글 보기
        </Link>
      </div>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">글 수정</h1>
        <p className="text-muted-foreground mt-1">제목·본문과 이미지를 바꿀 수 있습니다.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>내용</CardTitle>
          <CardDescription>새 이미지를 고르면 저장 시 기존 이미지가 교체됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">본문</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={10}
                className="resize-y min-h-[200px]"
              />
            </div>
            <div className="space-y-3">
              <Label>이미지</Label>
              {previewSrc ? (
                <figure className="overflow-hidden rounded-lg border bg-muted/30">
                  <img
                    src={previewSrc}
                    alt=""
                    className="w-full max-h-48 object-contain mx-auto"
                  />
                </figure>
              ) : (
                <p className="text-sm text-muted-foreground">등록된 이미지가 없습니다.</p>
              )}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setNewImage(e.target.files?.[0] ?? null)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => fileRef.current?.click()}
                >
                  {serverImageUrl || newImage ? "이미지 바꾸기" : "이미지 추가"}
                </Button>
                {newImage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      setNewImage(null)
                      if (fileRef.current) fileRef.current.value = ""
                    }}
                  >
                    선택 취소
                  </Button>
                ) : serverImageUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => void handleRemoveServerImage()}
                  >
                    이미지 제거
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={pending}>
                {pending ? "저장 중…" : "저장"}
              </Button>
              <Link
                to={`/posts/${post.id}`}
                className={cn(buttonVariants({ variant: "outline" }), pending && "pointer-events-none opacity-50")}
              >
                취소
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
