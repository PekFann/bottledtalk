"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  BottleType,
  NearbyBottle,
  BagItem,
  MapStackItem,
  SignalTower,
  Footprint,
  MapAnchor,
} from "@/lib/types";
import { FOOTPRINT_RADIUS_M, DEFAULT_BAG_SLOTS } from "@/lib/types";
import { fetchDiscoveryRadius, shouldReloadMapAtLocation } from "@/lib/discovery";
import BottleMap from "@/components/map/BottleMap";
import { getShopBottleTypes } from "@/lib/bottleCatalog";
import ShopModal from "@/components/shop/ShopModal";
import BottlePreviewSheet from "@/components/bottles/BottlePreviewSheet";
import StackPickerModal from "@/components/bottles/StackPickerModal";
import InstallPrompt from "@/components/InstallPrompt";
import GameHud from "@/components/hud/GameHud";
import MapActionBar from "@/components/hud/MapActionBar";
import BagModal from "@/components/bag/BagModal";
import WashedAshorePrompt from "@/components/bag/WashedAshorePrompt";
import CastSplash from "@/components/bottles/CastSplash";
import FootprintModal from "@/components/footprint/FootprintModal";
import FriendsModal from "@/components/friends/FriendsModal";
import SignalTowerExtendModal from "@/components/shop/SignalTowerExtendModal";

