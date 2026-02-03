/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ContactsApi,
  EmailCampaignsApi,
  TransactionalEmailsApi,
} from "@getbrevo/brevo";

import { BREVO_CLIENT } from "./brevo.constants";
import type {
  BrevoClient,
  BrevoCreateCampaignFromTemplateInput,
  BrevoEmailTemplate,
} from "./brevo.client";

function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// SDK: certains retours sont parfois { body: ... }
function unwrapBody<T>(res: unknown): T {
  const r = res as any;
  return (r?.body ?? r) as T;
}

function setApiKeyOnApiInstance(apiInstance: unknown, apiKey: string) {
  (apiInstance as any).authentications.apiKey.apiKey = apiKey;
}

export const brevoClientProvider: Provider = {
  provide: BREVO_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): BrevoClient => {
    const apiKey = config.getOrThrow<string>("BREVO_API_KEY");
    const basePath =
      config.get<string>("BREVO_BASE_URL") ?? "https://api.brevo.com/v3";

    const contactsApi = new ContactsApi(basePath);
    const emailCampaignsApi = new EmailCampaignsApi(basePath);
    const transactionalApi = new TransactionalEmailsApi(basePath);

    setApiKeyOnApiInstance(contactsApi, apiKey);
    setApiKeyOnApiInstance(emailCampaignsApi, apiKey);
    setApiKeyOnApiInstance(transactionalApi, apiKey);

    const client: BrevoClient = {
      /**
       * Templates: on utilise l’API Transactional templates (SMTP templates).
       * L’utilisateur gère ses templates dans Brevo, on récupère id/name/subject/isActive.
       */
      async listEmailTemplates({
        limit,
        offset,
      }): Promise<BrevoEmailTemplate[]> {
        // getSmtpTemplates(templateStatus, limit, offset, sort)
        // Les signatures exactes peuvent varier, donc on unwrap + map.
        const res = await (transactionalApi as any).getSmtpTemplates(
          true,
          limit,
          offset,
          "desc",
        );
        const data = unwrapBody<any>(res);

        const templates = (data?.templates ?? []) as any[];
        return templates.map((t) => ({
          id: toNumber(t.id),
          name: String(t.name ?? ""),
          subject: String(t.subject ?? ""),
          isActive: Boolean(t.isActive ?? true),
        }));
      },

      async getEmailTemplate(templateId: number): Promise<BrevoEmailTemplate> {
        // getSmtpTemplate(templateId)
        const res = await (transactionalApi as any).getSmtpTemplate(
          String(templateId),
        );
        const data = unwrapBody<any>(res);

        return {
          id: toNumber(data?.id ?? templateId),
          name: String(data?.name ?? ""),
          subject: String(data?.subject ?? ""),
          isActive: Boolean(data?.isActive ?? true),
        };
      },

      /**
       * Crée une campagne marketing à partir d’un templateId.
       * On passe explicitement subject + recipients.listIds.
       */
      async createCampaignFromTemplate(
        input: BrevoCreateCampaignFromTemplateInput,
      ): Promise<{ id: number }> {
        const payload: any = {
          name: input.name,
          subject: input.subject,
          sender: input.sender,
          type: "classic",
          recipients: { listIds: input.listIds },

          // clé: création depuis templateId
          templateId: input.templateId,

          ...(input.scheduledAt ? { scheduledAt: input.scheduledAt } : {}),
          ...(input.attachmentUrl
            ? { attachmentUrl: input.attachmentUrl }
            : {}),
        };

        const res = await emailCampaignsApi.createEmailCampaign(payload);
        const data = unwrapBody<any>(res);
        return { id: toNumber(data?.id) };
      },

      async sendCampaignNow(campaignId: number): Promise<void> {
        // Workaround SDK: parfois le SDK met l’id en body -> string évite axios crash
        const id = String(campaignId);
        await (emailCampaignsApi as any).sendEmailCampaignNow(id);
      },

      async createList(name: string): Promise<{ id: number }> {
        const folderId = Number(
          config.getOrThrow<string>("BREVO_CONTACTS_FOLDER_ID"),
        );

        const res = await contactsApi.createList({ name, folderId } as any);
        const data = unwrapBody<any>(res);
        return { id: toNumber(data?.id) };
      },

      async removeEmailsFromList(
        listId: number,
        emails: string[],
      ): Promise<void> {
        if (!emails.length) return;
        await contactsApi.removeContactFromList(listId, { emails } as any);
      },

      async upsertContactToList(args: {
        email: string;
        listId: number;
        attributes?: Record<string, unknown>;
      }): Promise<void> {
        const payload: any = {
          email: args.email,
          attributes: args.attributes ?? {},
          listIds: [args.listId],
          updateEnabled: true,
        };

        // Upsert côté Brevo: createContact + updateEnabled=true
        await contactsApi.createContact(payload);
      },

      async deleteContactByEmail(email: string): Promise<void> {
        await contactsApi.deleteContact(email);
      },
    };

    return client;
  },
};
