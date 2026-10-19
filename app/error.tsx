"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="empty-state">
      <h1>Workspace interrupted</h1>
      <p>Your saved demo state is retained. Retry loading this page.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
