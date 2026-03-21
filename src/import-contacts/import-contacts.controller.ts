import {
  Body,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ImportContactsService } from "./import-contacts.service";
import { ImportContactsCsvRequestDto } from "./dto/import-contacts.request.dto";
import { ImportContactsCsvResponseDto } from "./dto/import-contacts.response.dto";
import { BrevoMarketingService } from "@/brevo/brevo-marketing.service";

@ApiTags("import-contacts")
@Controller("import-contacts")
export class ImportContactsController {
  constructor(
    private readonly importer: ImportContactsService,
    private readonly brevoMarketing: BrevoMarketingService,
  ) {}

  /**
   * WARNING: Route volontairement SANS AUTH pour un import one-shot.
   * A supprimer/retirer du serveur une fois l'import terminé.
   */
  @Post("csv")
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: ImportContactsCsvRequestDto })
  @ApiOperation({
    summary:
      "Import one-shot CSV (1 CSV = 1 Group). Déduit SubGroups via lignes header, upsert Contacts + sync Brevo.",
  })
  @UseInterceptors(FileInterceptor("file"))
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body("groupName") groupName: string,
    @Query("dryRun") dryRun?: string,
  ): Promise<ImportContactsCsvResponseDto> {
    return this.importer.importContactsFromCsv({
      groupName,
      csvBuffer: file?.buffer,
      dryRun: dryRun === "true",
    });
  }

  /**
   * Nettoyage Brevo : supprime toutes les listes associées aux SubGroups (subGroup.brevoListId)
   * et met brevoListId à null dans la DB.
   *
   * - Ne supprime PAS les groups/subgroups/contacts en DB.
   * - dryRun=true pour simuler.
   */
  @Post("brevo/cleanup-subgroup-lists")
  @ApiOperation({
    summary:
      "Brevo cleanup: delete all Brevo lists associated to subGroups (brevoListId) and clear brevoListId in DB (no DB delete).",
  })
  async cleanupBrevoSubGroupLists(@Query("dryRun") dryRun?: string) {
    return this.brevoMarketing.cleanupSubGroupBrevoLists({
      dryRun: dryRun === "true",
    });
  }
}
