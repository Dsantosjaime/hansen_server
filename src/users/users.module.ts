import { Global, Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { KeycloakModule } from "src/keycloak/keycloak.module";
import { UsersController } from "./users.controller";
import { BrevoModule } from "@/brevo/brevo.module";

@Global()
@Module({
  imports: [KeycloakModule, BrevoModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
