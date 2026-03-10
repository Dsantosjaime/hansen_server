import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateEmailAddressTemplateDto {
  @ApiProperty({ example: "prenom.nom" })
  @IsString()
  @MaxLength(80)
  name!: string;

  @ApiProperty({
    example: "{first}.{last}",
    description:
      "Pattern du local-part. Tokens supportés: {first}, {last}, {first:N}, {last:N} (N = nombre de caractères).",
  })
  @IsString()
  @MaxLength(120)
  pattern!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
