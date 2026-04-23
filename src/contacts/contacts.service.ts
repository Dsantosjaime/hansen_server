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
import { ContactEmailStatus, Prisma } from "generated/prisma/client";
import { ContactStatus } from "./type/contact-status.enum";
import { BulkDeleteContactsDto } from "./dto/bulk-delete-contacts.dto";

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brevo: BrevoMarketingService,
    private readonly subGroupsService: SubGroupsService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

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

    await this.brevo.upsertContact({
      email: c.email,
      attributes: this.toBrevoAttributes(c),
    });
  }

  private deleteBrevoContactsBestEffort(emails: string[]) {
    for (const email of emails) {
      this.brevo.deleteBrevoContactByEmail(email).catch((e) => {
        this.logger.warn(`Brevo delete contact failed for ${email}: ${e}`);
      });
    }
  }

  async create(dto: CreateContactDto) {
    await this.assertGroupAndSubGroup(dto.groupId, dto.subGroupId);

    const normalizedEmail = this.normalizeEmail(dto.email);

    try {
      const created = await this.prisma.contact.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          function: dto.function,
          status: dto.status ?? ContactStatus.NO_EXCHANGE,
          emailStatus: ContactEmailStatus.PAS_D_ENVOI,
          emailStatusReason: null,
          emailStatusUpdatedAt: null,
          email: normalizedEmail,
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
    status?: ContactStatus;
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

    const normalizedEmail =
      dto.email !== undefined ? this.normalizeEmail(dto.email) : existing.email;
    const emailChanged = normalizedEmail !== existing.email;

    try {
      const updated = await this.prisma.contact.update({
        where: { id },
        data: {
          ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
          ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
          ...(dto.function !== undefined ? { function: dto.function } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.email !== undefined ? { email: normalizedEmail } : {}),
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
          ...(emailChanged
            ? {
                emailStatus: ContactEmailStatus.PAS_D_ENVOI,
                emailStatusReason: null,
                emailStatusUpdatedAt: null,
              }
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

    this.deleteBrevoContactsBestEffort([existing.email]);

    return deleted;
  }

  /**
   * ✅ NEW: suppression massive (DB + best-effort Brevo)
   */
  async bulkRemove(dto: BulkDeleteContactsDto) {
    const ids = [...new Set((dto.ids ?? []).filter(Boolean))];

    if (!ids.length) {
      return {
        requestedCount: 0,
        foundCount: 0,
        deletedCount: 0,
        notFoundIds: [],
      };
    }

    const found = await this.prisma.contact.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true },
    });

    const foundIds = new Set(found.map((c) => c.id));
    const notFoundIds = ids.filter((id) => !foundIds.has(id));

    const res = await this.prisma.contact.deleteMany({
      where: { id: { in: ids } },
    });

    this.deleteBrevoContactsBestEffort(found.map((c) => c.email));

    return {
      requestedCount: ids.length,
      foundCount: found.length,
      deletedCount: res.count,
      notFoundIds,
    };
  }

  async upsertFromScrap(input: {
    email: string;
    firstName: string;
    lastName: string;
    function: string;
    status: ContactStatus;
    groupId: string;
    subGroupId: string;
  }) {
    await this.assertGroupAndSubGroup(input.groupId, input.subGroupId);

    const normalizedEmail = this.normalizeEmail(input.email);

    return this.prisma.contact.upsert({
      where: { email: normalizedEmail },
      create: {
        firstName: input.firstName,
        lastName: input.lastName,
        function: input.function,
        status: input.status,
        emailStatus: ContactEmailStatus.PAS_D_ENVOI,
        emailStatusReason: null,
        emailStatusUpdatedAt: null,
        email: normalizedEmail,
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
      ...new Set((emails ?? []).map((e) => this.normalizeEmail(e))),
    ].filter(Boolean);

    if (!unique.length) return new Set();

    const rows = await this.prisma.contact.findMany({
      where: { email: { in: unique } },
      select: { email: true },
    });

    return new Set(rows.map((r) => this.normalizeEmail(r.email)));
  }

  async findByGroupSubGroupPairs(
    input: {
      pairs: { groupId: string; subGroupId: string }[];
      status?: ContactStatus;
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
