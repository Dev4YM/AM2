"use client";

import { useEffect, useRef } from "react";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  FinderMapToolbar,
  type MapTypeId,
} from "@/components/finder/finder-map-toolbar";
import type { LandAnchor } from "@/lib/map-viewport";
import type { FinderBusiness, MapBounds } from "@/types/finder";
import { getCountry } from "@/lib/countries";

export type MapDrawMode = "pan" | "area";

export type MapRefocusTarget = LandAnchor;

interface GoogleFinderMapProps {
  apiKey: string;
  countryCode: string;
  businesses: FinderBusiness[];
  selectedIds: Set<string>;
  focusedId?: string | null;
  drawMode: MapDrawMode;
  mapType: MapTypeId;
  areaBounds: MapBounds | null;
  onAreaBoundsChange: (bounds: MapBounds | null) => void;
  onViewportBoundsChange: (bounds: MapBounds) => void;
  onMarkerClick: (id: string) => void;
  onDrawModeToggle: () => void;
  onMapTypeChange: (type: MapTypeId) => void;
  onClearArea: () => void;
  onDrawComplete: () => void;
  fitResultsTrigger: number;
  refocusTarget?: MapRefocusTarget | null;
  refocusTrigger?: number;
  onRefocusComplete?: () => void;
}

function boundsFromLiteral(b: google.maps.LatLngBoundsLiteral): MapBounds {
  let { north, south, east, west } = b;
  if (north < south) [north, south] = [south, north];
  return {
    north: Number(north.toFixed(6)),
    south: Number(south.toFixed(6)),
    east: Number(east.toFixed(6)),
    west: Number(west.toFixed(6)),
  };
}

function boundsKey(b: MapBounds): string {
  return [b.north, b.south, b.east, b.west].map((n) => n.toFixed(5)).join("|");
}

/** Pan/zoom to land anchor after viewport was too wide for Places search */
function MapRefocusController({
  target,
  trigger,
  onCompleteRef,
}: {
  target: MapRefocusTarget | null | undefined;
  trigger: number;
  onCompleteRef: React.RefObject<(() => void) | undefined>;
}) {
  const map = useMap();
  const lastTrigger = useRef(0);

  useEffect(() => {
    if (!map || !target || !trigger || trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;

    const zoom = Math.max(target.zoom, 6);
    map.panTo({ lat: target.lat, lng: target.lng });
    map.setZoom(zoom);

    // Wait for pan/zoom animation — do not read bounds on first idle (still world-sized)
    const timer = window.setTimeout(() => {
      onCompleteRef.current?.();
    }, 900);

    return () => window.clearTimeout(timer);
  }, [map, target, trigger, onCompleteRef]);

  return null;
}

function CountryNavigator({ countryCode }: { countryCode: string }) {
  const map = useMap();
  const prev = useRef(countryCode);

  useEffect(() => {
    if (!map || prev.current === countryCode) return;
    prev.current = countryCode;
    const meta = getCountry(countryCode);
    if (meta) {
      map.panTo(meta.center);
      map.setZoom(meta.zoom);
    }
  }, [countryCode, map]);

  return null;
}

function MapTypeSync({ mapType }: { mapType: MapTypeId }) {
  const map = useMap();
  useEffect(() => {
    map?.setMapTypeId(mapType);
  }, [map, mapType]);
  return null;
}

function ViewportTracker({
  onChangeRef,
}: {
  onChangeRef: React.RefObject<(b: MapBounds) => void>;
}) {
  const map = useMap();
  const lastKey = useRef("");

  useEffect(() => {
    if (!map) return;

    const emit = () => {
      const b = map.getBounds();
      if (!b) return;
      const ne = b.getNorthEast();
      const sw = b.getSouthWest();
      const bounds: MapBounds = {
        north: ne.lat(),
        south: sw.lat(),
        east: ne.lng(),
        west: sw.lng(),
      };
      const key = boundsKey(bounds);
      if (key === lastKey.current) return;
      lastKey.current = key;
      onChangeRef.current(bounds);
    };

    const idle = map.addListener("idle", emit);
    return () => idle.remove();
  }, [map, onChangeRef]);

  return null;
}

function ResultsFitter({
  businesses,
  trigger,
}: {
  businesses: FinderBusiness[];
  trigger: number;
}) {
  const map = useMap();
  const lastTrigger = useRef(0);

  useEffect(() => {
    if (!map || businesses.length === 0 || trigger === 0 || trigger === lastTrigger.current) {
      return;
    }
    lastTrigger.current = trigger;
    const bounds = new google.maps.LatLngBounds();
    for (const b of businesses) bounds.extend({ lat: b.lat, lng: b.lng });
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 420 });
  }, [map, businesses, trigger]);

  return null;
}

