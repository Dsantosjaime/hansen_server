"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const permissions_util_1 = require("../auth/permissions.util");
const brevo_marketing_service_1 = require("../brevo/brevo-marketing.service");
let RoleService = class RoleService {
    prisma;
    brevoMarketing;
    constructor(prisma, brevoMarketing) {
        this.prisma = prisma;
        this.brevoMarketing = brevoMarketing;
    }
    async create(dto) {
        return this.prisma.role.create({
            data: {
                name: dto.name,
                permissions: dto.permissions,
            },
        });
    }
    async findAll() {
        return this.prisma.role.findMany({
            orderBy: { name: "asc" },
        });
    }
    async findOne(id) {
        const role = await this.prisma.role.findUnique({ where: { id } });
        if (!role)
            throw new common_1.NotFoundException(`Role ${id} not found`);
        return role;
    }
    async update(id, dto) {
        const before = await this.findOne(id);
        const updated = await this.prisma.role.update({
            where: { id },
            data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.permissions !== undefined
                    ? { permissions: dto.permissions }
                    : {}),
            },
        });
        if (dto.permissions === undefined)
            return updated;
        const beforeCanCreateEmail = (0, permissions_util_1.hasPermission)(before, "Email", "create");
        const afterCanCreateEmail = (0, permissions_util_1.hasPermission)(updated, "Email", "create");
        if (beforeCanCreateEmail === afterCanCreateEmail) {
            return updated;
        }
        const users = await this.prisma.user.findMany({
            where: { roleId: updated.id },
            select: { id: true, email: true, name: true, brevoSenderId: true },
        });
        if (!beforeCanCreateEmail && afterCanCreateEmail) {
            for (const u of users) {
                if (u.brevoSenderId)
                    continue;
                if (!u.email)
                    continue;
                const senderId = await this.brevoMarketing
                    .createSender({ name: u.name ?? u.email, email: u.email })
                    .catch(() => null);
                if (senderId) {
                    await this.prisma.user.update({
                        where: { id: u.id },
                        data: { brevoSenderId: senderId },
                    });
                }
            }
        }
        if (beforeCanCreateEmail && !afterCanCreateEmail) {
            for (const u of users) {
                if (!u.brevoSenderId)
                    continue;
                await this.brevoMarketing
                    .deleteSender(u.brevoSenderId)
                    .catch(() => undefined);
                await this.prisma.user.update({
                    where: { id: u.id },
                    data: { brevoSenderId: null },
                });
            }
        }
        return updated;
    }
    async remove(id) {
        const toRemove = await this.findOne(id);
        if (toRemove.isSystem) {
            throw new common_1.ForbiddenException("Ce rôle système ne peut pas être supprimé.");
        }
        return this.prisma.role.delete({
            where: { id },
        });
    }
};
exports.RoleService = RoleService;
exports.RoleService = RoleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        brevo_marketing_service_1.BrevoMarketingService])
], RoleService);
//# sourceMappingURL=role.service.js.map