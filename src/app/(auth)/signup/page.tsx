import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return <main className="grid min-h-screen place-items-center px-5 py-12"><section className="w-full max-w-md rounded-3xl border border-line bg-white p-7 shadow-sm sm:p-9"><Link href="/" className="text-lg font-bold">Dukaan</Link><h1 className="mt-9 text-3xl font-semibold tracking-tight">Create your account</h1><p className="mt-2 text-sm text-muted">Start building your store today.</p><SignupForm /><p className="mt-6 text-center text-sm text-muted">Already have an account? <Link className="font-semibold text-primary" href="/login">Sign in</Link></p></section></main>;
}
