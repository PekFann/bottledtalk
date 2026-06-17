"use client";

import { useCallback, useMemo } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import type { MapEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { NearbyBottle, BottleCluster } from "@/lib/types";
import { CLUSTER_RADIUS_M } from "@/lib/types";
import { createDiscoveryCircleGeoJSON } from "@/lib/geo";
import { clusterBottles } from "@/lib/clusterBottles";
import {
  MAP_STYLE_DEFAULT,
  applyMapTheme,
  type MapThemeConfig,
} from "@/lib/mapTheme";
import BottleMarker from "@/components/bottles/BottleMarker";
import ClusterMarker from "@/components/bottles/ClusterMarker";

type Props = {
  userLocation: { lat: number; lng: number };
  bottles: NearbyBottle[];
  onSelectBottle: (bottle: NearbyBottle) => void;
  onSelectCluster: (cluster: BottleCluster) => void;
  radiusM: number;
  themeConfig: MapThemeConfig;
  themeKey: number;
};

export default function BottleMap({
  userLocation,
  bottles,
  onSelectBottle,
  onSelectCluster,
  radiusM,
  themeConfig,
  themeKey,
}: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const circleGeoJSON = useMemo(
    () => createDiscoveryCircleGeoJSON(userLocation.lng, userLocation.lat, radiusM),
    [userLocation.lng, userLocation.lat, radiusM]
  );

  const markers = useMemo(
    () => clusterBottles(bottles, CLUSTER_RADIUS_M),
    [bottles]
  );

  const mapStyle = process.env.NEXT_PUBLIC_MAPBOX_STYLE ?? MAP_STYLE_DEFAULT;

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
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 });
      }
      applyMapTheme(map, themeConfig);
    },
    [themeConfig]
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
      key={themeKey}
      mapboxAccessToken={token}
      initialViewState={{
        longitude: userLocation.lng,
        latitude: userLocation.lat,
        zoom: 14,
        pitch: 50,
        bearing: -15,
      }}
      maxPitch={85}
      style={{ width: "100%", height: "100%" }}
      mapStyle={mapStyle}
      onLoad={handleMapLoad}
    >
      <Source id="discovery-circle" type="geojson" data={circleGeoJSON}>
        <Layer
          id="discovery-fill"
          type="fill"
          paint={{
            "fill-color": themeConfig.discoveryFill,
            "fill-opacity": themeConfig.discoveryFillOpacity,
          }}
        />
        <Layer
          id="discovery-outline"
          type="line"
          paint={{
            "line-color": themeConfig.discoveryOutline,
            "line-width": 2,
            "line-opacity": themeConfig.discoveryOutlineOpacity,
          }}
        />
      </Source>

      <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
        <div className="relative">
          <div
            className="h-4 w-4 rounded-full border-2 border-white shadow-lg"
            style={{ backgroundColor: themeConfig.userPin }}
          />
          <div
            className="absolute inset-0 h-4 w-4 rounded-full animate-ping opacity-40"
            style={{ backgroundColor: themeConfig.userPinPing }}
          />
        </div>
      </Marker>

      {markers.map((m) =>
        m.kind === "single" ? (
          <BottleMarker
            key={m.bottle.id}
            bottle={m.bottle}
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
