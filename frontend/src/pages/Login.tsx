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

type LoginState = { error: string } | null

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [state, formAction] = useActionState(async (_prev: LoginState, formData: FormData): Promise<LoginState> => {
    const username = String(formData.get("username") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    if (!username || !password) return { error: "아이디와 비밀번호를 입력하세요." }
    try {
      await login(username, password)
      navigate("/", { replace: true })
      return null
    } catch {
      return { error: "로그인에 실패했습니다." }
    }
  }, null)

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>계정으로 로그인하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input id="username" name="username" type="text" autoComplete="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            <FormActionMessage message={state?.error} />
            <SubmitButton className="w-full">로그인</SubmitButton>
          </form>
          <Link to="/register" className={cn(buttonVariants({ variant: "link" }), "mt-2 inline-flex w-full justify-center")}>
            계정이 없으면 회원가입
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
