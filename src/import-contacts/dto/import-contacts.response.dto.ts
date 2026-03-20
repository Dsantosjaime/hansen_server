import { ApiProperty } from "@nestjs/swagger";

class ImportErrorDto {
  @ApiProperty() row!: number;
  @ApiProperty() reason!: string;
}

export class ImportContactsCsvResponseDto {
  @ApiProperty() dryRun!: boolean;

  @ApiProperty()
  group!: { id: string; name: string };

  @ApiProperty() delimiter!: string;

  @ApiProperty() subGroupsCreated!: number;
  @ApiProperty() subGroupsReused!: number;

  @ApiProperty() contactsUpserted!: number;
  @ApiProperty() contactsSkippedNoEmail!: number;
  @ApiProperty() contactsSkippedInvalidEmail!: number;
  @ApiProperty() contactsSkippedNoSubGroup!: number;

  @ApiProperty({
    description:
      "Nombre de contacts préparés pour sync Brevo (si dryRun=false).",
  })
  brevoPrepared!: number;

  @ApiProperty({
    description: "Nombre de succès / échecs Brevo (si dryRun=false).",
  })
  brevoSync?: {
    lists: number;
    success: number;
    failed: number;
  };

  @ApiProperty({ type: [ImportErrorDto] })
  errors!: ImportErrorDto[];
}
