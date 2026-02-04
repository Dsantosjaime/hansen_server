import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import * as multer from "multer";
import type { Express } from "express";
import { CampaignAttachmentsService } from "./campaign-attachments.service";

@Controller("campaign-attachments")
export class CampaignAttachmentsController {
  constructor(private readonly service: CampaignAttachmentsService) {}

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: multer.memoryStorage(),
      limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Missing file");
    return this.service.saveAndGetUrl(file);
  }
}
