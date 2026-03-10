import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { ContactsController } from "./contacts.controller";
import { ContactsService } from "./contacts.service";
import { BrevoModule } from "@/brevo/brevo.module";
import { SubGroupsModule } from "@/subgroups/subgroups.module";

@Module({
  imports: [PrismaModule, BrevoModule, SubGroupsModule],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
