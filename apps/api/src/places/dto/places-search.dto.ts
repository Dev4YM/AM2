import { Type } from "class-transformer";
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class MapBoundsDto {
  @Type(() => Number)
  @IsNumber()
  north!: number;

  @Type(() => Number)
  @IsNumber()
  south!: number;

  @Type(() => Number)
  @IsNumber()
  east!: number;

  @Type(() => Number)
  @IsNumber()
  west!: number;
}

export class PlacesSearchDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  country!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => MapBoundsDto)
  bounds?: MapBoundsDto;
}
