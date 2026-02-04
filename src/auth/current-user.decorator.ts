import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { KeycloakJwtPayload } from "./keycloack-user.type";
import { RequestWithAuth } from "./request-with-user.type";

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): KeycloakJwtPayload | undefined => {
    const req = ctx.switchToHttp().getRequest<RequestWithAuth>();
    return req.user;
  },
);
