import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { InternalAuthGuard } from "./internal-auth.guard";
import { PublicPathGuard } from "./public-path.guard";

@Global()
@Module({
  providers: [
    InternalAuthGuard,
    PublicPathGuard,
    {
      provide: APP_GUARD,
      useClass: PublicPathGuard,
    },
  ],
  exports: [InternalAuthGuard],
})
export class AuthModule {}
