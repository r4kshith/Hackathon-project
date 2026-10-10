import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, TableHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" };
export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const style = variant === "primary" ? "bg-primary text-white hover:brightness-95" : variant === "secondary" ? "border border-line bg-white text-foreground hover:bg-background" : "text-muted hover:bg-accent";
  return <button className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${style} ${className}`} {...props} />;
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`min-h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-foreground placeholder:text-muted/70 focus:border-primary focus:outline-none ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`min-h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-foreground focus:border-primary focus:outline-none ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`min-h-28 w-full resize-y rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-foreground focus:border-primary focus:outline-none ${className}`} {...props} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6 ${className}`}>{children}</section>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const tones = { neutral: "bg-background text-muted", success: "bg-emerald-50 text-emerald-800", warning: "bg-amber-50 text-amber-900", danger: "bg-red-50 text-red-800" };
  return <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Table({ className = "", ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <div className="w-full overflow-hidden rounded-2xl border border-line bg-surface"><table className={`w-full border-collapse text-left text-sm ${className}`} {...props} /></div>;
}

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return <div role="presentation" className="fixed inset-0 z-40 grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}><section role="dialog" aria-modal="true" aria-label={title} className="max-h-[94dvh] w-full max-w-2xl overflow-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">{children}</section></div>;
}

export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return <div role="tablist" className="flex gap-1 border-b border-line">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={active === tab.id} type="button" onClick={() => onChange(tab.id)} className={`min-h-11 border-b-2 px-3 text-sm font-medium ${active === tab.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"}`}>{tab.label}</button>)}</div>;
}

export function Toast({ children, tone = "success" }: { children: ReactNode; tone?: "success" | "error" | "info" }) {
  const tones = { success: "bg-emerald-50 text-emerald-900", error: "bg-red-50 text-red-900", info: "bg-accent text-primary" };
  return <div role="status" className={`rounded-xl px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-black/5 ${className}`} />;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center"><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function ErrorState({ title = "Something went wrong", description = "Please try again.", action }: { title?: string; description?: string; action?: ReactNode }) {
  return <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center"><h2 className="font-semibold text-red-900">{title}</h2><p className="mt-1 text-sm text-red-800">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return <ol aria-label="Progress" className="grid grid-flow-col auto-cols-fr gap-2">{steps.map((step, index) => <li key={step} aria-current={index === current ? "step" : undefined}><div className={`h-1.5 rounded-full ${index <= current ? "bg-primary" : "bg-line"}`} /><span className={`mt-2 hidden text-xs sm:block ${index === current ? "font-semibold text-foreground" : "text-muted"}`}>{step}</span></li>)}</ol>;
}
