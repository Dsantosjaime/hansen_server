import type { Request } from 'express';
import type { KeycloakJwtPayload } from './keycloack-user.type';
import type { User as DbUser } from 'generated/prisma/client';
export type RequestWithAuth = Request & {
    user: KeycloakJwtPayload;
    dbUser?: DbUser;
};
