export type RequiredAbility = {
    action: string;
    subject: string;
};
export declare const CHECK_ABILITIES_KEY = "check_abilities";
export declare const CheckAbilities: (...abilities: RequiredAbility[]) => import("@nestjs/common").CustomDecorator<string>;
