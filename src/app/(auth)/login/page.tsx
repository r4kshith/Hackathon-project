import Link from "next/link";
import { LoginForm } from "./login-form";
import { BrandLogo } from "../../../components/brand/brand-logo";
import { AuthBackdrop } from "../../../components/auth/auth-backdrop";

export default function LoginPage() {
  return <AuthBackdrop><BrandLogo /><h1 className="mt-9 text-3xl font-semibold tracking-tight">Welcome back</h1><p className="mt-2 text-sm text-muted">Sign in to manage your store.</p><LoginForm /><p className="mt-6 text-center text-sm text-muted">New here? <Link className="font-semibold text-primary" href="/signup">Create an account</Link></p></AuthBackdrop>;
}
