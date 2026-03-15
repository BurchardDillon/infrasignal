import type { NewsAccountLink } from "@/lib/types";

// ---------------------------------------------------------------------------
// Account linking
// ---------------------------------------------------------------------------
// Matches mentioned company names against existing accounts using
// case-insensitive substring matching. This is a pure function — it
// receives the account list as a parameter and makes no Supabase calls.

export interface AccountForLinking {
  id: string;
  company_name: string;
  domain: string | null;
}

export interface AccountLinkResult {
  account_id: string | null;
  linked_accounts: NewsAccountLink[];
}

// Common suffixes to strip for better matching
const COMPANY_SUFFIXES = [
  " inc", " inc.", " corp", " corp.", " llc", " ltd", " ltd.",
  " gmbh", " ag", " sa", " plc", " co.", " co",
];

function normalize(name: string): string {
  let lower = name.toLowerCase().trim();
  for (const suffix of COMPANY_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      lower = lower.slice(0, -suffix.length).trim();
    }
  }
  return lower;
}

export function linkToAccounts(
  mentionedCompanies: string[],
  existingAccounts: AccountForLinking[]
): AccountLinkResult {
  if (mentionedCompanies.length === 0) {
    return { account_id: null, linked_accounts: [] };
  }

  const normalizedMentions = mentionedCompanies.map(normalize);
  const matched = new Set<string>();
  const linkedAccounts: NewsAccountLink[] = [];

  for (const account of existingAccounts) {
    const normalizedAccount = normalize(account.company_name);
    const accountDomain = account.domain?.toLowerCase() ?? "";

    for (const mention of normalizedMentions) {
      // Substring match in either direction
      const nameMatch =
        normalizedAccount.includes(mention) ||
        mention.includes(normalizedAccount);

      // Domain match (if the mention looks like it could be a domain)
      const domainMatch =
        accountDomain.length > 0 &&
        (mention.includes(accountDomain) ||
          accountDomain.includes(mention));

      if ((nameMatch || domainMatch) && !matched.has(account.id)) {
        matched.add(account.id);
        linkedAccounts.push({
          account_id: account.id,
          link_type: "auto",
        });
      }
    }
  }

  return {
    account_id: linkedAccounts.length > 0 ? linkedAccounts[0].account_id : null,
    linked_accounts: linkedAccounts,
  };
}
