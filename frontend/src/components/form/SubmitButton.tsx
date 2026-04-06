import type { ComponentProps } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = Omit<ComponentProps<typeof Button>, "type"> & {
  children: React.ReactNode
  pendingLabel?: string
}

/** 부모 form의 action 제출 중 비활성화·라벨 변경 (useFormStatus). 해당 form의 자손에 두세요. */
export function SubmitButton({ children, className, pendingLabel = "처리 중…", ...props }: Props) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className={cn(className)} {...props} disabled={pending || props.disabled}>
      {pending ? pendingLabel : children}
    </Button>
  )
}
