import { Module } from "@nestjs/common";
import { ExtractController } from "./extract.controller";
import { ExtractService } from "./extract.service";
import { ContactsModule } from "@/contacts/contacts.module";

@Module({
  imports: [ContactsModule],
  controllers: [ExtractController],
  providers: [ExtractService],
})
export class ExtractModule {}
