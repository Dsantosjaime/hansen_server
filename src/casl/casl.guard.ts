import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CHECK_ABILITIES_KEY,
  RequiredAbility,
} from './check-abilities.decorator';
import { CaslAbilityFactory } from './casl-ability.factory';
import { UsersService } from 'src/users/users.service';
import type { RequestWithAuth } from 'src/auth/request-with-user.type';

@Injectable()
export class CaslGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<RequiredAbility[]>(CHECK_ABILITIES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const kcUser = req.user;

    if (!kcUser?.sub) throw new ForbiddenException('Missing user');

    const dbUser = await this.usersService.updateFromKeycloak(kcUser);
    if (!dbUser?.role?.permissions) {
      throw new NotFoundException(
        `User with keycloakId=${kcUser?.sub} don't have any permission`,
      );
    }

    const realmRoles = kcUser.realm_access?.roles ?? [];
    const isSuperAdmin = realmRoles.includes('super_admin');

    const ability = this.caslAbilityFactory.createFor({
      isSuperAdmin,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      permissions: dbUser?.role?.permissions,
    });

    for (const r of required) {
      if (!ability.can(r.action as any, r.subject as any)) {
        throw new ForbiddenException('Forbidden by CASL');
      }
    }
    req.dbUser = dbUser;
    return true;
  }
}
