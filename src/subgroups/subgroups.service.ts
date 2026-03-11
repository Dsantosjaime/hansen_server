import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateSubGroupDto } from "./dto/create-sub-group.dto";
import { UpdateSubGroupDto } from "./dto/update-sub-group.dto";
import { BrevoMarketingService } from "@/brevo/brevo-marketing.service";
import { GroupsService } from "src/groups/groups.service";

@Injectable()
export class SubGroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brevoMarketing: BrevoMarketingService,
    private readonly groupsService: GroupsService,
  ) {}

  async assertGroupAndSubGroup(groupId: string, subGroupId: string) {
    await this.groupsService.assertExists(groupId);

    const subGroup = await this.prisma.subGroup.findUnique({
      where: { id: subGroupId },
      select: { id: true, groupId: true },
    });

    if (!subGroup) {
      throw new NotFoundException(`SubGroup ${subGroupId} not found`);
    }

    if (subGroup.groupId !== groupId) {
      throw new BadRequestException(
        `SubGroup ${subGroupId} does not belong to Group ${groupId}`,
      );
    }
  }

  private async assertGroupExists(groupId: string) {
    await this.groupsService.assertExists(groupId);
  }

  async create(dto: CreateSubGroupDto) {
    await this.assertGroupExists(dto.groupId);

    const created = await this.prisma.subGroup.create({
      data: {
        name: dto.name,
        group: { connect: { id: dto.groupId } },
      },
      include: { group: true },
    });

    await this.brevoMarketing.ensureBrevoListForSubGroup(created.id);

    return this.prisma.subGroup.findUnique({
      where: { id: created.id },
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

    const [, deletedSubGroup] = await this.prisma.$transaction([
      this.prisma.contact.deleteMany({ where: { subGroupId: id } }),
      this.prisma.subGroup.delete({ where: { id }, include: { group: true } }),
    ]);

    return deletedSubGroup;
  }
}
