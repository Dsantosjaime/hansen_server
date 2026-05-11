import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class UpdateUserDto {
  @ApiPropertyOptional({ example: "Jean Dupont" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "jean@domaine.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "507f1f77bcf86cd799439011" })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional({ example: "Temp1234!" })
  @IsOptional()
  @IsString()
  temporaryPassword?: string;

  // --- Champs signature : nullable explicitement (null = effacer en BDD)
  @ApiPropertyOptional({
    example: "Responsable commercial",
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(100)
  jobTitle?: string | null;

  @ApiPropertyOptional({ example: "+33 1 23 45 67 89", nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Matches(/^[\d\s.\-+()]{6,20}$/, {
    message:
      "phoneFixed doit contenir uniquement chiffres, espaces, +, -, ., ( )",
  })
  phoneFixed?: string | null;

  @ApiPropertyOptional({ example: "+33 6 12 34 56 78", nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Matches(/^[\d\s.\-+()]{6,20}$/, {
    message:
      "phoneMobile doit contenir uniquement chiffres, espaces, +, -, ., ( )",
  })
  phoneMobile?: string | null;
}
