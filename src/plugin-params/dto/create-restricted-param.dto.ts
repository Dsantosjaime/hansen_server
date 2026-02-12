import { IsEnum, IsString, MinLength } from "class-validator";
import { PluginRestrictedParamType } from "generated/prisma/enums";

export class CreateRestrictedParamDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(PluginRestrictedParamType)
  type!: PluginRestrictedParamType;
}
