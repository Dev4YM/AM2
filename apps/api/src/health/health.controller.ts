import { Controller, Get } from "@nestjs/common";
import { Public } from "../auth/public.decorator";
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from "@nestjs/terminus";

@Public()
@Controller("health")
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  @Get("live")
  live() {
    return { status: "ok", service: "am2-api" };
  }
}
