"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function RetryOrders() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" className="shop-button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Loading orders…" : "Try again"}</button>;
}
