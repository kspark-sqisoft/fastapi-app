import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ApiError, api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { resolvePublicMediaUrl } from "@/lib/mediaUrl"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function Profile() {
  const { user, refreshMe } = useAuth()
  const [name, setName] = useState(user?.display_name ?? "")
  const [pending, setPending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName(user?.display_name ?? "")
  }, [user?.display_name])

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    try {
      await api.patchMe({ display_name: name })
      await refreshMe()
      toast.success("이름을 저장했습니다")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "저장에 실패했습니다")
    } finally {
      setPending(false)
    }
  }

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setPending(true)
    try {
      await api.uploadAvatar(file)
      await refreshMe()
      toast.success("프로필 이미지를 변경했습니다")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "업로드에 실패했습니다")
    } finally {
      setPending(false)
    }
  }

  async function clearAvatar() {
    if (!window.confirm("프로필 이미지를 제거할까요?")) return
    setPending(true)
    try {
      await api.patchMe({ clear_profile_image: true })
      await refreshMe()
      toast.success("이미지를 제거했습니다")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "제거에 실패했습니다")
    } finally {
      setPending(false)
    }
  }

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
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => void onAvatar(e)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => fileRef.current?.click()}
            >
              이미지 업로드
            </Button>
            {user.profile_image_url ? (
              <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => void clearAvatar()}>
                이미지 제거
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>표시 이름</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void saveName(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">이름</Label>
              <Input
                id="display_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "저장 중…" : "저장"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
