/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ContactsApi,
  EmailCampaignsApi,
  TransactionalEmailsApi,
  SendersApi,
} from "@getbrevo/brevo";

import { BREVO_CLIENT } from "./brevo.constants";
import type {
  BrevoClient,
  BrevoCreateCampaignFromTemplateInput,
  BrevoEmailCampaign,
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
    const sendersApi = new SendersApi(basePath);

    setApiKeyOnApiInstance(contactsApi, apiKey);
    setApiKeyOnApiInstance(emailCampaignsApi, apiKey);
    setApiKeyOnApiInstance(transactionalApi, apiKey);
    setApiKeyOnApiInstance(sendersApi, apiKey);

    const client: BrevoClient = {
      async listEmailTemplates({
        limit,
        offset,
      }): Promise<BrevoEmailTemplate[]> {
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

      async createCampaignFromTemplate(
        input: BrevoCreateCampaignFromTemplateInput,
      ): Promise<{ id: number }> {
        const payload: any = {
          name: input.name,
          subject: input.subject,
          sender: input.sender,
          type: "classic",
          recipients: { listIds: input.listIds },
          templateId: input.templateId,
          ...(input.replyTo ? { replyTo: input.replyTo } : {}),
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

        await contactsApi.createContact(payload);
      },

      async deleteContactByEmail(email: string): Promise<void> {
        await contactsApi.deleteContact(email);
      },

      async listEmailCampaigns({
        limit,
        offset,
        sort = "desc",
        type = "classic",
      }): Promise<BrevoEmailCampaign[]> {
        const res = await emailCampaignsApi.getEmailCampaigns(
          type,
          undefined,
          undefined,
          undefined,
          undefined,
          limit,
          offset,
          sort,
        );

        const data = unwrapBody<any>(res);
        const campaigns = (data?.campaigns ?? []) as any[];

        return campaigns.map((c) => ({
          id: toNumber(c.id),
          name: String(c.name ?? ""),
          subject: String(c.subject ?? ""),
          status: String(c.status ?? ""),
          scheduledAt: (c.scheduledAt ?? null) as string | null,
          createdAt: (c.createdAt ?? null) as string | null,
          modifiedAt: (c.modifiedAt ?? null) as string | null,
        }));
      },

      async createSender(args: {
        name: string;
        email: string;
      }): Promise<{ id: number }> {
        const res = await (sendersApi as any).createSender({
          name: args.name,
          email: args.email,
        });
        const data = unwrapBody<any>(res);
        return { id: toNumber(data?.id) };
      },

      async deleteSender(senderId: number): Promise<void> {
        await (sendersApi as any).deleteSender(String(senderId));
      },
    };

    return client;
  },
};
