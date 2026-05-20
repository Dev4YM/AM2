import { Module } from "@nestjs/common";
import { PlacesController } from "./places.controller";
import { GooglePlacesService } from "./google-places.service";

@Module({
  controllers: [PlacesController],
  providers: [GooglePlacesService],
  exports: [GooglePlacesService],
})
export class PlacesModule {}
