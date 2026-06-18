"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import type { MapEvent, MapRef, ViewStateChangeEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { NearbyBottle, BottleCluster } from "@/lib/types";
import { CLUSTER_RADIUS_M } from "@/lib/types";
import {
  createDiscoveryCircleGeoJSON,
  createDiscoveryMaskGeoJSON,
} from "@/lib/geo";
import {
  adjustCenterToKeepUserVisible,
  getBoundsAroundPoint,
  MAP_BOUNDS_RADIUS_MULTIPLIER,
  MAP_MIN_ZOOM_PADDING_PX,
  MAP_MIN_ZOOM_RADIUS_MULTIPLIER,
  MAP_USER_VISIBLE_MARGIN_PX,
} from "@/lib/mapConstraints";
import { clusterBottles } from "@/lib/clusterBottles";
import { applyGreyRoadColors } from "@/lib/mapRoadColors";
import BottleMarker from "@/components/bottles/BottleMarker";
import ClusterMarker from "@/components/bottles/ClusterMarker";

const MAP_STYLE = "mapbox://styles/mapbox/outdoors-v12";

const DISCOVERY_OUTLINE = "#64748b";
const DISCOVERY_MASK_FILL = "#6b7280";
const USER_PIN = "#3b82f6";

const INITIAL_PITCH = 45;
const INITIAL_BEARING = -15;
const INITIAL_ZOOM = 14;

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
};

type Props = {
  userLocation: { lat: number; lng: number };
  bottles: NearbyBottle[];
  onSelectBottle: (bottle: NearbyBottle) => void;
  onSelectCluster: (cluster: BottleCluster) => void;
  radiusM: number;
  selectedBottleId?: string | null;
};

function createInitialViewState(userLocation: { lat: number; lng: number }): ViewState {
  return {
    longitude: userLocation.lng,
    latitude: userLocation.lat,
    zoom: INITIAL_ZOOM,
    pitch: INITIAL_PITCH,
    bearing: INITIAL_BEARING,
  };
}

export default function BottleMap({
  userLocation,
  bottles,
  onSelectBottle,
  onSelectCluster,
  radiusM,
  selectedBottleId = null,
}: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState<ViewState>(() =>
    createInitialViewState(userLocation)
  );

  const maxBounds = useMemo(
    () =>
      getBoundsAroundPoint(
        userLocation.lng,
        userLocation.lat,
        radiusM * MAP_BOUNDS_RADIUS_MULTIPLIER
      ),
    [userLocation.lng, userLocation.lat, radiusM]
  );

  const circleGeoJSON = useMemo(
    () => createDiscoveryCircleGeoJSON(userLocation.lng, userLocation.lat, radiusM),
    [userLocation.lng, userLocation.lat, radiusM]
  );

  const maskGeoJSON = useMemo(
    () => createDiscoveryMaskGeoJSON(userLocation.lng, userLocation.lat, radiusM),
    [userLocation.lng, userLocation.lat, radiusM]
  );

  const markers = useMemo(
    () => clusterBottles(bottles, CLUSTER_RADIUS_M),
    [bottles]
  );

  useEffect(() => {
    setViewState(createInitialViewState(userLocation));

    const map = mapRef.current?.getMap();
    if (!map) return;

    const bounds = getBoundsAroundPoint(
      userLocation.lng,
      userLocation.lat,
      radiusM * MAP_MIN_ZOOM_RADIUS_MULTIPLIER
    );
    const camera = map.cameraForBounds(bounds, { padding: MAP_MIN_ZOOM_PADDING_PX });
    if (camera?.zoom != null) {
      map.setMinZoom(camera.zoom);
    }
  }, [userLocation, radiusM]);

  const applyMinZoom = useCallback(
    (map: MapEvent["target"]) => {
      const bounds = getBoundsAroundPoint(
        userLocation.lng,
        userLocation.lat,
        radiusM * MAP_MIN_ZOOM_RADIUS_MULTIPLIER
      );
      const camera = map.cameraForBounds(bounds, { padding: MAP_MIN_ZOOM_PADDING_PX });
      if (camera?.zoom != null) {
        map.setMinZoom(camera.zoom);
      }
    },
    [userLocation.lng, userLocation.lat, radiusM]
  );

  const handleMapLoad = useCallback(
    (e: MapEvent) => {
      const map = e.target;
      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.0 });
      }
      applyGreyRoadColors(map);
      map.once("style.load", () => applyGreyRoadColors(map));
      applyMinZoom(map);
    },
    [applyMinZoom]
  );

  const handleMove = useCallback(
    (evt: ViewStateChangeEvent) => {
      const { zoom, pitch, bearing } = evt.viewState;
      let { longitude, latitude } = evt.viewState;
      const map = mapRef.current?.getMap();

      if (map) {
        const adjusted = adjustCenterToKeepUserVisible(
          map,
          userLocation.lng,
          userLocation.lat,
          MAP_USER_VISIBLE_MARGIN_PX
        );
        if (adjusted) {
          longitude = adjusted.lng;
          latitude = adjusted.lat;
        }
      }

      setViewState({ longitude, latitude, zoom, pitch, bearing });
    },
    [userLocation.lng, userLocation.lat]
  );

  if (!token) {
    return (
      <div className="flex h-full items-center justify-center px-6 pt-16 text-center text-slate-600">
        Mapbox token missing. Add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file.
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={token}
      {...viewState}
      maxBounds={maxBounds}
      maxZoom={18}
      maxPitch={85}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      onLoad={handleMapLoad}
      onMove={handleMove}
    >
      <Source id="discovery-mask" type="geojson" data={maskGeoJSON}>
        <Layer
          id="discovery-mask-fill"
          type="fill"
          paint={{
            "fill-color": DISCOVERY_MASK_FILL,
            "fill-opacity": 0.35,
          }}
        />
      </Source>

      <Source id="discovery-circle" type="geojson" data={circleGeoJSON}>
        <Layer
          id="discovery-outline"
          type="line"
          paint={{
            "line-color": DISCOVERY_OUTLINE,
            "line-width": 2,
            "line-opacity": 0.8,
            "line-dasharray": [2, 2],
          }}
        />
      </Source>

      <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
        <div className="relative">
          <div
            className="h-4 w-4 rounded-full border-2 border-white shadow-lg"
            style={{ backgroundColor: USER_PIN }}
          />
          <div
            className="absolute inset-0 h-4 w-4 rounded-full bg-blue-400 animate-ping opacity-40"
          />
        </div>
      </Marker>

      {markers.map((m) =>
        m.kind === "single" ? (
          <BottleMarker
            key={m.bottle.id}
            bottle={m.bottle}
            isSelected={m.bottle.id === selectedBottleId}
            onClick={() => onSelectBottle(m.bottle)}
          />
        ) : (
          <ClusterMarker
            key={m.cluster.id}
            cluster={m.cluster}
            onClick={() => onSelectCluster(m.cluster)}
          />
        )
      )}
    </Map>
  );
}
