import { useActionState, useRef } from "react"
import { toast } from "sonner"
import { ApiError, api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { resolvePublicMediaUrl } from "@/lib/mediaUrl"
import { FormActionMessage } from "@/components/form/FormActionMessage"
import { SubmitButton } from "@/components/form/SubmitButton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

type FieldError = { error: string } | null

export function Profile() {
  const { user, refreshMe } = useAuth()
  const avatarFormRef = useRef<HTMLFormElement>(null)

  const [nameState, nameAction, namePending] = useActionState(
    async (_prev: FieldError, formData: FormData): Promise<FieldError> => {
      const display_name = String(formData.get("display_name") ?? "").trim()
      if (!display_name) return { error: "이름을 입력하세요." }
      try {
        await api.patchMe({ display_name })
        await refreshMe()
        toast.success("이름을 저장했습니다")
        return null
      } catch (err) {
        return { error: err instanceof ApiError ? err.message : "저장에 실패했습니다" }
      }
    },
    null,
  )

  const [avatarState, avatarAction, avatarPending] = useActionState(
    async (_prev: FieldError, formData: FormData): Promise<FieldError> => {
      const file = formData.get("image")
      if (!(file instanceof File) || file.size === 0) return null
      try {
        await api.uploadAvatar(file)
        await refreshMe()
        toast.success("프로필 이미지를 변경했습니다")
        return null
      } catch (err) {
        return { error: err instanceof ApiError ? err.message : "업로드에 실패했습니다" }
      }
    },
    null,
  )

  async function clearAvatar() {
    if (!window.confirm("프로필 이미지를 제거할까요?")) return
    try {
      await api.patchMe({ clear_profile_image: true })
      await refreshMe()
      toast.success("이미지를 제거했습니다")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "제거에 실패했습니다")
    }
  }

  const busy = namePending || avatarPending

  if (!user) {
    return <p className="text-muted-foreground">로그인이 필요합니다.</p>
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">프로필</h1>
        <p className="text-muted-foreground mt-1">{user.email}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>프로필 이미지</CardTitle>
          <CardDescription>JPEG, PNG, WebP, GIF (용량 제한은 서버 설정)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={resolvePublicMediaUrl(user.profile_image_url)} alt="" />
            <AvatarFallback className="text-lg">
              {(user.display_name || user.email).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <form
            ref={avatarFormRef}
            action={avatarAction}
            encType="multipart/form-data"
            className="contents"
          >
            <input
              type="file"
              name="image"
              id="profile-avatar-file"
              className="sr-only"
              accept="image/*"
              disabled={avatarPending}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) avatarFormRef.current?.requestSubmit()
                e.target.value = ""
              }}
            />
            <FormActionMessage message={avatarState?.error} />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => document.getElementById("profile-avatar-file")?.click()}
              >
                {avatarPending ? "업로드 중…" : "이미지 업로드"}
              </Button>
              {user.profile_image_url ? (
                <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void clearAvatar()}>
                  이미지 제거
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>표시 이름</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={nameAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">이름</Label>
              <Input
                id="display_name"
                name="display_name"
                key={user.display_name}
                defaultValue={user.display_name}
                maxLength={100}
                required
              />
            </div>
            <FormActionMessage message={nameState?.error} />
            <SubmitButton pendingLabel="저장 중…">저장</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