/** Show saved search rectangle — stable geographic bounds (does not resize on zoom) */
function AreaBoundsDisplay({ bounds }: { bounds: MapBounds | null }) {
  const map = useMap();
  const rectRef = useRef<google.maps.Rectangle | null>(null);
  const boundsKey = bounds
    ? `${bounds.north}|${bounds.south}|${bounds.east}|${bounds.west}`
    : "";

  useEffect(() => {
    if (!map) return;
    if (!bounds) {
      rectRef.current?.setMap(null);
      rectRef.current = null;
      return;
    }
    const literal = {
      north: bounds.north,
      south: bounds.south,
      east: bounds.east,
      west: bounds.west,
    };
    if (!rectRef.current) {
      rectRef.current = new google.maps.Rectangle({
        bounds: literal,
        fillColor: "#2563eb",
        fillOpacity: 0.12,
        strokeColor: "#2563eb",
        strokeWeight: 2,
        clickable: false,
        map,
      });
    } else {
      rectRef.current.setBounds(literal);
    }
  }, [map, boundsKey, bounds]);

  useEffect(() => {
    return () => {
      rectRef.current?.setMap(null);
      rectRef.current = null;
    };
  }, [map]);

  return null;
}

function RectangleDrawTool({
  drawMode,
  onAreaBoundsChangeRef,
  onDrawCompleteRef,
}: {
  drawMode: MapDrawMode;
  onAreaBoundsChangeRef: React.RefObject<(b: MapBounds | null) => void>;
  onDrawCompleteRef: React.RefObject<() => void>;
}) {
  const map = useMap();
  const previewRef = useRef<google.maps.Rectangle | null>(null);
  const startRef = useRef<google.maps.LatLng | null>(null);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);

  useEffect(() => {
    if (!map) return;

    const clearListeners = () => {
      for (const l of listenersRef.current) l.remove();
      listenersRef.current = [];
    };

    const clearPreview = () => {
      previewRef.current?.setMap(null);
      previewRef.current = null;
    };

    clearListeners();
    clearPreview();
    startRef.current = null;

    if (drawMode !== "area") {
      map.setOptions({
        draggable: true,
        gestureHandling: "greedy",
        draggableCursor: null,
      });
      return clearListeners;
    }

    // Lock map panning so drag draws a rectangle instead
    map.setOptions({
      draggable: false,
      gestureHandling: "none",
      scrollwheel: true,
      disableDoubleClickZoom: true,
      draggableCursor: "crosshair",
    });

    const onMouseDown = (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      e.domEvent?.preventDefault();
      e.domEvent?.stopPropagation();
      startRef.current = e.latLng;
      clearPreview();
    };

    const onMouseMove = (e: google.maps.MapMouseEvent) => {
      if (!startRef.current || !e.latLng) return;
      const bounds = new google.maps.LatLngBounds(startRef.current, e.latLng);
      if (!previewRef.current) {
        previewRef.current = new google.maps.Rectangle({
          bounds,
          fillColor: "#2563eb",
          fillOpacity: 0.2,
          strokeColor: "#1d4ed8",
          strokeWeight: 2,
          clickable: false,
          map,
        });
      } else {
        previewRef.current.setBounds(bounds);
      }
    };

    const onMouseUp = (e: google.maps.MapMouseEvent) => {
      if (!startRef.current || !e.latLng) return;
      e.domEvent?.preventDefault();
      const bounds = new google.maps.LatLngBounds(startRef.current, e.latLng);
      const literal = bounds.toJSON();
      clearPreview();
      startRef.current = null;

      if (Math.abs(literal.north - literal.south) > 0.0001) {
        onAreaBoundsChangeRef.current(boundsFromLiteral(literal));
        onDrawCompleteRef.current();
      }
    };

    listenersRef.current = [
      map.addListener("mousedown", onMouseDown),
      map.addListener("mousemove", onMouseMove),
      map.addListener("mouseup", onMouseUp),
    ];

    return () => {
      clearListeners();
      clearPreview();
      startRef.current = null;
      map.setOptions({
        draggable: true,
        gestureHandling: "greedy",
        draggableCursor: null,
        disableDoubleClickZoom: false,
      });
    };
  }, [map, drawMode, onAreaBoundsChangeRef, onDrawCompleteRef]);

  return null;
}

