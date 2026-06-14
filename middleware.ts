/**
 * CarbonPulse AI — Next.js Security Middleware
 *
 * Sets HTTP security headers on all responses to harden the application.
 * Implements CSP, X-Frame-Options, and other OWASP-recommended headers.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // ─── Content Security Policy ──────────────────────────────────────────────
  // Strict self-only policy. Allows inline styles for Tailwind and Next.js.
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",  // Next.js requires inline scripts
      "style-src 'self' 'unsafe-inline'",   // Tailwind injects inline styles
      "img-src 'self' data: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  // ─── Clickjacking Protection ──────────────────────────────────────────────
  response.headers.set("X-Frame-Options", "DENY");

  // ─── MIME Type Sniffing Prevention ────────────────────────────────────────
  response.headers.set("X-Content-Type-Options", "nosniff");

  // ─── Referrer Policy ──────────────────────────────────────────────────────
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // ─── Permissions Policy ───────────────────────────────────────────────────
  // Disable access to sensitive browser APIs not used by this application.
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // ─── XSS Protection (legacy browsers) ────────────────────────────────────
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
