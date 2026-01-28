"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionGroupModule = void 0;
const common_1 = require("@nestjs/common");
const permissionGroup_controller_1 = require("./permissionGroup.controller");
const permissionGroup_service_1 = require("./permissionGroup.service");
let PermissionGroupModule = class PermissionGroupModule {
};
exports.PermissionGroupModule = PermissionGroupModule;
exports.PermissionGroupModule = PermissionGroupModule = __decorate([
    (0, common_1.Module)({
        controllers: [permissionGroup_controller_1.PermissionGroupController],
        providers: [permissionGroup_service_1.PermissionGroupService],
        exports: [permissionGroup_service_1.PermissionGroupService],
    })
], PermissionGroupModule);
//# sourceMappingURL=permissionGroup.module.js.map