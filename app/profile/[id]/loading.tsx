export default function ProfileLoading() {
  return (
    <div className="min-h-dvh game-map-bg px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] animate-pulse">
      <div className="mx-auto max-w-md space-y-4">
        <div className="text-center">
          <div className="mx-auto mb-3 h-20 w-20 rounded-full bg-slate-200/80" />
          <div className="mx-auto h-8 w-40 rounded-lg bg-slate-200/80" />
        </div>
        <div className="rounded-xl game-panel-pastel p-4 space-y-2">
          <div className="h-4 w-12 rounded bg-slate-200/80" />
          <div className="h-4 w-full rounded bg-slate-200/60" />
          <div className="h-4 w-3/4 rounded bg-slate-200/60" />
        </div>
        <div className="mx-auto h-10 w-32 rounded-full bg-slate-200/80" />
      </div>
    </div>
  );
}
