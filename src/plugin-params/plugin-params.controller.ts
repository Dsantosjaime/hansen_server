import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PluginParamsService } from "./plugin-params.service";
import { CreateRestrictedParamDto } from "./dto/create-restricted-param.dto";
import { UpdateRestrictedParamDto } from "./dto/update-restricted-param.dto";
import { PluginRestrictedParamType } from "generated/prisma/enums";
import { CheckAbilities } from "@/casl/check-abilities.decorator";
import { JwtAuthGuard } from "@/auth/jwt-auth.guard";
import { CaslGuard } from "@/casl/casl.guard";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags("plugin-params")
@ApiBearerAuth("jwt")
@Controller("plugin-params")
@UseGuards(JwtAuthGuard, CaslGuard)
export class PluginParamsController {
  constructor(private readonly service: PluginParamsService) {}

  @Post()
  @CheckAbilities({ action: "create", subject: "PluginParam" })
  create(@Body() dto: CreateRestrictedParamDto) {
    return this.service.create(dto);
  }

  @Get()
  @CheckAbilities({ action: "read", subject: "PluginParam" })
  findAll(
    @Query("type") type?: PluginRestrictedParamType,
    @Query("name") name?: string,
  ) {
    return this.service.findAll({ type, name });
  }

  @Get(":id")
  @CheckAbilities({ action: "read", subject: "PluginParam" })
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @CheckAbilities({ action: "update", subject: "PluginParam" })
  update(@Param("id") id: string, @Body() dto: UpdateRestrictedParamDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @CheckAbilities({ action: "delete", subject: "PluginParam" })
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
