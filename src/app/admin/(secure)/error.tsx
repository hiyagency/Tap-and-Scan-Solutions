"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="admin-main">
      <section className="admin-panel admin-route-error" role="alert">
        <p className="eyebrow">Could not load this panel</p>
        <h1>The connection paused.</h1>
        <p>Your data has not been changed. Check the connection and retry this page.</p>
        <button className="button button-dark" type="button" onClick={reset}>Retry now</button>
      </section>
    </main>
  );
}
