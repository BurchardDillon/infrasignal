import { CompanyParseResult } from "@/lib/types/discovery";

export function parsePastedList(text: string): CompanyParseResult {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  if (lines.length === 0) {
    return { companies: [], errors: [], skipped: 0 };
  }

  const companies: any[] = [];
  const errors: { row: number; message: string }[] = [];
  let skipped = 0;

  const firstLine = lines[0].toLowerCase();
  const looksStructured =
    firstLine.includes("company_name") ||
    firstLine.includes("company name") ||
    firstLine.includes("domain") ||
    firstLine.includes("industry");

  if (looksStructured) {
    const delimiter = lines[0].includes("\t") ? "\t" : ",";
    const headers = lines[0]
      .split(delimiter)
      .map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter);
      const row: any = {};

      headers.forEach((h, idx) => {
        row[h] = cols[idx]?.trim();
      });

      if (!row.company_name) {
        errors.push({ row: i + 1, message: "missing company_name" });
        skipped++;
        continue;
      }

      companies.push({
        company_name: row.company_name,
        domain: row.domain ?? null,
        country: row.country ?? "United States",
        hq_location: row.hq_location ?? null,
        industry: row.industry ?? null,
        hardware_hints: row.hardware_hints ?? null,
        notes: row.notes ?? null,
        source: "import"
      });
    }
  } else {
    for (let i = 0; i < lines.length; i++) {
      const companyName = lines[i];
      if (!companyName) {
        errors.push({ row: i + 1, message: "empty line" });
        skipped++;
        continue;
      }

      companies.push({
        company_name: companyName,
        domain: null,
        country: "United States",
        hq_location: null,
        industry: null,
        hardware_hints: null,
        notes: null,
        source: "import"
      });
    }
  }

  return { companies, errors, skipped };
}