function MapMarkers({
  businesses,
  focusedId,
  onMarkerClickRef,
}: {
  businesses: FinderBusiness[];
  focusedId?: string | null;
  onMarkerClickRef: React.RefObject<(id: string) => void>;
}) {
  const focused = businesses.find((b) => b.id === focusedId);

  return (
    <>
      {businesses.map((b) => (
        <Marker
          key={b.id}
          position={{ lat: b.lat, lng: b.lng }}
          onClick={() => onMarkerClickRef.current(b.id)}
          title={b.name}
        />
      ))}
      {focused && (
        <InfoWindow position={{ lat: focused.lat, lng: focused.lng }}>
          <div className="max-w-56 space-y-1 p-0.5 text-sm text-black">
            <p className="font-semibold leading-tight">{focused.name}</p>
            <p className="text-xs text-gray-600">{focused.category}</p>
            {focused.rating != null && (
              <p className="text-xs">
                ★ {focused.rating.toFixed(1)}
                {focused.reviewCount != null ? ` · ${focused.reviewCount} reviews` : ""}
              </p>
            )}
            {focused.phone && <p className="text-xs">{focused.phone}</p>}
            <p className="text-xs text-gray-500">{focused.address}</p>
            {focused.googleMapsUri && (
              <a
                href={focused.googleMapsUri}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 underline"
              >
                Open in Google Maps
              </a>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function MapInner(props: Omit<GoogleFinderMapProps, "apiKey">) {
  const countryMeta = getCountry(props.countryCode);
  const initial = countryMeta?.center ?? { lat: 40.7128, lng: -74.006 };
  const initialZoom = countryMeta?.zoom ?? 5;

  const onViewportRef = useRef(props.onViewportBoundsChange);
  const onAreaRef = useRef(props.onAreaBoundsChange);
  const onMarkerRef = useRef(props.onMarkerClick);
  const onDrawCompleteRef = useRef(props.onDrawComplete);
  const onRefocusCompleteRef = useRef(props.onRefocusComplete);
  onViewportRef.current = props.onViewportBoundsChange;
  onAreaRef.current = props.onAreaBoundsChange;
  onMarkerRef.current = props.onMarkerClick;
  onDrawCompleteRef.current = props.onDrawComplete;
  onRefocusCompleteRef.current = props.onRefocusComplete;

  return (
    <Map
      defaultCenter={initial}
      defaultZoom={initialZoom}
      gestureHandling="greedy"
      disableDefaultUI
      className="size-full"
      style={{ width: "100%", height: "100%" }}
    >
      <CountryNavigator countryCode={props.countryCode} />
      <MapTypeSync mapType={props.mapType} />
      <MapRefocusController
        target={props.refocusTarget}
        trigger={props.refocusTrigger ?? 0}
        onCompleteRef={onRefocusCompleteRef}
      />
      <ViewportTracker onChangeRef={onViewportRef} />
      {props.drawMode === "pan" && <AreaBoundsDisplay bounds={props.areaBounds} />}
      <RectangleDrawTool
        drawMode={props.drawMode}
        onAreaBoundsChangeRef={onAreaRef}
        onDrawCompleteRef={onDrawCompleteRef}
      />
      <ResultsFitter businesses={props.businesses} trigger={props.fitResultsTrigger} />
      <MapMarkers
        businesses={props.businesses}
        focusedId={props.focusedId}
        onMarkerClickRef={onMarkerRef}
      />
      <FinderMapToolbar
        drawMode={props.drawMode}
        mapType={props.mapType}
        areaBounds={Boolean(props.areaBounds)}
        onDrawModeToggle={props.onDrawModeToggle}
        onMapTypeChange={props.onMapTypeChange}
        onClearArea={props.onClearArea}
      />
    </Map>
  );
}

export function GoogleFinderMap({ apiKey, ...props }: GoogleFinderMapProps) {
  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative size-full min-h-[400px]">
        <MapInner {...props} />
      </div>
    </APIProvider>
  );
}
