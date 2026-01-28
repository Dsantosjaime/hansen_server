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
exports.PermissionGroupController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const permissionGroup_service_1 = require("./permissionGroup.service");
const casl_guard_1 = require("../casl/casl.guard");
const check_abilities_decorator_1 = require("../casl/check-abilities.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let PermissionGroupController = class PermissionGroupController {
    permissionGroupService;
    constructor(permissionGroupService) {
        this.permissionGroupService = permissionGroupService;
    }
    async getPermissionGroups() {
        return this.permissionGroupService.getPermissionGroups();
    }
};
exports.PermissionGroupController = PermissionGroupController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Recuperer les groupes de permission',
    }),
    (0, check_abilities_decorator_1.CheckAbilities)({ action: 'read', subject: 'PermissionGroup' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionGroupController.prototype, "getPermissionGroups", null);
exports.PermissionGroupController = PermissionGroupController = __decorate([
    (0, swagger_1.ApiTags)('permissionGroup'),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, common_1.Controller)('permission-groups'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, casl_guard_1.CaslGuard),
    __metadata("design:paramtypes", [permissionGroup_service_1.PermissionGroupService])
], PermissionGroupController);
//# sourceMappingURL=permissionGroup.controller.js.map