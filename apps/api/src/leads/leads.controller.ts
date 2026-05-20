import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
} from "@nestjs/common";
import type { AuthedRequest } from "../auth/internal-auth.guard";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import type { LeadImportRow } from "@am2/shared";
import { LeadsService } from "./leads.service";

class LeadRowDto implements LeadImportRow {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  lng!: number;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  externalId?: string;
}

class ImportLeadsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeadRowDto)
  rows!: LeadRowDto[];

  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean;
}

@Controller("leads")
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    const uid = req.userId;
    if (!uid) throw new BadRequestException("x-user-id header required");
    return { leads: this.leads.listForUser(uid) };
  }

  @Post("import")
  import(@Req() req: AuthedRequest, @Body() body: ImportLeadsDto) {
    const uid = req.userId;
    if (!uid) throw new BadRequestException("x-user-id header required");
    const validation = this.leads.validateImport(body);
    const result = this.leads.importForUser(uid, {
      rows: body.rows,
      skipDuplicates: body.skipDuplicates,
    });
    return {
      ...result,
      validation: {
        invalidCount: validation.invalid.length,
        invalid: validation.invalid.slice(0, 10),
      },
    };
  }

  @Post("import/validate")
  validate(@Body() body: ImportLeadsDto) {
    return this.leads.validateImport(body);
  }
}
