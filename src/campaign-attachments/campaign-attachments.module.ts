import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CampaignAttachmentsController } from "./campaign-attachments.controller";
import { CampaignAttachmentsService } from "./campaign-attachments.service";

@Module({
  imports: [ConfigModule],
  controllers: [CampaignAttachmentsController],
  providers: [CampaignAttachmentsService],
  exports: [CampaignAttachmentsService],
})
export class CampaignAttachmentsModule {}
