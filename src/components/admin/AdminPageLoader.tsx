export default function AdminPageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
      <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
      <p className="text-sm font-medium text-slate-500">Loading…</p>
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 flex gap-4">
        <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded w-20 animate-pulse" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-4 flex gap-4 items-center">
            <div className="h-4 bg-slate-100 rounded w-40 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-28 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-16 animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
