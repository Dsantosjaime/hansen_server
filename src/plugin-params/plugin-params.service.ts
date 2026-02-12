import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateRestrictedParamDto } from "./dto/create-restricted-param.dto";
import { UpdateRestrictedParamDto } from "./dto/update-restricted-param.dto";
import { PluginRestrictedParamType } from "generated/prisma/enums";
import { PluginParam } from "generated/prisma/client";

@Injectable()
export class PluginParamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRestrictedParamDto): Promise<PluginParam> {
    return this.prisma.pluginParam.create({
      data: {
        name: dto.name,
        type: dto.type,
      },
    });
  }

  async findAll(query?: {
    type?: PluginRestrictedParamType;
    name?: string;
  }): Promise<PluginParam[]> {
    return this.prisma.pluginParam.findMany({
      where: {
        type: query?.type,
        name: query?.name
          ? { contains: query.name, mode: "insensitive" }
          : undefined,
      },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string): Promise<PluginParam> {
    const item = await this.prisma.pluginParam.findUnique({
      where: { id },
    });

    if (!item) throw new NotFoundException(`RestrictedParam not found: ${id}`);
    return item;
  }

  async update(
    id: string,
    dto: UpdateRestrictedParamDto,
  ): Promise<PluginParam> {
    await this.findOne(id);

    return this.prisma.pluginParam.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
      },
    });
  }

  async remove(id: string): Promise<PluginParam> {
    await this.findOne(id);
    return this.prisma.pluginParam.delete({ where: { id } });
  }
}
