import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsInt, IsOptional, IsString, Min } from "class-validator";

export class ScheduleSendCampaignDto {
  @ApiProperty({
    example: 12,
    description: "ID du template Brevo sélectionné par l'utilisateur",
  })
  @IsInt()
  @Min(1)
  templateId!: number;

  @ApiPropertyOptional({ example: "Campagne Hansen - Février" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: ["65b000000000000000000002"],
    description: "IDs de Group (Mongo ObjectId string). Optionnel.",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];

  @ApiPropertyOptional({
    example: ["65b100000000000000000004"],
    description: "IDs de SubGroup (Mongo ObjectId string). Optionnel.",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subGroupIds?: string[];

  // Tu peux le garder pour plus tard, mais côté service tu peux refuser si tu veux.
  @ApiPropertyOptional({
    example: "2026-02-10T10:00:00.000Z",
    description: "Non supporté pour le moment si tu veux désactiver scheduled",
  })
  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description:
      "URL d'une pièce jointe (supportée par CreateEmailCampaign.attachmentUrl)",
    example: "https://cdn.ton-domaine.com/docs/brochure.pdf",
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
