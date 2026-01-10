import { auth } from "@/lib/auth";

export default auth((req) => {
  if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
    return;
  }
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
