// proxy.ts — equivalente ao middleware.ts em Next.js 16+
// Protege rotas autenticadas usando o helper withAuth do Kinde.
import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import type { NextRequest } from "next/server";

export default function proxy(req: NextRequest) {
  return withAuth(req);
}

export const config = {
  // Protege todas as rotas excepto:
  // - ficheiros estáticos do Next.js (_next/static, _next/image, favicon.ico)
  // - rotas de autenticação do Kinde (/api/auth/*)
  // - a landing page (/)
  matcher: [
    "/app/:path*",
    "/api/ingest",
    "/api/chat",
  ],
};
