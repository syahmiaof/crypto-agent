import Link from "next/link";
export default function NotFound() {
  return (
    <section className="empty-state">
      <h1>Page not found</h1>
      <Link className="button" href="/dashboard">
        Return to Mission Control
      </Link>
    </section>
  );
}
