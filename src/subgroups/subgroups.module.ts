import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { SubGroupsController } from "./subgroups.controller";
import { SubGroupsService } from "./subgroups.service";
import { BrevoModule } from "src/brevo/brevo.module";
import { GroupsModule } from "@/groups/groups.module";

@Module({
  imports: [PrismaModule, BrevoModule, GroupsModule],
  controllers: [SubGroupsController],
  providers: [SubGroupsService],
  exports: [SubGroupsService],
})
export class SubGroupsModule {}
