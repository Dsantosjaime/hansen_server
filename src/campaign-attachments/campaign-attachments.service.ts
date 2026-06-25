import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";

// Nettoie le nom de fichier pour qu'il soit safe dans une URL et un filesystem,
// tout en restant lisible pour le destinataire de l'email.
function sanitizeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, path.extname(originalName));

  const safeBase = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les accents
    .replace(/[^a-zA-Z0-9-_]/g, "_") // tout caractère spécial → _
    .replace(/_+/g, "_") // compresse les _ multiples
    .replace(/^_|_$/g, "") // retire _ en début/fin
    .slice(0, 100); // limite raisonnable de longueur

  const safeExtStr = ext && ext.length <= 10 ? ext : "";

  return `${safeBase || "fichier"}${safeExtStr}`;
}

@Injectable()
export class CampaignAttachmentsService {
  constructor(private readonly config: ConfigService) {}

  async saveAndGetUrl(file: Express.Multer.File) {
    const uploadDir: string = this.config.getOrThrow<string>("UPLOAD_DIR");
    const baseUrl: string = this.config.getOrThrow<string>(
      "PUBLIC_FILES_BASE_URL",
    );

    // Sous-dossier unique (UUID) pour isoler chaque upload :
    // évite toute collision de noms entre deux fichiers identiques.
    const token = randomUUID();
    const subDir = path.join(uploadDir, token);
    await fs.mkdir(subDir, { recursive: true });

    const safeName = sanitizeFilename(file.originalname);
    const storedPath = path.join(subDir, safeName);

    await fs.writeFile(storedPath, file.buffer);

    return {
      // L'URL se termine par le vrai nom de fichier → Brevo l'utilise
      // comme nom de pièce jointe dans l'email envoyé.
      attachmentUrl: `${baseUrl}/${token}/${encodeURIComponent(safeName)}`,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
