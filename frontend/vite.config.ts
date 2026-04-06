import type { IncomingMessage } from "node:http"
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

function forwardClientHost(proxy: {
  on: (ev: "proxyReq", fn: (proxyReq: { setHeader: (k: string, v: string) => void }, req: IncomingMessage) => void) => void
}) {
  proxy.on("proxyReq", (proxyReq, req) => {
    const host = req.headers.host
    if (host) proxyReq.setHeader("X-Forwarded-Host", host)
    const xfProto = req.headers["x-forwarded-proto"]
    const proto = typeof xfProto === "string" ? xfProto.split(",")[0].trim() : "http"
    proxyReq.setHeader("X-Forwarded-Proto", proto)
  })
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const proxyTarget =
    env.VITE_DEV_API_PROXY || process.env.VITE_DEV_API_PROXY || "http://127.0.0.1:8000"

  const proxyCommon = {
    target: proxyTarget,
    changeOrigin: true,
    configure: forwardClientHost,
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": proxyCommon,
        "/static": proxyCommon,
      },
    },
  }
})
