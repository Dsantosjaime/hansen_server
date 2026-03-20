import { ApiProperty } from "@nestjs/swagger";

export class ImportContactsCsvRequestDto {
  @ApiProperty({
    description: "Nom du groupe à créer/réutiliser (ex: nom de la feuille)",
    example: "Prospects - Collectivités",
  })
  groupName!: string;

  @ApiProperty({
    type: "string",
    format: "binary",
    description: "CSV exporté (1 fichier = 1 feuille)",
  })
  file!: any;
}
