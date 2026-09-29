import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const sessionCookieName = "konveksi_session";
const sessionDurationSeconds = 60 * 60 * 12;
const sessionIssuer = "web-konveksi";

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET harus berisi setidaknya 32 karakter.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string, sessionVersion: number) {
  const token = await new SignJWT({ sv: sessionVersion })
    .setSubject(userId)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(sessionIssuer)
    .setIssuedAt()
    .setExpirationTime(`${sessionDurationSeconds}s`)
    .sign(getSessionSecret());

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionDurationSeconds,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      issuer: sessionIssuer,
      algorithms: ["HS256"],
    });
    if (
      typeof payload.sub !== "string" ||
      (typeof payload.sv !== "number" && payload.sv !== undefined)
    ) {
      return null;
    }

    const user = await prisma.user.findFirst({
      where: { id: payload.sub, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        sessionVersion: true,
      },
    });
    if (!user || (payload.sv ?? 0) !== user.sessionVersion) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      ["JWTExpired", "JWTClaimValidationFailed", "JWTInvalid"].includes(error.name)
    ) {
      return null;
    }
    throw error;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
