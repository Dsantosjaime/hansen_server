import type { Actions, Subjects } from "./casl.types";
export type RequiredAbility = {
    action: Actions;
    subject: Subjects;
};
export declare const CHECK_ABILITIES_KEY = "check_abilities";
export declare const CheckAbilities: (...abilities: RequiredAbility[]) => import("@nestjs/common").CustomDecorator<string>;
