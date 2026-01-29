import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { SubGroupsController } from "./subgroups.controller";
import { SubGroupsService } from "./subgroups.service";

@Module({
  imports: [PrismaModule],
  controllers: [SubGroupsController],
  providers: [SubGroupsService],
  exports: [SubGroupsService],
})
export class SubGroupsModule {}
