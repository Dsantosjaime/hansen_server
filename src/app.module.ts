import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { CaslModule } from "./casl/casl.module";
import { PermissionGroupModule } from "./permissionGroup/permissionGroup.module";
import { RoleModule } from "./role/role.modules";
import { GroupsModule } from "./groups/groups.module";
import { SubGroupsModule } from "./subgroups/subgroups.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CaslModule,
    PermissionGroupModule,
    RoleModule,
    GroupsModule,
    SubGroupsModule,
  ],
})
export class AppModule {}
