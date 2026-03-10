import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsObject,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class ScrapSelectionDto {
  @ApiProperty({ example: "65b000000000000000000002" })
  @IsString()
  groupId!: string;

  @ApiProperty({ example: "65b100000000000000000004" })
  @IsString()
  subGroupId!: string;

  @ApiProperty({ example: "example" })
  @IsString()
  domain!: string;

  @ApiProperty({ example: "com" })
  @IsString()
  extension!: string;

  @ApiProperty({ example: "{first}.{last}" })
  @IsString()
  pattern!: string;
}

export class ProspectDto {
  @ApiProperty({
    example: ["Marie", "Dupont"],
    description: "names[0] = prénom, names[1] = nom (si présent)",
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  names!: string[];

  @ApiProperty({ example: "Chargée de recrutement" })
  @IsString()
  function!: string;
}

export class SubmitLinkedinScrapeDto {
  @ApiProperty({ type: ScrapSelectionDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ScrapSelectionDto)
  selection!: ScrapSelectionDto;

  @ApiProperty({ type: ProspectDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProspectDto)
  prospects!: ProspectDto[];

  @ApiProperty({
    example: "https://www.linkedin.com/search/results/people/...",
  })
  @IsString()
  sourceUrl!: string;
}
