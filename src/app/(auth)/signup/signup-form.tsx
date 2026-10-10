"use client";
import { useActionState } from "react";
import { signupAction } from "../actions";
import { Button, Input } from "../../../components/ui";

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, {});
  return <form action={action} className="mt-7 space-y-4">
    <label className="block text-sm font-medium">Your name<Input name="name" autoComplete="name" required minLength={2} className="mt-1.5" /></label>
    <label className="block text-sm font-medium">Email address<Input name="email" type="email" autoComplete="email" required className="mt-1.5" /></label>
    <label className="block text-sm font-medium">Password<Input name="password" type="password" autoComplete="new-password" minLength={10} required className="mt-1.5" /><span className="mt-1 block text-xs text-muted">Use at least 10 characters.</span></label>
    {state.error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800">{state.error}</p>}
    <Button type="submit" disabled={pending} className="w-full">{pending ? "Creating account…" : "Create account"}</Button>
  </form>;
}
