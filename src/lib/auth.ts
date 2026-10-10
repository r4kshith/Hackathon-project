import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { compare, hash } from "bcryptjs";
import { db } from "./db";

const COOKIE = "launch_session";
function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(value);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function getSessionUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return db.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, name: true } });
  } catch { return null; }
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  const passwordHash = await hash(input.password, 12);
  return db.user.create({ data: { name: input.name, email: input.email.toLowerCase(), passwordHash }, select: { id: true } });
}

export async function verifyCredentials(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await compare(password, user.passwordHash))) return null;
  return { id: user.id, name: user.name, email: user.email };
}
