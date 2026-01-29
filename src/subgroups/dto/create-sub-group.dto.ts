import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class CreateSubGroupDto {
  @ApiProperty({ example: "Sous-groupe 1" })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: "507f1f77bcf86cd799439011" })
  @IsString()
  groupId!: string;
}
