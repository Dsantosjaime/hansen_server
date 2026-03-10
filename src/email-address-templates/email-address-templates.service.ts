import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { UpdateEmailAddressTemplateDto } from "./dto/update-email-address-template.dto";
import { CreateEmailAddressTemplateDto } from "./dto/create-email-address-template.dto";

@Injectable()
export class EmailAddressTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private assertValidPattern(pattern: string) {
    const tokenRe = /\{(first|last)(?::(\d+))?\}/g;

    // 1) tous les tokens doivent être valides
    const tokens = pattern.match(/\{[^}]+\}/g) ?? [];
    for (const t of tokens) {
      if (!t.match(/^\{(first|last)(?::\d+)?\}$/)) {
        throw new BadRequestException(
          `Invalid pattern token "${t}". Allowed: {first}, {last}, {first:N}, {last:N}`,
        );
      }
    }

    // 2) au moins un token first/last doit exister (sinon pattern inutile)
    if (!tokenRe.test(pattern)) {
      throw new BadRequestException(
        "Invalid pattern: must contain at least one token {first} or {last}.",
      );
    }
  }

  async create(dto: CreateEmailAddressTemplateDto) {
    this.assertValidPattern(dto.pattern);

    return this.prisma.emailAddressTemplate.create({
      data: {
        name: dto.name,
        pattern: dto.pattern,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(args?: { activeOnly?: boolean }) {
    return this.prisma.emailAddressTemplate.findMany({
      where: args?.activeOnly ? { isActive: true } : undefined,
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const tpl = await this.prisma.emailAddressTemplate.findUnique({
      where: { id },
    });
    if (!tpl)
      throw new NotFoundException(`EmailAddressTemplate ${id} not found`);
    return tpl;
  }

  async update(id: string, dto: UpdateEmailAddressTemplateDto) {
    await this.findOne(id);

    if (dto.pattern !== undefined) this.assertValidPattern(dto.pattern);

    return this.prisma.emailAddressTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.pattern !== undefined ? { pattern: dto.pattern } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.emailAddressTemplate.delete({
      where: { id },
    });
  }
}
