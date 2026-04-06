import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ApiError, api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function NewPost() {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    try {
      const p = await api.createPost(title, content, image)
      toast.success("글이 등록되었습니다")
      navigate(`/posts/${p.id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "등록에 실패했습니다")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">새 글</h1>
        <p className="text-muted-foreground mt-1">제목·본문은 필수, 이미지는 선택입니다.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>작성</CardTitle>
          <CardDescription>multipart로 서버에 전송됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="image">이미지 (선택)</Label>
              <Input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                취소
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "등록 중…" : "등록"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
