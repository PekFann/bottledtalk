import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import InstallPrompt from "@/components/InstallPrompt";
import BottleImage from "@/components/bottles/BottleImage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let user = null;

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-amber-50">
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <BottleImage size="sm" />
          <span className="font-bold text-sky-900 text-lg">BottledTalk</span>
        </div>
        {user ? (
          <Link
            href="/map"
            className="btn-primary px-4 py-2 text-sm"
          >
            Open map
          </Link>
        ) : (
          <div className="flex gap-2">
            <Link
              href="/login"
              className="rounded-lg border border-sky-200 text-sky-700 px-4 py-2 text-sm font-medium hover:bg-sky-50"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="btn-primary px-4 py-2 text-sm"
            >
              Get started
            </Link>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 text-center">
        <p className="text-6xl mb-6">🌊🍾</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-sky-900 leading-tight">
          Leave a message in a bottle.
          <br />
          <span className="text-sky-600">Discover conversations nearby.</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
          Drop message bottles at your current location on the map. Other sailors within
          2km can find them, open the thread, and continue the conversation — until the
          bottle washes away.
        </p>

        {!user && (
          <Link
            href="/signup"
            className="inline-block mt-8 btn-primary px-8 py-3.5 text-lg shadow-lg"
          >
            Start bottling messages
          </Link>
        )}

        <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <FeatureCard
            icon="🪙"
            title="Bottle caps"
            description="Start with 100 caps. Every bottle costs caps — Glass 10, Treasure 100."
          />
          <FeatureCard
            icon="📍"
            title="Drop at your location"
            description="Cast a bottle exactly where you stand. Your GPS pins it to the map."
          />
          <FeatureCard
            icon="🔭"
            title="Discover within 2km"
            description="Crowded spots cluster on the map. Tap to browse bottles at that location."
          />
          <FeatureCard
            icon="🎒"
            title="Collect in your bag"
            description="Save 10 conversations. Keep bottles manually or when they wash ashore."
          />
        </div>

        <div className="mt-16 rounded-2xl glass p-6 sm:p-8 text-left max-w-2xl mx-auto">
          <h2 className="font-bold text-slate-900 text-lg mb-4">Bottle types &amp; costs</h2>
          <ul className="space-y-3">
            <BottleTypeRow name="Glass" duration="24 hours" caps={10} />
            <BottleTypeRow name="Cork" duration="3 days" caps={25} />
            <BottleTypeRow name="Driftwood" duration="7 days" caps={50} />
            <BottleTypeRow name="Treasure" duration="30 days" caps={100} />
          </ul>
        </div>
      </main>

      <footer className="text-center text-sm text-slate-500 py-8">
        BottledTalk — messages adrift on the map
      </footer>

      <InstallPrompt />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl glass p-6 shadow-sm">
      <span className="text-3xl">{icon}</span>
      <h3 className="font-bold text-slate-900 mt-3">{title}</h3>
      <p className="text-sm text-slate-600 mt-2">{description}</p>
    </div>
  );
}

function BottleTypeRow({
  name,
  duration,
  caps,
}: {
  name: string;
  duration: string;
  caps: number;
}) {
  return (
    <li className="flex items-center gap-3">
      <BottleImage size="sm" className="shrink-0" />
      <div>
        <span className="font-semibold text-slate-800">{name}</span>
        <span className="text-slate-500 text-sm">
          {" "}
          — {duration} · {caps} caps
        </span>
      </div>
    </li>
  );
}
