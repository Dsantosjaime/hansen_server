import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "src/prisma/prisma.module";
import { brevoClientProvider } from "./brevo.provider";
import { BrevoMarketingService } from "./brevo-marketing.service";
import { BrevoMarketingController } from "./brevo-marketing.controller";
import { EmailModule } from "@/email/email.module";

@Module({
  imports: [ConfigModule, PrismaModule, EmailModule],
  providers: [brevoClientProvider, BrevoMarketingService],
  controllers: [BrevoMarketingController],
  exports: [BrevoMarketingService],
})
export class BrevoModule {}
