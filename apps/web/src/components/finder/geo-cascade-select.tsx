"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  countryHasGeoHierarchy,
  getCitiesForProvince,
  getProvincesForRegion,
  getRegionsForCountry,
} from "@am2/shared";

interface GeoCascadeSelectProps {
  countryCode: string;
  regionId: string;
  provinceId: string;
  cityId: string;
  onRegionChange: (regionId: string) => void;
  onProvinceChange: (provinceId: string) => void;
  onCityChange: (cityId: string) => void;
  disabled?: boolean;
}

export function GeoCascadeSelect({
  countryCode,
  regionId,
  provinceId,
  cityId,
  onRegionChange,
  onProvinceChange,
  onCityChange,
  disabled,
}: GeoCascadeSelectProps) {
  const hasHierarchy = countryHasGeoHierarchy(countryCode);

  const regions = useMemo(
    () => (hasHierarchy ? getRegionsForCountry(countryCode) : []),
    [countryCode, hasHierarchy],
  );

  const provinces = useMemo(
    () => (regionId ? getProvincesForRegion(countryCode, regionId) : []),
    [countryCode, regionId],
  );

  const cities = useMemo(
    () => (provinceId ? getCitiesForProvince(provinceId) : []),
    [provinceId],
  );

  if (!hasHierarchy) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <Label className="text-xs">
          Region <span className="text-destructive">*</span>
        </Label>
        <Select
          value={regionId || undefined}
          onValueChange={(v) => onRegionChange(v ?? "")}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {regions.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">
          State / Province <span className="text-destructive">*</span>
        </Label>
        <Select
          value={provinceId || undefined}
          onValueChange={(v) => onProvinceChange(v ?? "")}
          disabled={disabled || !regionId}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={regionId ? "Select state" : "Pick region first"} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {provinces.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-2 space-y-1">
        <Label className="text-xs">City (optional)</Label>
        <Select
          value={cityId || "all"}
          onValueChange={(v) => onCityChange(v === "all" ? "" : (v ?? ""))}
          disabled={disabled || !provinceId}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={provinceId ? "All cities in state" : "Pick state first"} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="all">All cities in state</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
