import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CaslModule } from './casl/casl.module';
import { PermissionGroupModule } from './permissionGroup/permissionGroup.module';
import { RoleModule } from './role/role.modules';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CaslModule,
    PermissionGroupModule,
    RoleModule,
  ],
})
export class AppModule {}
