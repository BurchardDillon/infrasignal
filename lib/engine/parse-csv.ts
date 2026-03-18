import { CompanyParseResult } from "@/lib/types/discovery";

export function parseCsv(text: string): CompanyParseResult {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  if (lines.length === 0) {
    return { companies: [], errors: [], skipped: 0 };
  }

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const companies: any[] = [];
  const errors: { row: number; message: string }[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
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

  return { companies, errors, skipped };
}
