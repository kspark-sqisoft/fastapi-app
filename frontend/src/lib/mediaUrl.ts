/**
 * API가 Docker 내부에서 만든 http://api:8000/... URL 을
 * 브라우저에서 열 수 있도록 현재 페이지 출처 기준으로 바꿉니다.
 */
export function resolvePublicMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  try {
    const u = new URL(url)
    if (u.hostname === "api") {
      return `${window.location.origin}${u.pathname}${u.search}`
    }
  } catch {
    /* ignore */
  }
  return url
}
