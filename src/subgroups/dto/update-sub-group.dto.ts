import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { CreateSubGroupDto } from "./create-sub-group.dto";

export class UpdateSubGroupDto extends PartialType(CreateSubGroupDto) {
  @ApiPropertyOptional({ example: "507f1f77bcf86cd799439011" })
  @IsOptional()
  @IsString()
  groupId?: string;
}
