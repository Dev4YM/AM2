import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InternalAuthGuard } from "./internal-auth.guard";

export const IS_PUBLIC_KEY = "isPublic";

/** Applies internal auth to all routes except @Public() and /health. */
@Injectable()
export class PublicPathGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly internalAuth: InternalAuthGuard,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest<{ path?: string; url?: string }>();
    const path = req.path ?? req.url ?? "";
    if (isPublic || path.startsWith("/health")) {
      return true;
    }

    return this.internalAuth.canActivate(context);
  }
}