export default function MapPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [bottles, setBottles] = useState<NearbyBottle[]>([]);
  const [towers, setTowers] = useState<SignalTower[]>([]);
  const [bottleTypes, setBottleTypes] = useState<BottleType[]>([]);
  const [selectedBottle, setSelectedBottle] = useState<NearbyBottle | null>(null);
  const [stackItems, setStackItems] = useState<MapStackItem[] | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [showBag, setShowBag] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showFootprints, setShowFootprints] = useState(false);
  const [selectedTower, setSelectedTower] = useState<SignalTower | null>(null);
  const [mapAnchor, setMapAnchor] = useState<MapAnchor | null>(null);
  const [discoveryRadius, setDiscoveryRadius] = useState(2000);
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
  const [userId, setUserId] = useState<string | null>(null);

  const getSupabase = useCallback(() => createClient(), []);
  const lastGpsReloadRef = useRef<{ lat: number; lng: number; at: number } | null>(null);

  const footprintMode = mapAnchor?.type === "footprint";

  const anchorLocation = useMemo(() => {
    if (mapAnchor?.type === "footprint") {
      return { lat: mapAnchor.lat, lng: mapAnchor.lng };
    }
    if (userLocation) return userLocation;
    if (mapAnchor) return { lat: mapAnchor.lat, lng: mapAnchor.lng };
    return null;
  }, [mapAnchor, userLocation]);

  const effectiveRadius = footprintMode ? FOOTPRINT_RADIUS_M : discoveryRadius;

  const reloadMapAtAnchor = useCallback(
    async (
      lat: number,
      lng: number,
      isFootprint: boolean,
      options?: { showLoading?: boolean }
    ) => {
      if (options?.showLoading) setLoading(true);
      const supabase = getSupabase();

      const radius = isFootprint
        ? FOOTPRINT_RADIUS_M
        : await fetchDiscoveryRadius(supabase, lat, lng);

      if (!isFootprint) setDiscoveryRadius(radius);

      const [bottlesRes, towersRes] = await Promise.all([
        supabase.rpc("nearby_bottles", {
          lat,
          lng,
          radius_m: radius,
        }),
        supabase.rpc("nearby_signal_towers", {
          lat,
          lng,
          radius_m: isFootprint ? FOOTPRINT_RADIUS_M : null,
        }),
      ]);

      if (!bottlesRes.error && bottlesRes.data) setBottles(bottlesRes.data);
      if (!towersRes.error && towersRes.data) setTowers(towersRes.data);
      if (options?.showLoading) setLoading(false);
    },
    [getSupabase]
  );

  const loadPlayer = useCallback(async () => {
    const supabase = getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);
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
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported on this device.");
      setLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setMapAnchor((prev) => prev ?? { type: "gps", lat: loc.lat, lng: loc.lng });
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
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
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
    if (!anchorLocation) return;

    const { lat, lng } = anchorLocation;

    if (!footprintMode) {
      if (!shouldReloadMapAtLocation(lat, lng, lastGpsReloadRef.current)) {
        return;
      }
      lastGpsReloadRef.current = { lat, lng, at: Date.now() };
    }

    void reloadMapAtAnchor(lat, lng, footprintMode, { showLoading: true });

    const interval = setInterval(() => {
      void reloadMapAtAnchor(lat, lng, footprintMode);
    }, 30000);

    return () => clearInterval(interval);
  }, [anchorLocation, footprintMode, reloadMapAtAnchor]);

  const refreshMapData = useCallback(async () => {
    if (!anchorLocation) return;
    await reloadMapAtAnchor(anchorLocation.lat, anchorLocation.lng, footprintMode);
  }, [anchorLocation, footprintMode, reloadMapAtAnchor]);

  const handlePurchase = async (capCost: number) => {
    setBottleCaps((c) => c - capCost);
    setCapPulse(true);
    setTimeout(() => setCapPulse(false), 500);
    await loadPlayer();
    await refreshMapData();
    if (anchorLocation) {
      lastGpsReloadRef.current = {
        lat: anchorLocation.lat,
        lng: anchorLocation.lng,
        at: Date.now(),
      };
    }
  };

  const handleBottleSuccess = async (capCost: number) => {
    setShowShop(false);
    setCastSplash({ show: true, cost: capCost });
    await handlePurchase(capCost);
  };

  const handleFootprintSelect = (fp: Footprint) => {
    lastGpsReloadRef.current = null;
    setMapAnchor({
      type: "footprint",
      lat: fp.lat,
      lng: fp.lng,
      footprintId: fp.id,
      name: fp.name,
    });
    setShowFootprints(false);
  };

  const exitFootprintMode = () => {
    lastGpsReloadRef.current = null;
    if (userLocation) {
      setMapAnchor({ type: "gps", lat: userLocation.lat, lng: userLocation.lng });
    }
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden game-map-bg">
      <GameHud
        bottleCaps={bottleCaps}
        capPulse={capPulse}
        displayName={displayName}
        email={userEmail}
        userId={userId}
      />

      <WashedAshorePrompt onCollected={loadPlayer} />

      {footprintMode && (
        <div className="absolute top-16 left-3 right-3 z-20 flex items-center justify-between gap-2 rounded-xl game-panel-pastel px-4 py-2.5 shadow">
          <p className="text-sm text-slate-700 truncate">
            Viewing via <strong>{mapAnchor?.type === "footprint" ? mapAnchor.name : "footprint"}</strong> — can&apos;t cast bottles here
          </p>
          <button type="button" onClick={exitFootprintMode} className="shrink-0 text-sm font-medium text-sky-600">
            Exit
          </button>
        </div>
      )}

      {geoError ? (
        <div className="flex h-full items-center justify-center px-6 pt-16">
          <div className="text-center max-w-sm">
            <p className="text-4xl mb-4">📍</p>
            <p className="text-slate-700 font-medium">{geoError}</p>
            <button onClick={() => window.location.reload()} className="mt-4 btn-primary px-4 py-2 text-sm">
              Retry
            </button>
          </div>
        </div>
      ) : userLocation && anchorLocation ? (
        <>
          <BottleMap
            userLocation={userLocation}
            anchorLocation={anchorLocation}
            bottles={bottles}
            towers={towers}
            currentUserId={userId ?? undefined}
            footprintMode={footprintMode}
            onSelectBottle={setSelectedBottle}
            onSelectStack={(items) => setStackItems(items)}
            onSelectTower={(tower) => {
              if (tower.owner_id === userId) setSelectedTower(tower);
            }}
            radiusM={effectiveRadius}
            selectedBottleId={selectedBottle?.id ?? null}
          />

          {loading && bottles.length === 0 && (
            <div className="absolute bottom-56 left-1/2 -translate-x-1/2 z-10 rounded-full game-panel-pastel px-4 py-2 text-sm text-slate-700 shadow">
              Scanning for bottles…
            </div>
          )}

          {!loading && bottles.length === 0 && (
            <div className="absolute bottom-56 left-4 right-24 z-10 rounded-xl game-panel-pastel px-4 py-3 text-sm text-slate-700 shadow text-center">
              No bottles nearby — the shore is quiet. Cast the first bottle!
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
          onOpenFriends={() => setShowFriends(true)}
          onOpenShop={() => setShowShop(true)}
          onOpenBag={() => setShowBag(true)}
          onOpenFootprints={() => setShowFootprints(true)}
        />
      )}

      {selectedBottle && (
        <BottlePreviewSheet
          bottle={selectedBottle}
          onClose={() => setSelectedBottle(null)}
          footprintId={footprintMode && mapAnchor?.type === "footprint" ? mapAnchor.footprintId : undefined}
        />
      )}

      {stackItems && (
        <StackPickerModal
          items={stackItems}
          currentUserId={userId ?? undefined}
          onSelectBottle={(b) => {
            setStackItems(null);
            setSelectedBottle(b);
          }}
          onSelectTower={(tower) => {
            setStackItems(null);
            setSelectedTower(tower);
          }}
          onClose={() => setStackItems(null)}
        />
      )}

      {showShop && userLocation && (
        <ShopModal
          bottleTypes={getShopBottleTypes(bottleTypes)}
          location={userLocation}
          bottleCaps={bottleCaps}
          footprintMode={footprintMode}
          onClose={() => setShowShop(false)}
          onBottleSuccess={handleBottleSuccess}
          onTowerSuccess={async (cost) => {
            setShowShop(false);
            await handlePurchase(cost);
          }}
          onFootprintSuccess={async (cost) => {
            setShowShop(false);
            await handlePurchase(cost);
          }}
        />
      )}

      {showBag && (
        <BagModal items={bagItems} bagLimit={bagLimit} onClose={() => setShowBag(false)} onTrashed={loadPlayer} />
      )}

      {showFriends && userId && (
        <FriendsModal currentUserId={userId} onClose={() => setShowFriends(false)} />
      )}

      {showFootprints && (
        <FootprintModal
          onClose={() => setShowFootprints(false)}
          onSelect={handleFootprintSelect}
          onOpenShop={() => {
            setShowFootprints(false);
            setShowShop(true);
          }}
        />
      )}

      {selectedTower && (
        <SignalTowerExtendModal
          tower={selectedTower}
          bottleCaps={bottleCaps}
          onClose={() => setSelectedTower(null)}
          onExtended={async (cost) => {
            await handlePurchase(cost);
            setSelectedTower(null);
          }}
        />
      )}

      <CastSplash show={castSplash.show} capCost={castSplash.cost} onDone={() => setCastSplash({ show: false, cost: 0 })} />

      <InstallPrompt aboveFab />
    </div>
  );
}
