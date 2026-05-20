"use client";

import { useMap } from "@vis.gl/react-google-maps";
import { Minus, Plus, Settings2, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MapDrawMode } from "@/components/map/google-finder-map";

export type MapTypeId = "roadmap" | "satellite" | "hybrid";

interface FinderMapToolbarProps {
  drawMode: MapDrawMode;
  mapType: MapTypeId;
  areaBounds: boolean;
  onDrawModeToggle: () => void;
  onMapTypeChange: (type: MapTypeId) => void;
  onClearArea: () => void;
}

export function FinderMapToolbar({
  drawMode,
  mapType,
  areaBounds,
  onDrawModeToggle,
  onMapTypeChange,
  onClearArea,
}: FinderMapToolbarProps) {
  const map = useMap();

  const zoomBy = (delta: number) => {
    if (!map) return;
    const z = map.getZoom();
    if (z == null) return;
    map.setZoom(z + delta);
  };

  return (
    <>
      {/* Draw area — top left */}
      <div className="pointer-events-auto absolute top-4 left-4 z-20">
        <Button
          type="button"
          size="sm"
          variant={drawMode === "area" ? "default" : "secondary"}
          className="shadow-lg"
          onClick={onDrawModeToggle}
        >
          <Square data-icon="inline-start" />
          {drawMode === "area" ? "Drawing…" : "Draw area"}
        </Button>
      </div>

      {/* Map settings — below hide-panel / import row */}
      <div className="pointer-events-auto absolute top-14 right-4 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="bg-background hover:bg-accent inline-flex size-10 items-center justify-center rounded-full border shadow-lg outline-none"
            aria-label="Map settings"
          >
            <Settings2 className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Map type</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={mapType}
                onValueChange={(v) => v && onMapTypeChange(v as MapTypeId)}
              >
                <DropdownMenuRadioItem value="roadmap">Roadmap</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="satellite">Satellite</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="hybrid">Hybrid</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled={!areaBounds} onClick={onClearArea}>
                <Trash2 data-icon="inline-start" />
                Clear drawn area
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Zoom — bottom right */}
      <div className="pointer-events-auto absolute right-4 bottom-4 z-20 flex flex-col overflow-hidden rounded-lg border bg-background shadow-lg">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 rounded-none"
          aria-label="Zoom in"
          onClick={() => zoomBy(1)}
        >
          <Plus className="size-5" />
        </Button>
        <div className="bg-border h-px w-full" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 rounded-none"
          aria-label="Zoom out"
          onClick={() => zoomBy(-1)}
        >
          <Minus className="size-5" />
        </Button>
      </div>
    </>
  );
}
