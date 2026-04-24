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
import { buildEmailFromTemplate } from "@/common/email/email-address.util";
import { BulkUpdateContactEmailsDto } from "./dto/bulk-update-email-contacts.dto";

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

  private formatError(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    try {
      return JSON.stringify(err);
    } catch {
      return "unknown error";
    }
  }

  private chunkArray<T>(items: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      out.push(items.slice(i, i + size));
    }
    return out;
  }

  private buildEmailUpdateData(args: {
    currentEmail: string;
    nextEmail?: string;
  }): Prisma.ContactUpdateInput {
    if (args.nextEmail === undefined) {
      return {};
    }

    const normalizedEmail = this.normalizeEmail(args.nextEmail);
    const emailChanged = normalizedEmail !== args.currentEmail;

    return {
      email: normalizedEmail,
      ...(emailChanged
        ? {
            emailStatus: ContactEmailStatus.PAS_D_ENVOI,
            emailStatusReason: null,
            emailStatusUpdatedAt: null,
          }
        : {}),
    };
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

    const nextEmail =
      dto.email !== undefined ? this.normalizeEmail(dto.email) : existing.email;
    const emailChanged = nextEmail !== existing.email;

    const emailPatch = this.buildEmailUpdateData({
      currentEmail: existing.email,
      nextEmail: dto.email,
    });

    try {
      const updated = await this.prisma.contact.update({
        where: { id },
        data: {
          ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
          ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
          ...(dto.function !== undefined ? { function: dto.function } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...emailPatch,
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

      if (emailChanged) {
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

  async bulkUpdateEmailsFromTemplate(dto: BulkUpdateContactEmailsDto) {
    const ids = [...new Set((dto.ids ?? []).filter(Boolean))];

    if (!ids.length) {
      return {
        requestedCount: 0,
        foundCount: 0,
        updatedCount: 0,
        unchangedCount: 0,
        invalidCount: 0,
        conflictCount: 0,
        errorCount: 0,
        notFoundIds: [],
        items: [],
      };
    }

    const found = await this.prisma.contact.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    const foundIds = new Set(found.map((c) => c.id));
    const notFoundIds = ids.filter((id) => !foundIds.has(id));

    const generated = found.map((contact) => {
      const nextEmail = this.normalizeEmail(
        buildEmailFromTemplate({
          firstName: contact.firstName,
          lastName: contact.lastName,
          domain: dto.domain,
          extension: dto.extension,
          pattern: dto.pattern,
        }) ?? "",
      );

      return {
        id: contact.id,
        oldEmail: contact.email,
        newEmail: nextEmail,
        reason: null as string | null,
      };
    });

    for (const item of generated) {
      if (!item.newEmail) {
        item.reason = "generated_email_empty";
      }
    }

    const emailToItems = new Map<string, typeof generated>();
    for (const item of generated) {
      if (!item.newEmail) continue;
      const arr = emailToItems.get(item.newEmail) ?? [];
      arr.push(item);
      emailToItems.set(item.newEmail, arr);
    }

    for (const [, items] of emailToItems) {
      if (items.length > 1) {
        for (const item of items) {
          item.reason = "duplicate_generated_email_in_selection";
        }
      }
    }

    const candidateEmails = [
      ...new Set(generated.filter((x) => !x.reason).map((x) => x.newEmail)),
    ];

    if (candidateEmails.length) {
      const existingContacts = await this.prisma.contact.findMany({
        where: {
          email: { in: candidateEmails },
        },
        select: {
          id: true,
          email: true,
        },
      });

      const existingByEmail = new Map(
        existingContacts.map((c) => [c.email, c]),
      );

      for (const item of generated) {
        if (item.reason || !item.newEmail) continue;

        const existing = existingByEmail.get(item.newEmail);
        if (existing && existing.id !== item.id) {
          item.reason = "email_already_used_by_another_contact";
        }
      }
    }

    const items: Array<{
      id: string;
      oldEmail: string;
      newEmail: string;
      updated: boolean;
      reason?: string | null;
    }> = [];

    let updatedCount = 0;
    let unchangedCount = 0;
    let invalidCount = 0;
    let conflictCount = 0;
    let errorCount = 0;

    const updatableItems = generated.filter((item) => !item.reason);
    const itemsToActuallyUpdate = updatableItems.filter(
      (item) => item.oldEmail !== item.newEmail,
    );
    const unchangedItems = updatableItems.filter(
      (item) => item.oldEmail === item.newEmail,
    );

    for (const item of generated) {
      if (item.reason === "generated_email_empty") {
        invalidCount += 1;
        items.push({
          id: item.id,
          oldEmail: item.oldEmail,
          newEmail: item.newEmail,
          updated: false,
          reason: item.reason,
        });
      } else if (
        item.reason === "duplicate_generated_email_in_selection" ||
        item.reason === "email_already_used_by_another_contact"
      ) {
        conflictCount += 1;
        items.push({
          id: item.id,
          oldEmail: item.oldEmail,
          newEmail: item.newEmail,
          updated: false,
          reason: item.reason,
        });
      }
    }

    for (const item of unchangedItems) {
      unchangedCount += 1;
      items.push({
        id: item.id,
        oldEmail: item.oldEmail,
        newEmail: item.newEmail,
        updated: false,
        reason: "unchanged",
      });
    }

    const chunks = this.chunkArray(itemsToActuallyUpdate, 100);

    for (const chunk of chunks) {
      try {
        await this.prisma.$transaction(
          chunk.map((item) =>
            this.prisma.contact.update({
              where: { id: item.id },
              data: this.buildEmailUpdateData({
                currentEmail: item.oldEmail,
                nextEmail: item.newEmail,
              }),
            }),
          ),
        );

        for (const item of chunk) {
          updatedCount += 1;

          items.push({
            id: item.id,
            oldEmail: item.oldEmail,
            newEmail: item.newEmail,
            updated: true,
            reason: null,
          });

          this.brevo.deleteBrevoContactByEmail(item.oldEmail).catch((e) => {
            this.logger.warn(`Brevo delete old email failed: ${e}`);
          });

          this.syncContactToBrevo(item.id).catch((e) => {
            this.logger.warn(
              `Brevo sync failed after bulk email update for contact=${item.id}: ${e}`,
            );
          });
        }
      } catch (chunkError: unknown) {
        this.logger.warn(
          `Bulk chunk email update failed, fallback to per-contact updates: ${this.formatError(chunkError)}`,
        );

        for (const item of chunk) {
          try {
            await this.prisma.contact.update({
              where: { id: item.id },
              data: this.buildEmailUpdateData({
                currentEmail: item.oldEmail,
                nextEmail: item.newEmail,
              }),
            });

            updatedCount += 1;

            items.push({
              id: item.id,
              oldEmail: item.oldEmail,
              newEmail: item.newEmail,
              updated: true,
              reason: null,
            });

            this.brevo.deleteBrevoContactByEmail(item.oldEmail).catch((e) => {
              this.logger.warn(`Brevo delete old email failed: ${e}`);
            });

            this.syncContactToBrevo(item.id).catch((e) => {
              this.logger.warn(
                `Brevo sync failed after bulk email update for contact=${item.id}: ${e}`,
              );
            });
          } catch (err: unknown) {
            if (
              err instanceof PrismaClientKnownRequestError &&
              err.code === "P2002"
            ) {
              conflictCount += 1;
              items.push({
                id: item.id,
                oldEmail: item.oldEmail,
                newEmail: item.newEmail,
                updated: false,
                reason: "email_already_exists",
              });
              continue;
            }

            errorCount += 1;
            this.logger.warn(
              `Bulk update email failed for contact=${item.id} email=${item.newEmail}: ${this.formatError(err)}`,
            );

            items.push({
              id: item.id,
              oldEmail: item.oldEmail,
              newEmail: item.newEmail,
              updated: false,
              reason: "unexpected_error",
            });
          }
        }
      }
    }

    return {
      requestedCount: ids.length,
      foundCount: found.length,
      updatedCount,
      unchangedCount,
      invalidCount,
      conflictCount,
      errorCount,
      notFoundIds,
      items,
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
