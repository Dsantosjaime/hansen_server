import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateUserWithRoleDto {
  @ApiProperty({ example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "john.doe@email.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "TempPassw0rd!" })
  @IsString()
  @MinLength(8)
  temporaryPassword!: string;

  @ApiProperty({
    example: "66f2c1e4d2a9b7c3f1a2b3c4",
    description: "Mongo ObjectId du rôle",
  })
  @IsString()
  @IsNotEmpty()
  roleId!: string;

  @ApiPropertyOptional({ example: "Responsable commercial" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string;

  @ApiPropertyOptional({ example: "+33 1 23 45 67 89" })
  @IsOptional()
  @IsString()
  @Matches(/^[\d\s.\-+()]{6,20}$/, {
    message:
      "phoneFixed doit contenir uniquement chiffres, espaces, +, -, ., ( )",
  })
  phoneFixed?: string;

  @ApiPropertyOptional({ example: "+33 6 12 34 56 78" })
  @IsOptional()
  @IsString()
  @Matches(/^[\d\s.\-+()]{6,20}$/, {
    message:
      "phoneMobile doit contenir uniquement chiffres, espaces, +, -, ., ( )",
  })
  phoneMobile?: string;
}
