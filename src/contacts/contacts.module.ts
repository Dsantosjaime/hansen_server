import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { ContactsController } from "./contacts.controller";
import { ContactsService } from "./contacts.service";
import { BrevoModule } from "@/brevo/brevo.module";

@Module({
  imports: [PrismaModule, BrevoModule],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
