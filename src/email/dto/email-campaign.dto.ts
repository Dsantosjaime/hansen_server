import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class EmailCampaignDto {
  @ApiProperty({ example: 345, description: "ID de campagne chez le provider" })
  id!: number;

  @ApiProperty({
    example: "Campagne Février",
    description: "Nom de la campagne",
  })
  name!: string;

  @ApiProperty({
    example: "Offre spéciale",
    description: "Sujet de la campagne",
  })
  subject!: string;

  @ApiProperty({
    example: "sent",
    description: "Statut provider (sent/queued/draft/...)",
  })
  status!: string;

  @ApiPropertyOptional({
    example: "2026-02-10T10:00:00.000Z",
    description: "Date de programmation si applicable",
  })
  scheduledAt?: string | null;

  @ApiPropertyOptional({
    example: "2026-02-01T12:00:00.000Z",
    description: "Date de création chez le provider",
  })
  createdAt?: string | null;

  @ApiPropertyOptional({
    example: "2026-02-01T12:05:00.000Z",
    description: "Date de modification chez le provider",
  })
  modifiedAt?: string | null;
}
