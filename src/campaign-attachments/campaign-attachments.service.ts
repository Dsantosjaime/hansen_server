import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import type { Express } from "express"; // <- important

function safeExt(originalName: string) {
  const ext = path.extname(originalName).toLowerCase();
  return ext && ext.length <= 10 ? ext : "";
}

@Injectable()
export class CampaignAttachmentsService {
  constructor(private readonly config: ConfigService) {}

  async saveAndGetUrl(file: Express.Multer.File) {
    const uploadDir: string = this.config.getOrThrow<string>("UPLOAD_DIR");
    const baseUrl: string = this.config.getOrThrow<string>(
      "PUBLIC_FILES_BASE_URL",
    );

    await fs.mkdir(uploadDir, { recursive: true });

    const token = randomUUID();
    const storedName = `${token}${safeExt(file.originalname)}`;
    const storedPath = path.join(uploadDir, storedName);

    await fs.writeFile(storedPath, file.buffer);

    return {
      attachmentUrl: `${baseUrl}/campaign-attachments/${storedName}`,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
