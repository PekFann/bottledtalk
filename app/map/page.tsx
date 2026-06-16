"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BottleType, NearbyBottle } from "@/lib/types";
import { DISCOVERY_RADIUS_M } from "@/lib/types";
import BottleMap from "@/components/map/BottleMap";
import DropBottleModal from "@/components/bottles/DropBottleModal";
import BottlePreviewSheet from "@/components/bottles/BottlePreviewSheet";
import InstallPrompt from "@/components/InstallPrompt";

export default function MapPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [bottles, setBottles] = useState<NearbyBottle[]>([]);
  const [bottleTypes, setBottleTypes] = useState<BottleType[]>([]);
  const [selectedBottle, setSelectedBottle] = useState<NearbyBottle | null>(null);
  const [showDropModal, setShowDropModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const getSupabase = useCallback(() => createClient(), []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoError(null);
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? "Location permission denied. Enable location to discover nearby bottles."
            : "Could not get your location. Please try again."
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  useEffect(() => {
    async function loadTypes() {
      const supabase = getSupabase();
      const { data } = await supabase.from("bottle_types").select("*").order("duration_hours");
      if (data) setBottleTypes(data);
    }
    loadTypes();
  }, [getSupabase]);

  useEffect(() => {
    if (!userLocation) return;

    async function loadBottles() {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc("nearby_bottles", {
        lat: userLocation!.lat,
        lng: userLocation!.lng,
        radius_m: DISCOVERY_RADIUS_M,
      });

      if (!error && data) setBottles(data);
      setLoading(false);
    }

    loadBottles();

    const interval = setInterval(loadBottles, 30000);
    return () => clearInterval(interval);
  }, [userLocation, getSupabase]);

  const handleBottleDropped = async () => {
    if (!userLocation) return;
    const supabase = getSupabase();
    const { data } = await supabase.rpc("nearby_bottles", {
      lat: userLocation.lat,
      lng: userLocation.lng,
      radius_m: DISCOVERY_RADIUS_M,
    });
    if (data) setBottles(data);
    setShowDropModal(false);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍾</span>
          <h1 className="font-bold text-sky-900">BottledTalk</h1>
        </div>
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            Sign out
          </button>
        </form>
      </header>

      {geoError ? (
        <div className="flex h-full items-center justify-center px-6 pt-16">
          <div className="text-center max-w-sm">
            <p className="text-4xl mb-4">📍</p>
            <p className="text-slate-700 font-medium">{geoError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-sky-600 text-white px-4 py-2 text-sm font-medium hover:bg-sky-700"
            >
              Retry
            </button>
          </div>
        </div>
      ) : userLocation ? (
        <>
          <BottleMap
            userLocation={userLocation}
            bottles={bottles}
            onSelectBottle={setSelectedBottle}
            radiusM={DISCOVERY_RADIUS_M}
          />

          {loading && bottles.length === 0 && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white/90 px-4 py-2 text-sm text-slate-600 shadow">
              Scanning for bottles…
            </div>
          )}

          {!loading && bottles.length === 0 && (
            <div className="absolute bottom-24 left-4 right-4 z-10 rounded-xl bg-white/95 px-4 py-3 text-sm text-slate-600 shadow text-center">
              No bottles nearby — be the first to drop one!
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full items-center justify-center pt-16">
          <p className="text-slate-600">Finding your location…</p>
        </div>
      )}

      {userLocation && (
        <button
          onClick={() => setShowDropModal(true)}
          className="absolute bottom-6 right-4 z-20 flex items-center gap-2 rounded-full bg-sky-600 text-white px-5 py-3 font-semibold shadow-lg hover:bg-sky-700 transition-colors"
        >
          <span>🍾</span>
          Drop a bottle
        </button>
      )}

      {selectedBottle && (
        <BottlePreviewSheet
          bottle={selectedBottle}
          onClose={() => setSelectedBottle(null)}
        />
      )}

      {showDropModal && userLocation && (
        <DropBottleModal
          bottleTypes={bottleTypes}
          location={userLocation}
          onClose={() => setShowDropModal(false)}
          onSuccess={handleBottleDropped}
        />
      )}

      <InstallPrompt aboveFab />
    </div>
  );
}
