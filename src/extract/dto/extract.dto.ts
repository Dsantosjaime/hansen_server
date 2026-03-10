import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsMongoId, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class ExtractSubGroupDto {
  @ApiProperty({ example: "699334fd43b69895e801da4f" })
  @IsMongoId()
  id!: string;

  @ApiProperty({ example: "Jaime Sous Group" })
  @IsString()
  name!: string;
}

export class ExtractGroupDto {
  @ApiProperty({ example: "699334ed43b69895e801da4e" })
  @IsMongoId()
  id!: string;

  @ApiProperty({ example: "Dos Santos Group" })
  @IsString()
  name!: string;

  @ApiProperty({ type: [ExtractSubGroupDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractSubGroupDto)
  subGroups!: ExtractSubGroupDto[];
}
