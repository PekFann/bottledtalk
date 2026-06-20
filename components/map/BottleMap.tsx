"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import type { MapEvent, MapRef, ViewStateChangeEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { NearbyBottle, MapStackItem, SignalTower, MapDecoration } from "@/lib/types";
import { CLUSTER_RADIUS_M, TOWER_PROXIMITY_M } from "@/lib/types";
import { markerZIndex, sortMarkersByDepth } from "@/lib/placement";
import {
  createDiscoveryCircleGeoJSON,
  createDiscoveryMaskGeoJSON,
} from "@/lib/geo";
import {
  getBoundsAroundPoint,
  MAP_MIN_ZOOM_PADDING_PX,
  MAP_MIN_ZOOM_RADIUS_MULTIPLIER,
} from "@/lib/mapConstraints";
import { clusterMapItems, stackFromItems, toMapStackItems } from "@/lib/clusterMapItems";
import { getStackItemsAtClick } from "@/lib/mapHitTest";
import { applyGreyRoadColors } from "@/lib/mapRoadColors";
import BottleMarker from "@/components/bottles/BottleMarker";
import ClusterMarker from "@/components/bottles/ClusterMarker";
import SignalTowerMarker from "@/components/map/SignalTowerMarker";
import DecorationMarker from "@/components/map/DecorationMarker";
import { Footprints } from "lucide-react";

const MAP_STYLE = "mapbox://styles/mapbox/outdoors-v12";

