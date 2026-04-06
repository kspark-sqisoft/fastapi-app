/** useActionState 등으로 돌려받은 에러·안내 메시지 */
export function FormActionMessage({ message }: { message: string | null | undefined }) {
  if (!message) return null
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  )
}
