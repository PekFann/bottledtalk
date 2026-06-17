"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BottleType, NearbyBottle, BagItem, BottleCluster } from "@/lib/types";
import { DISCOVERY_RADIUS_M, DEFAULT_BAG_SLOTS } from "@/lib/types";
import BottleMap from "@/components/map/BottleMap";
import DropBottleModal from "@/components/bottles/DropBottleModal";
import BottlePreviewSheet from "@/components/bottles/BottlePreviewSheet";
import ClusterListModal from "@/components/bottles/ClusterListModal";
import InstallPrompt from "@/components/InstallPrompt";
import GameHud from "@/components/hud/GameHud";
import MapActionBar from "@/components/hud/MapActionBar";
import BagModal from "@/components/bag/BagModal";
import WashedAshorePrompt from "@/components/bag/WashedAshorePrompt";
import CastSplash from "@/components/bottles/CastSplash";

export default function MapPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [bottles, setBottles] = useState<NearbyBottle[]>([]);
  const [bottleTypes, setBottleTypes] = useState<BottleType[]>([]);
  const [selectedBottle, setSelectedBottle] = useState<NearbyBottle | null>(null);
  const [clusterBottles, setClusterBottles] = useState<NearbyBottle[] | null>(null);
  const [showDropModal, setShowDropModal] = useState(false);
  const [showBag, setShowBag] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bottleCaps, setBottleCaps] = useState(0);
  const [bagLimit, setBagLimit] = useState(DEFAULT_BAG_SLOTS);
  const [bagItems, setBagItems] = useState<BagItem[]>([]);
  const [capPulse, setCapPulse] = useState(false);
  const [castSplash, setCastSplash] = useState<{ show: boolean; cost: number }>({
    show: false,
    cost: 0,
  });
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const getSupabase = useCallback(() => createClient(), []);

  const loadPlayer = useCallback(async () => {
    const supabase = getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserEmail(user.email ?? null);

    const { data: profile } = await supabase
      .from("profiles")
      .select("bottle_caps, bag_slot_limit, display_name")
      .eq("id", user.id)
      .single();

    if (profile) {
      setBottleCaps(profile.bottle_caps ?? 0);
      setBagLimit(profile.bag_slot_limit ?? DEFAULT_BAG_SLOTS);
      setDisplayName(profile.display_name ?? null);
    }

    const { data: items } = await supabase
      .from("bag_items")
      .select("*")
      .eq("user_id", user.id)
      .order("collected_at", { ascending: false });

    if (items) setBagItems(items as BagItem[]);
  }, [getSupabase]);

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
    loadPlayer();
  }, [getSupabase, loadPlayer]);

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

  const refreshBottles = async () => {
    if (!userLocation) return;
    const supabase = getSupabase();
    const { data } = await supabase.rpc("nearby_bottles", {
      lat: userLocation.lat,
      lng: userLocation.lng,
      radius_m: DISCOVERY_RADIUS_M,
    });
    if (data) setBottles(data);
  };

  const handleBottleDropped = async (capCost: number) => {
    setShowDropModal(false);
    setCastSplash({ show: true, cost: capCost });
    setBottleCaps((c) => c - capCost);
    setCapPulse(true);
    setTimeout(() => setCapPulse(false), 500);
    await refreshBottles();
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden game-map-bg">
      <GameHud
        bottleCaps={bottleCaps}
        capPulse={capPulse}
        displayName={displayName}
        email={userEmail}
      />

      <WashedAshorePrompt onCollected={loadPlayer} />

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
            onSelectCluster={(c: BottleCluster) => setClusterBottles(c.bottles)}
            radiusM={DISCOVERY_RADIUS_M}
          />

          {loading && bottles.length === 0 && (
            <div className="absolute bottom-44 left-1/2 -translate-x-1/2 z-10 rounded-full game-panel-pastel px-4 py-2 text-sm text-slate-700 shadow">
              Scanning for bottles…
            </div>
          )}

          {!loading && bottles.length === 0 && (
            <div className="absolute bottom-44 left-4 right-20 z-10 rounded-xl game-panel-pastel px-4 py-3 text-sm text-slate-700 shadow text-center">
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
        <MapActionBar
          bagUsed={bagItems.length}
          bagLimit={bagLimit}
          onCast={() => setShowDropModal(true)}
          onOpenBag={() => setShowBag(true)}
        />
      )}

      {selectedBottle && (
        <BottlePreviewSheet
          bottle={selectedBottle}
          onClose={() => setSelectedBottle(null)}
        />
      )}

      {clusterBottles && (
        <ClusterListModal
          bottles={clusterBottles}
          onSelect={(b) => {
            setClusterBottles(null);
            setSelectedBottle(b);
          }}
          onClose={() => setClusterBottles(null)}
        />
      )}

      {showDropModal && userLocation && (
        <DropBottleModal
          bottleTypes={bottleTypes}
          location={userLocation}
          bottleCaps={bottleCaps}
          onClose={() => setShowDropModal(false)}
          onSuccess={handleBottleDropped}
        />
      )}

      {showBag && (
        <BagModal
          items={bagItems}
          bagLimit={bagLimit}
          onClose={() => setShowBag(false)}
          onTrashed={loadPlayer}
        />
      )}

      <CastSplash
        show={castSplash.show}
        capCost={castSplash.cost}
        onDone={() => setCastSplash({ show: false, cost: 0 })}
      />

      <InstallPrompt aboveFab />
    </div>
  );
}
