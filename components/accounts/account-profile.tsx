import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  COMPANY_TYPE_LABELS,
  ACCOUNT_STATUS_LABELS,
  LIKELIHOOD_LABELS,
  INFRA_VERDICT_LABELS,
  EVIDENCE_STRENGTH_LABELS,
  HARDWARE_CATEGORY_LABELS,
  EMPLOYEE_COUNT_LABELS,
} from "@/lib/constants/labels";
import type { Account, AccountStatus, EvidenceStrength, Likelihood } from "@/lib/types";
import {
  Building2,
  Globe,
  Linkedin,
  MapPin,
  Users,
  ExternalLink,
  AlertTriangle,
  Cpu,
} from "lucide-react";

const STATUS_VARIANT: Record<
  AccountStatus,
  "success" | "info" | "danger" | "warning"
> = {
  active: "success",
  nurturing: "info",
  churned: "danger",
  on_hold: "warning",
};

const LIKELIHOOD_VARIANT: Record<
  Likelihood,
  "success" | "default" | "warning" | "neutral"
> = {
  high: "success",
  medium: "default",
  low: "warning",
  unknown: "neutral",
};

const STRENGTH_VARIANT: Record<
  EvidenceStrength,
  "success" | "default" | "warning" | "neutral"
> = {
  strong: "success",
  moderate: "default",
  weak: "warning",
  none: "neutral",
};

export function AccountProfile({ account }: { account: Account }) {
  return (
    <Card>
      <div className="grid gap-8 md:grid-cols-2">
        {/* Left side: Company info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Company Details
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Type</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {COMPANY_TYPE_LABELS[account.company_type]}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                <dd>
                  <Badge variant={STATUS_VARIANT[account.status]}>
                    {ACCOUNT_STATUS_LABELS[account.status]}
                  </Badge>
                </dd>
              </div>
            </div>
            {account.industry && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Industry</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">
                    {account.industry}
                  </dd>
                </div>
              </div>
            )}
            {account.employee_count_range && (
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Employees</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">
                    {EMPLOYEE_COUNT_LABELS[account.employee_count_range]}
                  </dd>
                </div>
              </div>
            )}
            {account.hq_location && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">HQ Location</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">
                    {account.hq_location}
                  </dd>
                </div>
              </div>
            )}
            {account.domain && (
              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Domain</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">
                    {account.domain}
                  </dd>
                </div>
              </div>
            )}
            {account.website && (
              <div className="flex items-start gap-3">
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Website</dt>
                  <dd>
                    <a
                      href={account.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {account.website}
                    </a>
                  </dd>
                </div>
              </div>
            )}
            {account.linkedin_company_url && (
              <div className="flex items-start gap-3">
                <Linkedin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">LinkedIn</dt>
                  <dd>
                    <a
                      href={account.linkedin_company_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Company Page
                    </a>
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </div>

        {/* Right side: Scores & assessments */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Assessment
          </h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">
                Direct Buy Likelihood
              </dt>
              <dd className="mt-1">
                <Badge variant={LIKELIHOOD_VARIANT[account.direct_buy_likelihood]}>
                  {LIKELIHOOD_LABELS[account.direct_buy_likelihood]}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">
                Infra Ownership Verdict
              </dt>
              <dd className="mt-1">
                <Badge variant="default">
                  {INFRA_VERDICT_LABELS[account.infra_ownership_verdict]}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">
                Evidence Strength
              </dt>
              <dd className="mt-1">
                <Badge variant={STRENGTH_VARIANT[account.evidence_strength]}>
                  {EVIDENCE_STRENGTH_LABELS[account.evidence_strength]}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Why it matters */}
      {account.why_it_matters && (
        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800">
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Why It Matters
          </h3>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {account.why_it_matters}
          </p>
        </div>
      )}

      {/* Negative signals */}
      {account.negative_signals && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div>
              <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">
                Negative Signals
              </h4>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                {account.negative_signals}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Component fit */}
      {account.component_fit.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-800">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Cpu className="h-4 w-4 text-gray-400" />
            Component Fit
          </h3>
          <div className="space-y-3">
            {account.component_fit.map((fit) => (
              <div
                key={fit.category}
                className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900"
              >
                <Badge variant="info">
                  {HARDWARE_CATEGORY_LABELS[fit.category]}
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {fit.fit_reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
