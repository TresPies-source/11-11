import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname, search } = req.nextUrl;

  if (pathname === "/library") {
    const url = new URL(`/librarian/greenhouse${search}`, req.url);
    return NextResponse.redirect(url, 301);
  }

  if (pathname === "/gallery") {
    const url = new URL(`/librarian/commons${search}`, req.url);
    return NextResponse.redirect(url, 301);
  }

  if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
    return;
  }
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
