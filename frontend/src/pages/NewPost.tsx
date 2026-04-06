import { useActionState } from "react"
import { useNavigate } from "react-router-dom"
import { FormActionMessage } from "@/components/form/FormActionMessage"
import { SubmitButton } from "@/components/form/SubmitButton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"

type NewPostState = { error: string } | null

export function NewPost() {
  const navigate = useNavigate()

  const [state, formAction] = useActionState(async (_prev: NewPostState, formData: FormData): Promise<NewPostState> => {
    const title = String(formData.get("title") ?? "").trim()
    const content = String(formData.get("content") ?? "")
    const image = formData.get("image")
    const imageFile = image instanceof File && image.size > 0 ? image : null
    if (!title) return { error: "제목을 입력하세요." }
    try {
      const post = await api.createPost(title, content, imageFile)
      navigate(`/posts/${post.id}`)
      return null
    } catch {
      return { error: "글 작성에 실패했습니다." }
    }
  }, null)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>새 글</CardTitle>
          <CardDescription>제목과 내용을 입력하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} encType="multipart/form-data" className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input id="title" name="title" type="text" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea id="content" name="content" rows={12} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">이미지 (선택)</Label>
              <Input id="image" name="image" type="file" accept="image/*" />
            </div>
            <FormActionMessage message={state?.error} />
            <div className="flex gap-2">
              <SubmitButton>게시</SubmitButton>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
