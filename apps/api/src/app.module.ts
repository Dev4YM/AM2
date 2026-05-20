import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { PlacesModule } from "./places/places.module";
import { SearchModule } from "./search/search.module";
import { GeoModule } from "./geo/geo.module";
import { EnrichmentModule } from "./enrichment/enrichment.module";
import { AiModule } from "./ai/ai.module";
import { ReputationModule } from "./reputation/reputation.module";
import { LeadsModule } from "./leads/leads.module";
import { QualifiedDataModule } from "./qualified-data/qualified-data.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    TerminusModule,
    AuthModule,
    DatabaseModule,
    HealthModule,
    PlacesModule,
    SearchModule,
    GeoModule,
    EnrichmentModule,
    AiModule,
    ReputationModule,
    LeadsModule,
    QualifiedDataModule,
  ],
})
export class AppModule {}
