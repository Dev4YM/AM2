import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { resolveDatabasePath } from "@am2/shared/database-path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const corsOrigin =
    config.get<string>("CORS_ORIGIN") ?? "http://localhost:3000";
  app.enableCors({
    origin: corsOrigin.split(",").map((o) => o.trim()),
    credentials: true,
  });

  const port = config.get<number>("PORT") ?? 4000;
  await app.listen(port);
  console.log(`AM2 API listening on http://localhost:${port}`);
  console.log(`AM2 CRM database: ${resolveDatabasePath()}`);
}

bootstrap();
