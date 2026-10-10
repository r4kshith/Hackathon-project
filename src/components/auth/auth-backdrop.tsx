import type { ReactNode } from "react";

export function AuthBackdrop({ children }: { children: ReactNode }) {
  return <main className="auth-page relative isolate grid min-h-[100svh] place-items-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
    <div aria-hidden="true" className="auth-art absolute inset-0 overflow-hidden">
      <span className="auth-shape auth-shop"><i className="auth-shop-awning" /><i className="auth-shop-front"><b className="auth-shop-window" /><b className="auth-shop-door" /></i></span>
      <span className="auth-shape auth-bag" />
      <span className="auth-shape auth-parcel" />
    </div>
    <section className="auth-card relative z-10 w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-[0_24px_70px_rgba(23,36,31,0.08)] sm:p-9">
      {children}
    </section>
  </main>;
}
