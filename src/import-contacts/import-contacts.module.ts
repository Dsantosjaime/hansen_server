import { Module } from "@nestjs/common";
import { ImportContactsController } from "./import-contacts.controller";
import { ImportContactsService } from "./import-contacts.service";
import { PrismaModule } from "@/prisma/prisma.module";
import { GroupsModule } from "@/groups/groups.module";
import { SubGroupsModule } from "@/subgroups/subgroups.module";
import { BrevoModule } from "@/brevo/brevo.module";

@Module({
  imports: [PrismaModule, GroupsModule, SubGroupsModule, BrevoModule],
  controllers: [ImportContactsController],
  providers: [ImportContactsService],
})
export class ImportContactsModule {}
