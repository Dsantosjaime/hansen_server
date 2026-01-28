"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaslAbilityFactory = void 0;
const common_1 = require("@nestjs/common");
const ability_1 = require("@casl/ability");
const ALLOWED_ACTIONS = [
    'manage',
    'create',
    'read',
    'update',
    'delete',
    'copy',
];
const ALLOWED_SUBJECTS = ['all', 'Post', 'User', 'Role'];
function isAllowedAction(a) {
    return ALLOWED_ACTIONS.includes(a);
}
function isAllowedSubject(s) {
    return ALLOWED_SUBJECTS.includes(s);
}
let CaslAbilityFactory = class CaslAbilityFactory {
    createFor(user) {
        const { can, build } = new ability_1.AbilityBuilder(ability_1.createMongoAbility);
        if (user.isSuperAdmin) {
            can('manage', 'all');
            return build();
        }
        for (const perm of user.permissions ?? []) {
            if (!perm?.subject || !perm?.action)
                continue;
            if (!isAllowedAction(perm.action))
                continue;
            if (!isAllowedSubject(perm.subject))
                continue;
            can(perm.action, perm.subject);
        }
        return build();
    }
};
exports.CaslAbilityFactory = CaslAbilityFactory;
exports.CaslAbilityFactory = CaslAbilityFactory = __decorate([
    (0, common_1.Injectable)()
], CaslAbilityFactory);
//# sourceMappingURL=casl-ability.factory.js.map