import { Module } from '@nestjs/common';
import { PermissionGroupController } from './permissionGroup.controller';
import { PermissionGroupService } from './permissionGroup.service';

@Module({
  controllers: [PermissionGroupController],
  providers: [PermissionGroupService],
  exports: [PermissionGroupService],
})
export class PermissionGroupModule {}
