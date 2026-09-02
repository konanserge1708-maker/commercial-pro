import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { SessionPayload } from "./types";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "commercial-secret-key-change-in-production"
);

const COOKIE_NAME = "commercial_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function toPublicUser(user: {
  id: string;
  phone: string;
  name: string;
  promoCode?: string | null;
  role: "admin" | "agent";
  balance: number;
  monthlyTarget: number;
  monthlyAchieved: number;
  createdAt: string;
}) {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    promoCode: user.promoCode ?? null,
    role: user.role,
    balance: user.balance,
    monthlyTarget: user.monthlyTarget,
    monthlyAchieved: user.monthlyAchieved,
    createdAt: user.createdAt,
  };
}
