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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const prismaNamespace_1 = require("../../generated/prisma/internal/prismaNamespace");
const users_services_1 = require("../keycloak/users.services");
let UsersService = class UsersService {
    prisma;
    keycloakAdminUsers;
    constructor(prisma, keycloakAdminUsers) {
        this.prisma = prisma;
        this.keycloakAdminUsers = keycloakAdminUsers;
    }
    async safeDeleteKeycloakUser(keycloakUserId) {
        await this.keycloakAdminUsers
            .deleteUser(keycloakUserId)
            .catch(() => undefined);
    }
    async getUsers() {
        return this.prisma.user.findMany({
            include: { role: true },
        });
    }
    async createUserWithRole(name, temporaryPassword, roleId, email) {
        const kcUser = await this.keycloakAdminUsers.createUser(name, email, temporaryPassword);
        if (!kcUser?.id) {
            throw new Error("Keycloak user id missing after creation");
        }
        try {
            return await this.prisma.user.create({
                data: {
                    keycloakId: kcUser.id,
                    email: email ?? null,
                    name: name ?? null,
                    role: { connect: { id: roleId } },
                },
                include: { role: true },
            });
        }
        catch (e) {
            await this.safeDeleteKeycloakUser(kcUser.id);
            throw e;
        }
    }
    async updateUser(userId, input) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`User ${userId} not found`);
        }
        if (input.email !== undefined || input.name !== undefined) {
            await this.keycloakAdminUsers.updateUser(existing.keycloakId, {
                email: input.email ?? undefined,
                name: input.name ?? undefined,
            });
        }
        if (input.temporaryPassword) {
            await this.keycloakAdminUsers.setTemporaryPassword(existing.keycloakId, input.temporaryPassword);
        }
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(input.email !== undefined ? { email: input.email } : {}),
                ...(input.name !== undefined ? { name: input.name } : {}),
                ...(input.roleId ? { role: { connect: { id: input.roleId } } } : {}),
            },
            include: { role: true },
        });
    }
    async deleteUser(userId) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`User ${userId} not found`);
        }
        await this.keycloakAdminUsers.deleteUser(existing.keycloakId);
        return this.prisma.user.delete({
            where: { id: userId },
            include: { role: true },
        });
    }
    async updateFromKeycloak(payload) {
        try {
            return await this.prisma.user.update({
                where: { keycloakId: payload.sub },
                data: {
                    email: payload.email ?? null,
                    name: payload.name ?? payload.preferred_username ?? null,
                },
                include: { role: true },
            });
        }
        catch (err) {
            if (err instanceof prismaNamespace_1.PrismaClientKnownRequestError) {
                throw new common_1.NotFoundException(`User with keycloakId=${payload.sub} not found (must be created via API before syncing from Keycloak).`);
            }
            throw err;
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_services_1.KeycloakAdminUsersService])
], UsersService);
//# sourceMappingURL=users.service.js.map