import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsString } from "class-validator";

export class BulkDeleteContactsDto {
  @ApiProperty({ type: [String], minItems: 1, description: "Ids des contacts" })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[];
}
