import type { QualifiedTierKey } from "@am2/shared";
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

const TIER_KEYS: QualifiedTierKey[] = [
  "business",
  "enriched",
  "reviews",
  "sales",
  "emails",
];

export class EnrichQualifiedDataDto {
  @IsString()
  placeId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(TIER_KEYS, { each: true })
  tiers!: QualifiedTierKey[];

  @IsOptional()
  @IsString()
  crmContext?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  emailDraftCount?: number;
}
