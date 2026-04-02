import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class MarkTemplateAsSentDto {
  @ApiProperty({ type: Number, description: "Id du template Brevo" })
  @IsInt()
  @Min(1)
  templateId!: number;

  @ApiPropertyOptional({
    type: [String],
    description: "Ids des groupes (inclut tous les subgroups de ces groupes)",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  groupIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: "Ids des subgroups ciblés explicitement",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  subGroupIds?: string[];
}
