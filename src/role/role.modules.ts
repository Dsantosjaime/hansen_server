import { Module } from "@nestjs/common";
import { RoleController } from "./role.controller";
import { RoleService } from "./role.service";
import { PrismaModule } from "../prisma/prisma.module";
import { BrevoModule } from "@/brevo/brevo.module";

@Module({
  imports: [PrismaModule, BrevoModule],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
