import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return <main className="grid min-h-screen place-items-center px-5 py-12"><section className="w-full max-w-md rounded-3xl border border-line bg-white p-7 shadow-sm sm:p-9"><Link href="/" className="text-lg font-bold">Dukaan</Link><h1 className="mt-9 text-3xl font-semibold tracking-tight">Welcome back</h1><p className="mt-2 text-sm text-muted">Sign in to manage your store.</p><LoginForm /><p className="mt-6 text-center text-sm text-muted">New here? <Link className="font-semibold text-primary" href="/signup">Create an account</Link></p></section></main>;
}
