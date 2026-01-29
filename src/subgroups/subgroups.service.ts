import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateSubGroupDto } from "./dto/create-sub-group.dto";
import { UpdateSubGroupDto } from "./dto/update-sub-group.dto";

@Injectable()
export class SubGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertGroupExists(groupId: string) {
    const exists = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!exists) throw new NotFoundException(`Group ${groupId} not found`);
  }

  async create(dto: CreateSubGroupDto) {
    await this.assertGroupExists(dto.groupId);

    return this.prisma.subGroup.create({
      data: {
        name: dto.name,
        group: { connect: { id: dto.groupId } },
      },
      include: { group: true },
    });
  }

  async findAll(groupId?: string) {
    return this.prisma.subGroup.findMany({
      where: groupId ? { groupId } : undefined,
      orderBy: { name: "asc" },
      include: { group: true },
    });
  }

  async findOne(id: string) {
    const sub = await this.prisma.subGroup.findUnique({
      where: { id },
      include: { group: true },
    });
    if (!sub) throw new NotFoundException(`SubGroup ${id} not found`);
    return sub;
  }

  async update(id: string, dto: UpdateSubGroupDto) {
    await this.findOne(id);

    if (dto.groupId !== undefined) {
      await this.assertGroupExists(dto.groupId);
    }

    return this.prisma.subGroup.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.groupId ? { group: { connect: { id: dto.groupId } } } : {}),
      },
      include: { group: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.subGroup.delete({
      where: { id },
      include: { group: true },
    });
  }
}
