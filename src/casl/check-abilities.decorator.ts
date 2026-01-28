import { SetMetadata } from '@nestjs/common';

export type RequiredAbility = { action: string; subject: string };
export const CHECK_ABILITIES_KEY = 'check_abilities';

export const CheckAbilities = (...abilities: RequiredAbility[]) =>
  SetMetadata(CHECK_ABILITIES_KEY, abilities);
