"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createSession, registerUser, verifyCredentials } from "../../lib/auth";

const signupSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.email(), password: z.string().min(10).max(128) });
const loginSchema = z.object({ email: z.email(), password: z.string().min(1).max(128) });

export type AuthState = { error?: string };

function logAuthFailure(event: "signup_failed" | "login_failed", error: unknown) {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  const errorCode = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : undefined;
  console.error(JSON.stringify({
    level: "error",
    event,
    errorName,
    errorCode,
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    authSecretConfigured: Boolean(process.env.AUTH_SECRET),
  }));
}

export async function signupAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  try {
    const user = await registerUser(parsed.data);
    await createSession(user.id);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return { error: "An account with that email already exists." };
    logAuthFailure("signup_failed", error);
    return { error: "We couldn't create your account. Please try again." };
  }
  redirect("/onboarding");
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };
  try {
    const user = await verifyCredentials(parsed.data.email, parsed.data.password);
    if (!user) return { error: "Email or password is incorrect." };
    await createSession(user.id);
  } catch (error) {
    logAuthFailure("login_failed", error);
    return { error: "Sign-in is temporarily unavailable. Please try again shortly." };
  }
  redirect("/admin");
}
