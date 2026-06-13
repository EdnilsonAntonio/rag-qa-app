// app/api/auth/[kindeAuth]/route.ts
// Route handler catch-all que delega para o SDK Kinde.
// Trata: /api/auth/login, /api/auth/register, /api/auth/logout, /api/auth/kinde_callback
import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

export const GET = handleAuth();
