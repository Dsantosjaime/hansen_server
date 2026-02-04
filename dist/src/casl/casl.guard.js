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
exports.CaslGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const check_abilities_decorator_1 = require("./check-abilities.decorator");
const casl_ability_factory_1 = require("./casl-ability.factory");
const users_service_1 = require("../users/users.service");
let CaslGuard = class CaslGuard {
    reflector;
    caslAbilityFactory;
    usersService;
    constructor(reflector, caslAbilityFactory, usersService) {
        this.reflector = reflector;
        this.caslAbilityFactory = caslAbilityFactory;
        this.usersService = usersService;
    }
    async canActivate(context) {
        const required = this.reflector.getAllAndOverride(check_abilities_decorator_1.CHECK_ABILITIES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]) ?? [];
        console.log("CASL Guard");
        const req = context.switchToHttp().getRequest();
        const kcUser = req.user;
        if (!kcUser?.sub)
            throw new common_1.ForbiddenException("Missing user");
        console.log("CASL Guard");
        const dbUser = await this.usersService.updateFromKeycloak(kcUser);
        console.log("CASL Guard", dbUser);
        if (!dbUser?.role?.permissions) {
            throw new common_1.NotFoundException(`User with keycloakId=${kcUser?.sub} don't have any permission`);
        }
        const realmRoles = kcUser.realm_access?.roles ?? [];
        const isSuperAdmin = realmRoles.includes("super_admin");
        const ability = this.caslAbilityFactory.createFor({
            isSuperAdmin,
            permissions: dbUser?.role?.permissions,
        });
        for (const r of required) {
            if (!ability.can(r.action, r.subject)) {
                throw new common_1.ForbiddenException("Forbidden by CASL");
            }
        }
        req.dbUser = dbUser;
        return true;
    }
};
exports.CaslGuard = CaslGuard;
exports.CaslGuard = CaslGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        casl_ability_factory_1.CaslAbilityFactory,
        users_service_1.UsersService])
], CaslGuard);
//# sourceMappingURL=casl.guard.js.map