import { Module } from "@nestjs/common";
import { PluginParamsController } from "./plugin-params.controller";
import { PluginParamsService } from "./plugin-params.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [PluginParamsController],
  providers: [PluginParamsService],
  exports: [PluginParamsService],
})
export class PluginParamsModule {}
