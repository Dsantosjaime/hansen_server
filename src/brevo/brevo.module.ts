import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "src/prisma/prisma.module";
import { brevoClientProvider } from "./brevo.provider";
import { BrevoMarketingService } from "./brevo-marketing.service";

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [brevoClientProvider, BrevoMarketingService],
  controllers: [],
  exports: [BrevoMarketingService],
})
export class BrevoModule {}
