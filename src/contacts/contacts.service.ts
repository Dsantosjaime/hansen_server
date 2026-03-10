import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { PrismaClientKnownRequestError } from "generated/prisma/internal/prismaNamespace";
import { BrevoMarketingService } from "@/brevo/brevo-marketing.service";
import { SubGroupsService } from "@/subgroups/subgroups.service";
import { Prisma } from "generated/prisma/client";

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brevo: BrevoMarketingService,
    private readonly subGroupsService: SubGroupsService,
  ) {}

  public async assertGroupAndSubGroup(groupId: string, subGroupId: string) {
    return this.subGroupsService.assertGroupAndSubGroup(groupId, subGroupId);
  }

  private toBrevoAttributes(contact: {
    firstName: string;
    lastName: string;
    function: string;
    status: string;
    phoneNumber: string[];
  }) {
    return {
      FIRSTNAME: contact.firstName,
      LASTNAME: contact.lastName,
      FUNCTION: contact.function,
      STATUS: contact.status,
      PHONE: (contact.phoneNumber ?? []).join(" / "),
    };
  }

  private async syncContactToBrevo(contactId: string) {
    const c = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });
    if (!c) return;

    const listId = await this.brevo.ensureBrevoListForSubGroup(c.subGroupId);

    await this.brevo.upsertContactToList({
      email: c.email,
      listId,
      attributes: this.toBrevoAttributes(c),
    });
  }

  async create(dto: CreateContactDto) {
    await this.assertGroupAndSubGroup(dto.groupId, dto.subGroupId);

    try {
      const created = await this.prisma.contact.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          function: dto.function,
          status: dto.status,
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          lastContact: dto.lastContact,
          lastEmail: dto.lastEmail,
          groupId: dto.groupId,
          subGroupId: dto.subGroupId,
        },
      });

      this.syncContactToBrevo(created.id).catch((e) => {
        this.logger.warn(
          `Brevo sync failed after create for contact=${created.id}: ${e}`,
        );
      });

      return created;
    } catch (err) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ConflictException("Email already exists");
      }
      throw err;
    }
  }

  async findAll(filters?: {
    groupId?: string;
    subGroupId?: string;
    status?: string;
  }) {
    return this.prisma.contact.findMany({
      where: {
        ...(filters?.groupId ? { groupId: filters.groupId } : {}),
        ...(filters?.subGroupId ? { subGroupId: filters.subGroupId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    return contact;
  }

  async update(id: string, dto: UpdateContactDto) {
    const existing = await this.findOne(id);

    const nextGroupId = dto.groupId ?? existing.groupId;
    const nextSubGroupId = dto.subGroupId ?? existing.subGroupId;

    if (dto.groupId !== undefined || dto.subGroupId !== undefined) {
      await this.assertGroupAndSubGroup(nextGroupId, nextSubGroupId);
    }

    try {
      const updated = await this.prisma.contact.update({
        where: { id },
        data: {
          ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
          ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
          ...(dto.function !== undefined ? { function: dto.function } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.email !== undefined ? { email: dto.email } : {}),
          ...(dto.phoneNumber !== undefined
            ? { phoneNumber: dto.phoneNumber }
            : {}),
          ...(dto.lastContact !== undefined
            ? { lastContact: dto.lastContact }
            : {}),
          ...(dto.lastEmail !== undefined ? { lastEmail: dto.lastEmail } : {}),
          ...(dto.groupId !== undefined ? { groupId: dto.groupId } : {}),
          ...(dto.subGroupId !== undefined
            ? { subGroupId: dto.subGroupId }
            : {}),
        },
      });

      if (existing.email !== updated.email) {
        this.brevo.deleteBrevoContactByEmail(existing.email).catch((e) => {
          this.logger.warn(`Brevo delete old email failed: ${e}`);
        });
      }

      this.syncContactToBrevo(updated.id).catch((e) => {
        this.logger.warn(
          `Brevo sync failed after update for contact=${updated.id}: ${e}`,
        );
      });

      return updated;
    } catch (err) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ConflictException("Email already exists");
      }
      throw err;
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);

    const deleted = await this.prisma.contact.delete({ where: { id } });

    this.brevo
      .ensureBrevoListForSubGroup(existing.subGroupId)
      .then((listId) =>
        this.brevo.removeEmailsFromList(listId, [existing.email]),
      )
      .catch((e) => this.logger.warn(`Brevo remove from list failed: ${e}`));

    this.brevo
      .deleteBrevoContactByEmail(existing.email)
      .catch((e) => this.logger.warn(`Brevo delete contact failed: ${e}`));

    return deleted;
  }

  async upsertFromScrap(input: {
    email: string;
    firstName: string;
    lastName: string;
    function: string;
    status: string;
    groupId: string;
    subGroupId: string;
  }) {
    await this.assertGroupAndSubGroup(input.groupId, input.subGroupId);

    return this.prisma.contact.upsert({
      where: { email: input.email },
      create: {
        firstName: input.firstName,
        lastName: input.lastName,
        function: input.function,
        status: input.status,
        email: input.email,
        phoneNumber: [],
        lastContact: "",
        lastEmail: "",
        groupId: input.groupId,
        subGroupId: input.subGroupId,
      },
      update: {
        firstName: input.firstName,
        lastName: input.lastName,
        function: input.function,
        status: input.status,
        groupId: input.groupId,
        subGroupId: input.subGroupId,
      },
    });
  }

  async findExistingEmails(emails: string[]): Promise<Set<string>> {
    const unique = [
      ...new Set((emails ?? []).map((e) => e.trim().toLowerCase())),
    ].filter(Boolean);

    if (!unique.length) return new Set();

    const rows = await this.prisma.contact.findMany({
      where: { email: { in: unique } },
      select: { email: true },
    });

    return new Set(rows.map((r) => r.email.trim().toLowerCase()));
  }

  async findByGroupSubGroupPairs(
    input: {
      pairs: { groupId: string; subGroupId: string }[];
      status?: string;
    },
    options?: {
      select?: Prisma.ContactSelect;
    },
  ) {
    if (!input.pairs?.length) return [];

    const select: Prisma.ContactSelect = options?.select
      ? { ...options.select, groupId: true, subGroupId: true }
      : {
          groupId: true,
          subGroupId: true,
          lastName: true,
          function: true,
          email: true,
        };

    return this.prisma.contact.findMany({
      where: {
        ...(input.status ? { status: input.status } : {}),
        OR: input.pairs.map((p) => ({
          groupId: p.groupId,
          subGroupId: p.subGroupId,
        })),
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select,
    });
  }
}
