import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CaslAbilityFactory } from "./casl-ability.factory";
import { UsersService } from "src/users/users.service";
export declare class CaslGuard implements CanActivate {
    private reflector;
    private caslAbilityFactory;
    private usersService;
    constructor(reflector: Reflector, caslAbilityFactory: CaslAbilityFactory, usersService: UsersService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
