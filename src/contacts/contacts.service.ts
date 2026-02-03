/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { PrismaClientKnownRequestError } from "generated/prisma/internal/prismaNamespace";
import { BrevoMarketingService } from "src/brevo/brevo-marketing.service";

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brevo: BrevoMarketingService,
  ) {}

  private async assertGroupAndSubGroup(groupId: string, subGroupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException(`Group ${groupId} not found`);

    const subGroup = await this.prisma.subGroup.findUnique({
      where: { id: subGroupId },
    });
    if (!subGroup)
      throw new NotFoundException(`SubGroup ${subGroupId} not found`);

    if (subGroup.groupId !== groupId) {
      throw new BadRequestException(
        `SubGroup ${subGroupId} does not belong to Group ${groupId}`,
      );
    }
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
          `Brevo sync failed after create for contact=${created.id}: ${e?.message ?? e}`,
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
        },
      });

      if (existing.email !== updated.email) {
        this.brevo.deleteBrevoContactByEmail(existing.email).catch((e) => {
          this.logger.warn(`Brevo delete old email failed: ${e?.message ?? e}`);
        });
      }

      // Upsert dans la nouvelle list
      this.syncContactToBrevo(updated.id).catch((e) => {
        this.logger.warn(
          `Brevo sync failed after update for contact=${updated.id}: ${e?.message ?? e}`,
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

    // Optionnel: retirer de la liste + supprimer le contact Brevo
    this.brevo
      .ensureBrevoListForSubGroup(existing.subGroupId)
      .then((listId) =>
        this.brevo.removeEmailsFromList(listId, [existing.email]),
      )
      .catch((e) =>
        this.logger.warn(`Brevo remove from list failed: ${e?.message ?? e}`),
      );

    this.brevo
      .deleteBrevoContactByEmail(existing.email)
      .catch((e) =>
        this.logger.warn(`Brevo delete contact failed: ${e?.message ?? e}`),
      );

    return deleted;
  }
}
