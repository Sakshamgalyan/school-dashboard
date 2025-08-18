// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
// import { clerkClient } from '@clerk/clerk-sdk-node'; 
// import { routeAccessMap } from './lib/settings';
// import { NextResponse } from 'next/server';

// const matchers = Object.keys(routeAccessMap).map((route) => ({
//   matcher: createRouteMatcher([`${route}`]),
//   allowedRoles: routeAccessMap[route],
// }));
// console.log(matchers)

// export default clerkMiddleware(async (auth, req) => {
//   const { userId } = await auth();

//   let role: string | undefined;
//   if (userId) {
//     const user = await clerkClient.users.getUser(userId);
//     role = (user.publicMetadata as { role?: string })?.role;
//   }

//   const pathname = req.nextUrl.pathname;

//   for (const { matcher, allowedRoles } of matchers) {
//     if (matcher(req)) {
//       // If role is missing or not allowed, redirect to role-specific home
//       if (!role || !allowedRoles.includes(role)) {
//         // Avoid infinite loop if already on the redirect page
//         if (pathname !== `/${role || 'unauthorized'}`) {
//           return NextResponse.redirect(new URL(`/${role || 'unauthorized'}`, req.url));
//         }
//       }
//     }
//   }
// });

// export const config = {
//   matcher: [
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     '/(api|trpc)(.*)',
//   ],
// };


import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

export default clerkMiddleware(async (auth, req) => {
  // if (isProtectedRoute(req)) auth().protect()

  const { sessionClaims } = await auth();

  const role = (sessionClaims?.metadata as { role?: string })?.role;

  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req) && !allowedRoles.includes(role!)) {
      return NextResponse.redirect(new URL(`/${role}`, req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};