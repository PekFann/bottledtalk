"use client";

import { useMemo } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { NearbyBottle, BottleCluster } from "@/lib/types";
import { CLUSTER_RADIUS_M } from "@/lib/types";
import { createDiscoveryCircleGeoJSON } from "@/lib/geo";
import { clusterBottles } from "@/lib/clusterBottles";
import BottleMarker from "@/components/bottles/BottleMarker";
import ClusterMarker from "@/components/bottles/ClusterMarker";

type Props = {
  userLocation: { lat: number; lng: number };
  bottles: NearbyBottle[];
  onSelectBottle: (bottle: NearbyBottle) => void;
  onSelectCluster: (cluster: BottleCluster) => void;
  radiusM: number;
};

export default function BottleMap({
  userLocation,
  bottles,
  onSelectBottle,
  onSelectCluster,
  radiusM,
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

  const mapStyle =
    process.env.NEXT_PUBLIC_MAPBOX_STYLE ?? "mapbox://styles/mapbox/dark-v11";

  if (!token) {
    return (
      <div className="flex h-full items-center justify-center px-6 pt-16 text-center text-slate-600">
        Mapbox token missing. Add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file.
      </div>
    );
  }

  return (
    <Map
      mapboxAccessToken={token}
      initialViewState={{
        longitude: userLocation.lng,
        latitude: userLocation.lat,
        zoom: 13,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={mapStyle}
    >
      <Source id="discovery-circle" type="geojson" data={circleGeoJSON}>
        <Layer
          id="discovery-fill"
          type="fill"
          paint={{ "fill-color": "#38bdf8", "fill-opacity": 0.15 }}
        />
        <Layer
          id="discovery-outline"
          type="line"
          paint={{ "line-color": "#7dd3fc", "line-width": 2, "line-opacity": 0.5 }}
        />
      </Source>

      <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
        <div className="relative">
          <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
          <div className="absolute inset-0 h-4 w-4 rounded-full bg-blue-400 animate-ping opacity-40" />
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
