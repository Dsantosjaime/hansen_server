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

  /**
   * Variables transmises au moteur de template Brevo.
   * Accessibles dans le template via {{ params.key }}.
   * Statique pour toute la campagne (contrairement aux emails transactionnels).
   */
  params?: Record<string, unknown>;
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
  deleteList(listId: number): Promise<void>;
  removeEmailsFromList(listId: number, emails: string[]): Promise<void>;

  // Contacts
  upsertContact(args: {
    email: string;
    attributes?: Record<string, unknown>;
  }): Promise<void>;

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
