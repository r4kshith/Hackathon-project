"use client";
import { useActionState } from "react";
import { loginAction } from "../actions";
import { Button, Input } from "../../../components/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  return <form action={action} className="mt-7 space-y-4">
    <label className="block text-sm font-medium">Email address<Input name="email" type="email" autoComplete="email" required className="mt-1.5" /></label>
    <label className="block text-sm font-medium">Password<Input name="password" type="password" autoComplete="current-password" required className="mt-1.5" /></label>
    {state.error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800">{state.error}</p>}
    <Button type="submit" disabled={pending} className="w-full">{pending ? "Signing in…" : "Sign in"}</Button>
  </form>;
}
