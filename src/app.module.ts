import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { CaslModule } from "./casl/casl.module";
import { PermissionGroupModule } from "./permissionGroup/permissionGroup.module";
import { RoleModule } from "./role/role.modules";
import { GroupsModule } from "./groups/groups.module";
import { SubGroupsModule } from "./subgroups/subgroups.module";
import { ContactsModule } from "./contacts/contacts.module";
import { EmailModule } from "./email/email.module";
import { CampaignAttachmentsModule } from "./campaign-attachments/campaign-attachments.module";
import {
  ServeStaticModule,
  type ServeStaticModuleOptions,
} from "@nestjs/serve-static";

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
    ContactsModule,
    EmailModule,
    CampaignAttachmentsModule,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): ServeStaticModuleOptions[] => {
        const uploadDir = config.getOrThrow<string>("UPLOAD_DIR");

        return [
          {
            rootPath: uploadDir,
            serveRoot: "/campaign-attachments",
            serveStaticOptions: { index: false, fallthrough: false },
          },
        ];
      },
    }),
  ],
})
export class AppModule {}
