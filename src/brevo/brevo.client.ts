export type BrevoEmailTemplate = {
  id: number;
  name: string;
  subject: string;
  isActive: boolean;
};

export type BrevoEmailCampaign = {
  id: number;
  name: string;
  subject: string;
  status: string;
  scheduledAt?: string | null;
  createdAt?: string | null;
  modifiedAt?: string | null;
};

export type BrevoCreateCampaignFromTemplateInput = {
  name: string;
  sender: { name: string; email: string };
  listIds: number[];

  templateId: number;
  subject: string;

  replyTo?: string;
  scheduledAt?: string;
  attachmentUrl?: string;
};

export interface BrevoClient {
  // Templates
  listEmailTemplates(args: {
    limit: number;
    offset: number;
  }): Promise<BrevoEmailTemplate[]>;
  getEmailTemplate(templateId: number): Promise<BrevoEmailTemplate>;

  // Campaigns
  createCampaignFromTemplate(
    input: BrevoCreateCampaignFromTemplateInput,
  ): Promise<{ id: number }>;
  sendCampaignNow(campaignId: number): Promise<void>;

  // Lists
  createList(name: string): Promise<{ id: number }>;
  deleteList(listId: number): Promise<void>; // <-- AJOUT
  removeEmailsFromList(listId: number, emails: string[]): Promise<void>;

  // Contacts
  upsertContactToList(args: {
    email: string;
    listId: number;
    attributes?: Record<string, unknown>;
  }): Promise<void>;

  deleteContactByEmail(email: string): Promise<void>;

  listEmailCampaigns(args: {
    limit: number;
    offset: number;
    sort?: "asc" | "desc";
    type?: "classic" | "trigger";
  }): Promise<BrevoEmailCampaign[]>;

  // Senders
  createSender(args: { name: string; email: string }): Promise<{ id: number }>;
  deleteSender(senderId: number): Promise<void>;
}
