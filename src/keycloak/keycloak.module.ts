import { Module } from '@nestjs/common';
import { KeycloakAdminUsersService } from './users.services';

@Module({
  providers: [KeycloakAdminUsersService],
  exports: [KeycloakAdminUsersService],
})
export class KeycloakModule {}
