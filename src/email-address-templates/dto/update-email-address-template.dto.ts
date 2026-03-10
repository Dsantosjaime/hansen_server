import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateEmailAddressTemplateDto {
  @ApiPropertyOptional({ example: "initiale.prenom" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({
    example: "{first:1}.{last}",
    description:
      "Tokens supportés: {first}, {last}, {first:N}, {last:N} (N = nombre de caractères).",
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  pattern?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
