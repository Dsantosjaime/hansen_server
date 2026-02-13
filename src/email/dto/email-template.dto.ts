import { ApiProperty } from "@nestjs/swagger";

export class EmailTemplateDto {
  @ApiProperty({ example: 12, description: "ID du template email" })
  id!: number;

  @ApiProperty({
    example: "Template Relance #1",
    description: "Nom du template",
  })
  name!: string;

  @ApiProperty({
    example: "Bonjour {{ contact.FIRSTNAME }}",
    description: "Sujet",
  })
  subject!: string;

  @ApiProperty({ example: true, description: "Template actif côté provider" })
  isActive!: boolean;
}
