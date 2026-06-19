export default function BottleLoading() {
  return (
    <div className="flex flex-col h-dvh game-map-bg animate-pulse">
      <header className="shrink-0 border-b border-slate-200/80 bg-white/90 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 shrink-0 rounded-lg bg-slate-200" />
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <div className="h-5 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="h-3 w-1/3 rounded bg-slate-100" />
          </div>
          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
        </div>
      </header>

      <div className="flex-1 conversation-panel px-4 py-4 space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-5/6 rounded bg-slate-100" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-4/5 rounded bg-slate-200" />
          <div className="h-4 w-2/3 rounded bg-slate-100" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-slate-100" />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white/80 px-4 py-3">
        <div className="h-20 w-full rounded-lg bg-slate-100" />
        <div className="mt-2 flex justify-end">
          <div className="h-9 w-20 rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
