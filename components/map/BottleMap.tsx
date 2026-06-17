"use client";

import { useCallback, useMemo } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import type { MapEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { NearbyBottle, BottleCluster } from "@/lib/types";
import { CLUSTER_RADIUS_M } from "@/lib/types";
import { createDiscoveryCircleGeoJSON } from "@/lib/geo";
import { clusterBottles } from "@/lib/clusterBottles";
import { applyGreyRoadColors } from "@/lib/mapRoadColors";
import BottleMarker from "@/components/bottles/BottleMarker";
import ClusterMarker from "@/components/bottles/ClusterMarker";

const MAP_STYLE = "mapbox://styles/mapbox/outdoors-v12";

const DISCOVERY_FILL = "#3b82f6";
const DISCOVERY_OUTLINE = "#2563eb";
const USER_PIN = "#3b82f6";

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

  const mapStyle = MAP_STYLE;

  const handleMapLoad = useCallback((e: MapEvent) => {
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
  }, []);

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
        zoom: 14,
        pitch: 45,
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
          paint={{ "fill-color": DISCOVERY_FILL, "fill-opacity": 0.15 }}
        />
        <Layer
          id="discovery-outline"
          type="line"
          paint={{
            "line-color": DISCOVERY_OUTLINE,
            "line-width": 2,
            "line-opacity": 0.5,
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
