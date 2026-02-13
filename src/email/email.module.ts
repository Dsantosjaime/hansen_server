import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { EmailController } from "./email.controller";
import { EmailService } from "./email.service";
import { BrevoModule } from "@/brevo/brevo.module";

@Module({
  imports: [PrismaModule, BrevoModule],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
