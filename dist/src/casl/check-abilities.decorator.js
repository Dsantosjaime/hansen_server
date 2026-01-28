"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckAbilities = exports.CHECK_ABILITIES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.CHECK_ABILITIES_KEY = 'check_abilities';
const CheckAbilities = (...abilities) => (0, common_1.SetMetadata)(exports.CHECK_ABILITIES_KEY, abilities);
exports.CheckAbilities = CheckAbilities;
//# sourceMappingURL=check-abilities.decorator.js.map