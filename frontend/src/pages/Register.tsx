import { useActionState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FormActionMessage } from "@/components/form/FormActionMessage"
import { SubmitButton } from "@/components/form/SubmitButton"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

type RegisterState = { error: string } | null

export function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [state, formAction] = useActionState(async (_prev: RegisterState, formData: FormData): Promise<RegisterState> => {
    const username = String(formData.get("username") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    if (!username || !password) return { error: "아이디와 비밀번호를 입력하세요." }
    if (password.length < 8) return { error: "비밀번호는 8자 이상이어야 합니다." }
    try {
      await register(username, password)
      navigate("/", { replace: true })
      return null
    } catch {
      return { error: "회원가입에 실패했습니다." }
    }
  }, null)

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>회원가입</CardTitle>
          <CardDescription>새 계정을 만듭니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input id="username" name="username" type="text" autoComplete="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 (8자 이상)</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
            </div>
            <FormActionMessage message={state?.error} />
            <SubmitButton className="w-full">가입하기</SubmitButton>
          </form>
          <Link to="/login" className={cn(buttonVariants({ variant: "link" }), "mt-2 inline-flex w-full justify-center")}>
            이미 계정이 있으면 로그인
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
