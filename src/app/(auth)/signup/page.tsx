import Link from "next/link";
import { SignupForm } from "./signup-form";
import { BrandLogo } from "../../../components/brand/brand-logo";
import { AuthBackdrop } from "../../../components/auth/auth-backdrop";

export default function SignupPage() {
  return <AuthBackdrop><BrandLogo /><h1 className="mt-9 text-3xl font-semibold tracking-tight">Create your account</h1><p className="mt-2 text-sm text-muted">Start building your store today.</p><SignupForm /><p className="mt-6 text-center text-sm text-muted">Already have an account? <Link className="font-semibold text-primary" href="/login">Sign in</Link></p></AuthBackdrop>;
}
