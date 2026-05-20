import { Body, Controller, Get, Post } from "@nestjs/common";
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { AiService, type ReviewInput } from "./ai.service";

class ReviewDto implements ReviewInput {
  @IsString()
  author!: string;

  @Type(() => Number)
  rating!: number;

  @IsString()
  text!: string;

  @IsOptional()
  @IsString()
  date?: string;
}

class SummarizeDto {
  @IsString()
  businessName!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewDto)
  reviews!: ReviewDto[];

  @IsOptional()
  @IsString()
  businessContext?: string;
}

class SmartSalesDto {
  @IsString()
  businessName!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  sellerContext?: string;
}

class SmartEmailDto {
  @IsString()
  businessName!: string;

  @IsOptional()
  @IsString()
  recipientRole?: string;

  @IsOptional()
  @IsString()
  intent?: string;
}

@Controller("ai")
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get("config")
  config() {
    return { openaiEnabled: this.ai.isConfigured() };
  }

  @Post("summarize-reviews")
  summarize(@Body() body: SummarizeDto) {
    return this.ai.summarizeReviews(
      body.businessName,
      body.reviews,
      body.businessContext,
    );
  }

  @Post("smart-sales")
  smartSales(@Body() body: SmartSalesDto) {
    return this.ai.smartSalesPitch(body);
  }

  @Post("smart-email")
  smartEmail(@Body() body: SmartEmailDto) {
    return this.ai.smartEmail(body);
  }
}
