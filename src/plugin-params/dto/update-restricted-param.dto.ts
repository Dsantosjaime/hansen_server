import { PartialType } from "@nestjs/mapped-types";
import { CreateRestrictedParamDto } from "./create-restricted-param.dto";

export class UpdateRestrictedParamDto extends PartialType(
  CreateRestrictedParamDto,
) {}
