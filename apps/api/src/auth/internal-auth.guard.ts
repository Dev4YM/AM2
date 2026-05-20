import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";

export type AuthedRequest = Request & { userId?: string };

@Injectable()
export class InternalAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const expected = this.config.get<string>("AM2_INTERNAL_API_KEY");
    const provided = req.headers["x-am2-internal-key"];

    if (!expected) {
      throw new UnauthorizedException(
        "AM2_INTERNAL_API_KEY is not configured on the API server",
      );
    }

    if (!provided || provided !== expected) {
      throw new UnauthorizedException("Invalid internal API key");
    }

    const userId = req.headers["x-user-id"];
    if (typeof userId === "string" && userId.trim()) {
      req.userId = userId.trim();
    }

    return true;
  }
}
