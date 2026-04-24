function normalizePart(input: string): string {
  return String(input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z\s-]/g, "")
    .replace(/[\s-]+/g, "")
    .toLowerCase();
}

function cleanupLocalPart(input: string): string {
  return String(input ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/-{2,}/g, "-")
    .replace(/_{2,}/g, "_")
    .replace(/^[._-]+|[._-]+$/g, "");
}

function takeN(s: string, n?: number): string {
  if (!s) return "";
  if (!n || n <= 0) return s;
  return s.slice(0, n);
}

export function buildEmailFromTemplate(params: {
  firstName: string;
  lastName: string; // peut contenir des espaces ("dos santos")
  domain: string;
  extension: string;
  pattern: string; // ex "{first:1}.{last}"
}): string {
  const domain = params.domain?.trim().toLowerCase();
  const ext = params.extension?.trim().toLowerCase();

  if (!domain || !ext) return "";

  const tokenRe = /\{(first|last)(?::(\d+))?\}/g;

  const local = params.pattern.replace(
    tokenRe,
    (_m, key: "first" | "last", nStr?: string) => {
      const n = nStr ? Number(nStr) : undefined;
      const raw = key === "first" ? params.firstName : params.lastName;
      const value = normalizePart(raw); // "dos santos" -> "dossantos"
      return takeN(value, n);
    },
  );

  const cleanedLocal = cleanupLocalPart(local);
  if (!cleanedLocal) return "";

  return `${cleanedLocal}@${domain}.${ext}`;
}
