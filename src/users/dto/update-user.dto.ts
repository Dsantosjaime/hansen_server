import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

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
}
