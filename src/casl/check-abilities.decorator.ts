import { SetMetadata } from "@nestjs/common";
import type { Actions, Subjects } from "./casl.types";

export type RequiredAbility = { action: Actions; subject: Subjects };
export const CHECK_ABILITIES_KEY = "check_abilities";

export const CheckAbilities = (...abilities: RequiredAbility[]) =>
  SetMetadata(CHECK_ABILITIES_KEY, abilities);
