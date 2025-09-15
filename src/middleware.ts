import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { routeAccessMap } from "./lib/settings";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

const roleRedirects: Record<string, string> = {
  admin: "/admin",
  student: "/student",
  teacher: "/teacher",
  parent: "/parent",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1️⃣ Always allow public assets & auth APIs
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads/") || // ✅ allow uploads
    pathname === "/favicon.ico" ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|m3u8|ts)$/)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  // 2️⃣ Redirect logged-in users away from login/register pages
  if (pathname === "/") {
    if (token) {
      try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userRole = (payload.role as string | undefined)?.toLowerCase();
        if (userRole && roleRedirects[userRole]) {
          return NextResponse.redirect(
            new URL(roleRedirects[userRole], req.url)
          );
        }
        return NextResponse.redirect(new URL("/dashboard", req.url));
      } catch {
        return NextResponse.next(); // invalid token → allow login
      }
    }
    return NextResponse.next(); // not logged in → allow
  }

  // 3️⃣ Determine allowed roles for this path
  let allowedRoles: string[] | null = null;
  for (const [pattern, roles] of Object.entries(routeAccessMap)) {
    const regex = new RegExp(`^${pattern}$`, "i");
    if (regex.test(pathname)) {
      allowedRoles = roles.map((r) => r.toLowerCase());
      break;
    }
  }

  // 4️⃣ Unknown path → redirect to "/"
  if (allowedRoles === null) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 5️⃣ Public path → allow
  if (allowedRoles.length === 0) {
    return NextResponse.next();
  }

  // 6️⃣ Require token for protected paths
  if (!token) {
    console.log(
      `[Middleware] No token found, redirecting to / for ${pathname}`
    );
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const userRole = (payload.role as string | undefined)?.toLowerCase();

    // 7️⃣ Role-based access
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log(
        `[Middleware] Role '${userRole}' not allowed on ${pathname}, redirecting to /`
      );
      return NextResponse.redirect(new URL("/", req.url));
    }

    // ✅ Authorized
    return NextResponse.next();
  } catch (err) {
    console.log("[Middleware] JWT verification failed:", err);
    return NextResponse.redirect(new URL("/", req.url));
  }
}

// 8️⃣ Config
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|uploads).*)"],
};