import { Module } from "@nestjs/common";
import { EmailAddressTemplatesController } from "./email-address-templates.controller";
import { EmailAddressTemplatesService } from "./email-address-templates.service";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
  controllers: [EmailAddressTemplatesController],
  providers: [EmailAddressTemplatesService, PrismaService],
  exports: [EmailAddressTemplatesService],
})
export class EmailAddressTemplatesModule {}
