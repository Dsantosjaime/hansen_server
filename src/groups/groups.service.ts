import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGroupDto) {
    return this.prisma.group.create({
      data: { name: dto.name },
    });
  }

  async findAll() {
    return this.prisma.group.findMany({
      orderBy: { name: "asc" },
      include: { subGroups: true },
    });
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: { subGroups: true },
    });
    if (!group) throw new NotFoundException(`Group ${id} not found`);
    return group;
  }

  async update(id: string, dto: UpdateGroupDto) {
    await this.findOne(id);

    return this.prisma.group.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
      },
      include: { subGroups: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.subGroup.deleteMany({
      where: { groupId: id },
    });

    return this.prisma.group.delete({
      where: { id },
      include: { subGroups: true },
    });
  }
}
