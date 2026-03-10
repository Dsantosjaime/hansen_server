import { Injectable } from "@nestjs/common";
import { ContactsService } from "src/contacts/contacts.service";
import { ExtractGroupDto } from "./dto/extract.dto";
import { Contact } from "generated/prisma/browser";

type ExtractContactOutput = {
  lastName: string | null;
  function: string | null;
  email: string | null;
};

@Injectable()
export class ExtractService {
  constructor(private readonly contactsService: ContactsService) {}

  async extractContacts(groups: ExtractGroupDto[]) {
    // 1) Flatten + dédoublonnage des paires group/subGroup
    const pairSet = new Set<string>();
    const pairs: { groupId: string; subGroupId: string }[] = [];

    for (const g of groups) {
      for (const sg of g.subGroups) {
        const key = `${g.id}:${sg.id}`;
        if (!pairSet.has(key)) {
          pairSet.add(key);
          pairs.push({ groupId: g.id, subGroupId: sg.id });
        }
      }
    }

    // 2) Une seule requête contacts
    const contacts = await this.contactsService.findByGroupSubGroupPairs(
      { pairs },
      {
        select: {
          lastName: true,
          function: true,
          email: true,
          // groupId/subGroupId seront ajoutés automatiquement par le service
        },
      },
    );

    // 3) Regroupement par subgroup
    const byPair = new Map<string, ExtractContactOutput[]>();

    for (const c of contacts as Contact[]) {
      const key = `${c.groupId}:${c.subGroupId}`;
      const arr = byPair.get(key) ?? [];
      arr.push({
        lastName: c.lastName ?? null,
        function: c.function ?? null,
        email: c.email ?? null,
      });
      byPair.set(key, arr);
    }

    // 4) Construction de la réponse (structure identique + contacts)
    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      subGroups: g.subGroups.map((sg) => ({
        id: sg.id,
        name: sg.name,
        contacts: byPair.get(`${g.id}:${sg.id}`) ?? [],
      })),
    }));
  }
}
