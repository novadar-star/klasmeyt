/**
 * Shown instantly when a sidebar link is clicked, while the page's data loads.
 * Also lets Next.js prefetch every route up to this boundary, so navigation feels immediate.
 * Mirrors the real layout (title band + cards) so nothing jumps when content arrives.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="-mx-4 -mt-6 mb-6 border-b border-line bg-white px-4 pb-5 pt-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8">
        <div className="h-7 w-56 rounded-control bg-slate-100 motion-safe:animate-pulse" />
        <div className="mt-3 h-4 w-80 max-w-full rounded-control bg-slate-100 motion-safe:animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-panel border border-line bg-white p-5">
            <div className="h-3 w-24 rounded bg-slate-100 motion-safe:animate-pulse" />
            <div className="mt-3 h-6 w-20 rounded bg-slate-100 motion-safe:animate-pulse" />
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-28 rounded-panel border border-line bg-white p-5">
            <div className="h-4 w-48 rounded bg-slate-100 motion-safe:animate-pulse" />
            <div className="mt-3 h-3 w-72 max-w-full rounded bg-slate-100 motion-safe:animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
