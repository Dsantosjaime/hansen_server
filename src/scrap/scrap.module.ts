import { Module } from "@nestjs/common";
import { ScrapController } from "./scrap.controller";
import { ScrapService } from "./scrap.service";
import { ContactsModule } from "@/contacts/contacts.module";
import { BrevoModule } from "@/brevo/brevo.module";
import { SubGroupsModule } from "@/subgroups/subgroups.module";
import { PluginParamsModule } from "@/plugin-params/plugin-params.module";

@Module({
  imports: [ContactsModule, BrevoModule, SubGroupsModule, PluginParamsModule],
  controllers: [ScrapController],
  providers: [ScrapService],
})
export class ScrapModule {}
