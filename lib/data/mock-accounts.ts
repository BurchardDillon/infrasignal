import type { Account } from "@/lib/types";

export const MOCK_ACCOUNTS: Account[] = [
  {
    id: "acc_coreweave",
    company_name: "CoreWeave",
    domain: "coreweave.com",
    website: "https://www.coreweave.com",
    linkedin_company_url: "https://www.linkedin.com/company/coreweave",
    industry: "Cloud Infrastructure / AI",
    employee_count_range: "1001_to_5000",
    hq_location: "Livingston, NJ",
    company_type: "ai_infrastructure_provider",
    status: "active",
    direct_buy_likelihood: "high",
    infra_ownership_verdict: "owned",
    evidence_strength: "strong",
    why_it_matters:
      "Rapidly expanding GPU cloud provider with massive NVIDIA hardware procurement. Building out owned data center capacity across the US and Europe.",
    negative_signals: null,
    component_fit: [
      {
        category: "gpu",
        fit_reason:
          "Primary business is GPU-as-a-service; procures NVIDIA H100/B200 at scale",
      },
      {
        category: "networking",
        fit_reason:
          "InfiniBand and high-speed ethernet backbone required for GPU cluster interconnect",
      },
      {
        category: "server",
        fit_reason:
          "Custom server configurations for dense GPU deployments",
      },
    ],
    hardware_categories: ["gpu", "networking", "server", "memory"],
    notes:
      "Key contact is VP of Hardware Engineering. Recent $7.5B debt financing for infrastructure expansion.",
    source_prospect_id: "prsp_coreweave",
    last_reviewed_at: new Date("2025-06-10T14:30:00Z"),
    created_at: new Date("2025-01-15T09:00:00Z"),
    updated_at: new Date("2025-06-10T14:30:00Z"),
  },
  {
    id: "acc_lambda",
    company_name: "Lambda Labs",
    domain: "lambdalabs.com",
    website: "https://lambdalabs.com",
    linkedin_company_url: "https://www.linkedin.com/company/lambda-labs",
    industry: "AI Infrastructure / Deep Learning",
    employee_count_range: "201_to_500",
    hq_location: "San Francisco, CA",
    company_type: "ai_infrastructure_provider",
    status: "active",
    direct_buy_likelihood: "high",
    infra_ownership_verdict: "hybrid",
    evidence_strength: "moderate",
    why_it_matters:
      "Sells GPU workstations and operates a GPU cloud. Both builds own hardware and leases colo space for cloud offering.",
    negative_signals:
      "Recent shift toward more leased capacity may reduce direct hardware procurement over time.",
    component_fit: [
      {
        category: "gpu",
        fit_reason:
          "Builds and sells GPU workstations; deploys NVIDIA A100/H100 in cloud",
      },
      {
        category: "server",
        fit_reason:
          "Designs custom 4U GPU server chassis for workstation product line",
      },
      {
        category: "memory",
        fit_reason:
          "High-capacity DDR5 ECC memory for deep learning workstations",
      },
    ],
    hardware_categories: ["gpu", "server", "memory", "ssd"],
    notes: null,
    source_prospect_id: null,
    last_reviewed_at: new Date("2025-05-22T10:00:00Z"),
    created_at: new Date("2025-02-03T11:30:00Z"),
    updated_at: new Date("2025-05-22T10:00:00Z"),
  },
  {
    id: "acc_equinix",
    company_name: "Equinix",
    domain: "equinix.com",
    website: "https://www.equinix.com",
    linkedin_company_url: "https://www.linkedin.com/company/equinix",
    industry: "Data Center / Colocation",
    employee_count_range: "10001_plus",
    hq_location: "Redwood City, CA",
    company_type: "colo_provider",
    status: "active",
    direct_buy_likelihood: "medium",
    infra_ownership_verdict: "owned",
    evidence_strength: "strong",
    why_it_matters:
      "World's largest colocation provider with 260+ data centers globally. Procures networking and server hardware at massive scale for managed services.",
    negative_signals:
      "Core colo business means tenants bring own hardware; direct buy limited to Equinix Metal and managed services.",
    component_fit: [
      {
        category: "networking",
        fit_reason:
          "Operates Equinix Fabric interconnection platform; heavy buyer of switches and routers",
      },
      {
        category: "server",
        fit_reason:
          "Equinix Metal bare-metal-as-a-service requires ongoing server fleet refresh",
      },
    ],
    hardware_categories: ["networking", "server", "ssd"],
    notes:
      "Equinix Metal (formerly Packet) team is best entry point for server/storage sales.",
    source_prospect_id: null,
    last_reviewed_at: new Date("2025-06-01T08:00:00Z"),
    created_at: new Date("2024-11-20T15:00:00Z"),
    updated_at: new Date("2025-06-01T08:00:00Z"),
  },
  {
    id: "acc_hetzner",
    company_name: "Hetzner Online",
    domain: "hetzner.com",
    website: "https://www.hetzner.com",
    linkedin_company_url: "https://www.linkedin.com/company/hetzner-online",
    industry: "Hosting / Cloud Infrastructure",
    employee_count_range: "501_to_1000",
    hq_location: "Gunzenhausen, Germany",
    company_type: "datacenter_operator",
    status: "nurturing",
    direct_buy_likelihood: "high",
    infra_ownership_verdict: "owned",
    evidence_strength: "moderate",
    why_it_matters:
      "Vertically integrated hosting provider that owns and operates its own data centers and builds custom servers. Known for aggressive hardware procurement at competitive prices.",
    negative_signals: null,
    component_fit: [
      {
        category: "server",
        fit_reason:
          "Assembles own servers in-house; large volume buyer of motherboards, CPUs, and chassis",
      },
      {
        category: "ssd",
        fit_reason:
          "Heavy NVMe SSD procurement for dedicated server and cloud storage products",
      },
      {
        category: "hdd",
        fit_reason:
          "Storage Box product line requires bulk HDD purchasing",
      },
    ],
    hardware_categories: ["server", "ssd", "hdd", "memory", "networking"],
    notes:
      "European procurement cycles. Preference for direct manufacturer relationships over distributors.",
    source_prospect_id: "prsp_hetzner",
    last_reviewed_at: new Date("2025-04-15T12:00:00Z"),
    created_at: new Date("2025-03-01T10:00:00Z"),
    updated_at: new Date("2025-04-15T12:00:00Z"),
  },
  {
    id: "acc_ovhcloud",
    company_name: "OVHcloud",
    domain: "ovhcloud.com",
    website: "https://www.ovhcloud.com",
    linkedin_company_url: "https://www.linkedin.com/company/ovhcloud",
    industry: "Cloud Infrastructure / Hosting",
    employee_count_range: "5001_to_10000",
    hq_location: "Roubaix, France",
    company_type: "private_cloud_provider",
    status: "active",
    direct_buy_likelihood: "high",
    infra_ownership_verdict: "owned",
    evidence_strength: "strong",
    why_it_matters:
      "Europe's largest cloud provider with a uniquely vertically integrated model -- manufactures own servers and water-cooling systems in-house. One of the largest independent hardware buyers globally.",
    negative_signals:
      "Post-Strasbourg fire (2021) regulatory scrutiny has slowed some expansion plans.",
    component_fit: [
      {
        category: "server",
        fit_reason:
          "Manufactures own servers in Croix factory; buys components directly from OEMs",
      },
      {
        category: "ssd",
        fit_reason:
          "Massive NVMe and SATA SSD volumes for cloud and dedicated server offerings",
      },
      {
        category: "networking",
        fit_reason:
          "Operates private fiber backbone across 40+ data centers; procures switches at scale",
      },
      {
        category: "memory",
        fit_reason:
          "DDR5 server memory at volume for in-house server assembly line",
      },
    ],
    hardware_categories: ["server", "ssd", "networking", "memory", "hdd"],
    notes:
      "Public company (Euronext Paris). Procurement team based in Roubaix. Strong preference for direct component sourcing.",
    source_prospect_id: null,
    last_reviewed_at: new Date("2025-05-30T16:00:00Z"),
    created_at: new Date("2024-10-05T09:00:00Z"),
    updated_at: new Date("2025-05-30T16:00:00Z"),
  },
];
