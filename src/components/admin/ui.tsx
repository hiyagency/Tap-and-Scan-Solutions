import { clsx } from "clsx";
import { labelize } from "@/lib/admin-data";

export function AdminPageHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <header className="admin-page-head">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{copy}</p>
    </header>
  );
}

export function StatusPill({ value }: { value: string }) {
  return <span className={clsx("status-pill", `status-${value}`)}>{labelize(value)}</span>;
}

export function FlashMessage({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;
  return <p className={clsx("admin-flash", error && "is-error")} role="status">{error ?? message}</p>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="admin-empty">{children}</div>;
}

