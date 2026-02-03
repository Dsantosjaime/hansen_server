export type BrevoEmailTemplate = {
  id: number;
  name: string;
  subject: string;
  isActive: boolean;
};

export type BrevoCreateCampaignFromTemplateInput = {
  name: string;
  sender: { name: string; email: string };
  listIds: number[];

  // Template Brevo choisi par l’utilisateur
  templateId: number;

  // On le met explicitement pour être robuste (au lieu de supposer que Brevo copie le subject)
  subject: string;

  scheduledAt?: string;
  attachmentUrl?: string;
};

export interface BrevoClient {
  // Templates (Brevo UI)
  listEmailTemplates(args: {
    limit: number;
    offset: number;
  }): Promise<BrevoEmailTemplate[]>;
  getEmailTemplate(templateId: number): Promise<BrevoEmailTemplate>;

  // Campaign creation (marketing)
  createCampaignFromTemplate(
    input: BrevoCreateCampaignFromTemplateInput,
  ): Promise<{ id: number }>;
  sendCampaignNow(campaignId: number): Promise<void>;

  // Lists
  createList(name: string): Promise<{ id: number }>;
  removeEmailsFromList(listId: number, emails: string[]): Promise<void>;

  // Contacts
  upsertContactToList(args: {
    email: string;
    listId: number;
    attributes?: Record<string, unknown>;
  }): Promise<void>;

  deleteContactByEmail(email: string): Promise<void>;
}
