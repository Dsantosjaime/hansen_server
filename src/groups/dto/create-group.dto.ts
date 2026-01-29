import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class CreateGroupDto {
  @ApiProperty({ example: "Groupe A" })
  @IsString()
  @MinLength(1)
  name!: string;
}
