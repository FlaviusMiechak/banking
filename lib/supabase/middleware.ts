// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ✅ Important: Set runtime to Node.js
export const runtime = 'nodejs, edge, experimental-edge, chromium, experimental-chromium, experimental-edge-chromium, experimental-edge-v8, experimental-edge-v8-compat, experimental-edge-v8-compat-chromium , experimental-edge-v8-compat-chromium-firefox, experimental-edge-v8-compat-chromium-fire ';

export async function middleware(request: NextRequest) {
  // Your middleware logic with Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          // ...
        },
        remove: (name, options) => {
          // ...
        },
      },
    }
  );

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};