const DISCOVERY_OUTLINE = "#ffffff";
const DISCOVERY_MASK_FILL = "#1e293b";
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
  anchorLocation: { lat: number; lng: number };
  bottles: NearbyBottle[];
  towers?: SignalTower[];
  decorations?: MapDecoration[];
  currentUserId?: string;
  footprintMode?: boolean;
  placementMode?: boolean;
  onSelectBottle: (bottle: NearbyBottle) => void;
  onSelectStack: (items: MapStackItem[]) => void;
  onSelectTower?: (tower: SignalTower) => void;
  onSelectDecoration?: (decoration: MapDecoration) => void;
  onMapCenterChange?: (lat: number, lng: number) => void;
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
  anchorLocation,
  bottles,
  towers = [],
  decorations = [],
  currentUserId,
  footprintMode = false,
  placementMode = false,
  onSelectBottle,
  onSelectStack,
  onSelectTower,
  onSelectDecoration,
  onMapCenterChange,
  radiusM,
  selectedBottleId = null,
}: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapRef = useRef<MapRef>(null);
  const centeredKeyRef = useRef<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>(() =>
    createInitialViewState(anchorLocation)
  );

  const allItems = useMemo(
    () => toMapStackItems(bottles, towers),
    [bottles, towers]
  );

  const circleGeoJSON = useMemo(
    () => createDiscoveryCircleGeoJSON(anchorLocation.lng, anchorLocation.lat, radiusM),
    [anchorLocation.lng, anchorLocation.lat, radiusM]
  );

  const maskGeoJSON = useMemo(
    () => createDiscoveryMaskGeoJSON(anchorLocation.lng, anchorLocation.lat, radiusM),
    [anchorLocation.lng, anchorLocation.lat, radiusM]
  );

  const towerRangeGeoJSON = useMemo(() => {
    const ownerTowers = towers.filter((t) => t.owner_id === currentUserId);
    return {
      type: "FeatureCollection" as const,
      features: ownerTowers.map((tower) =>
        createDiscoveryCircleGeoJSON(tower.lng, tower.lat, TOWER_PROXIMITY_M)
      ),
    };
  }, [towers, currentUserId]);

  const markers = useMemo(
    () => sortMarkersByDepth(clusterMapItems(bottles, towers, CLUSTER_RADIUS_M)),
    [bottles, towers]
  );

  const sortedDecorations = useMemo(
    () => [...decorations].sort((a, b) => a.lat - b.lat),
    [decorations]
  );

  const resolveClickAtPoint = useCallback(
    (point: { x: number; y: number }) => {
      if (placementMode) return;

      const map = mapRef.current?.getMap();
      if (!map) return;

      const hits = getStackItemsAtClick(map, point, allItems);
      if (hits.length >= 2) {
        const { lng, lat } = map.unproject([point.x, point.y]);
        onSelectStack(stackFromItems(hits, lat, lng).items);
        return;
      }

      const item = hits[0];
      if (!item) return;

      if (item.kind === "bottle") {
        onSelectBottle(item.bottle);
      } else if (item.tower.owner_id === currentUserId) {
        onSelectTower?.(item.tower);
      }
    },
    [allItems, currentUserId, onSelectBottle, onSelectStack, onSelectTower, placementMode]
  );

  const handleMarkerClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      const map = mapRef.current?.getMap();
      if (!map) return;
      const rect = map.getContainer().getBoundingClientRect();
      resolveClickAtPoint({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [resolveClickAtPoint]
  );

  const applyMinZoom = useCallback(
    (map: MapEvent["target"]) => {
      const bounds = getBoundsAroundPoint(
        anchorLocation.lng,
        anchorLocation.lat,
        radiusM * MAP_MIN_ZOOM_RADIUS_MULTIPLIER
      );
      const camera = map.cameraForBounds(bounds, { padding: MAP_MIN_ZOOM_PADDING_PX });
      if (camera?.zoom != null) {
        map.setMinZoom(camera.zoom);
      }
    },
    [anchorLocation.lng, anchorLocation.lat, radiusM]
  );

  useEffect(() => {
    const key = footprintMode
      ? `footprint:${anchorLocation.lat.toFixed(5)}:${anchorLocation.lng.toFixed(5)}`
      : "gps";

    if (centeredKeyRef.current === key) {
      const map = mapRef.current?.getMap();
      if (map) applyMinZoom(map);
      return;
    }

    centeredKeyRef.current = key;
    setViewState(createInitialViewState(anchorLocation));
    const map = mapRef.current?.getMap();
    if (map) applyMinZoom(map);
  }, [anchorLocation, footprintMode, radiusM, applyMinZoom]);

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

  const handleMove = useCallback((evt: ViewStateChangeEvent) => {
    const { longitude, latitude, zoom, pitch, bearing } = evt.viewState;
    setViewState({ longitude, latitude, zoom, pitch, bearing });
  }, []);

  const handleMoveEnd = useCallback(
    (evt: ViewStateChangeEvent) => {
      if (onMapCenterChange) {
        onMapCenterChange(evt.viewState.latitude, evt.viewState.longitude);
      }
    },
    [onMapCenterChange]
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
      maxZoom={18}
      maxPitch={85}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      onLoad={handleMapLoad}
      onMove={handleMove}
      onMoveEnd={handleMoveEnd}
    >
      <Source id="discovery-mask" type="geojson" data={maskGeoJSON}>
        <Layer
          id="discovery-mask-fill"
          type="fill"
          paint={{
            "fill-color": DISCOVERY_MASK_FILL,
            "fill-opacity": 0.58,
          }}
        />
      </Source>

      <Source id="discovery-circle" type="geojson" data={circleGeoJSON}>
        <Layer
          id="discovery-outline"
          type="line"
          paint={{
            "line-color": DISCOVERY_OUTLINE,
            "line-width": 2.5,
            "line-opacity": 0.95,
            "line-dasharray": [2, 2],
          }}
        />
      </Source>

      {towerRangeGeoJSON.features.length > 0 && (
        <Source id="tower-range-circles" type="geojson" data={towerRangeGeoJSON}>
          <Layer
            id="tower-range-fill"
            type="fill"
            paint={{
              "fill-color": "#0ea5e9",
              "fill-opacity": 0.12,
            }}
          />
          <Layer
            id="tower-range-outline"
            type="line"
            paint={{
              "line-color": "#0284c7",
              "line-width": 3.5,
              "line-opacity": 0.95,
              "line-dasharray": [2, 2],
            }}
          />
        </Source>
      )}

      {footprintMode && (
        <Marker longitude={anchorLocation.lng} latitude={anchorLocation.lat} anchor="center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 border-2 border-white shadow-lg">
            <Footprints className="h-4 w-4 text-white" />
          </div>
        </Marker>
      )}

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

      {markers.map((m) => {
        const lat = m.kind === "cluster" ? m.stack.lat : m.item.kind === "bottle" ? m.item.bottle.lat : m.item.tower.lat;
        const selected =
          m.kind === "single" &&
          m.item.kind === "bottle" &&
          m.item.bottle.id === selectedBottleId;
        const zIndex = markerZIndex(lat, selected);

        if (m.kind === "cluster") {
          return (
            <ClusterMarker
              key={m.stack.id}
              stack={m.stack}
              zIndex={zIndex}
              onClick={() => onSelectStack(m.stack.items)}
            />
          );
        }

        if (m.item.kind === "bottle") {
          const bottle = m.item.bottle;
          return (
            <BottleMarker
              key={`bottle-${bottle.id}`}
              bottle={bottle}
              isSelected={bottle.id === selectedBottleId}
              zIndex={zIndex}
              onClick={handleMarkerClick}
            />
          );
        }

        const tower = m.item.tower;
        return (
          <SignalTowerMarker
            key={`tower-${tower.id}`}
            tower={tower}
            isOwner={tower.owner_id === currentUserId}
            zIndex={zIndex}
            onClick={handleMarkerClick}
          />
        );
      })}

      {sortedDecorations.map((decoration) => (
        <DecorationMarker
          key={`decoration-${decoration.id}`}
          decoration={decoration}
          zIndex={markerZIndex(decoration.lat)}
          onClick={() => {
            if (!placementMode) onSelectDecoration?.(decoration);
          }}
        />
      ))}
    </Map>
  );
}
