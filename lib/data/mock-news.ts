import type { NewsItem } from "@/lib/types";

export const MOCK_NEWS: NewsItem[] = [
  {
    id: "news_01",
    title: "CoreWeave Files for IPO, Plans $4B Public Offering",
    summary:
      "CoreWeave has filed its S-1 with the SEC for a planned IPO valued at approximately $35 billion, with $4 billion in expected proceeds earmarked for GPU infrastructure expansion.",
    source_url:
      "https://www.reuters.com/technology/coreweave-ipo-filing-2025",
    source_name: "Reuters",
    published_at: new Date("2025-06-01T12:00:00Z"),
    event_type: "expansion",
    urgency_score: 92,
    commercial_relevance_score: 95,
    confidence_score: 98,
    impact_summary:
      "IPO proceeds will fund massive GPU and server hardware procurement. Expect accelerated purchasing cycles in H2 2025.",
    recommended_outreach_department: "procurement",
    suggested_outreach_angle:
      "Position volume pricing and supply guarantees ahead of post-IPO expansion wave.",
    component_impact: [
      { category: "gpu", impact: "Major procurement wave expected post-IPO" },
      {
        category: "networking",
        impact: "InfiniBand and ethernet switching for new clusters",
      },
    ],
    hardware_categories: ["gpu", "networking", "server"],
    account_id: "acc_coreweave",
    linked_accounts: [],
    created_at: new Date("2025-06-01T13:00:00Z"),
    updated_at: new Date("2025-06-01T13:00:00Z"),
  },
  {
    id: "news_02",
    title: "NVIDIA Reports Record Q1 Data Center Revenue of $22.6B",
    summary:
      "NVIDIA's data center segment reported record quarterly revenue, driven by demand from cloud providers and AI infrastructure companies.",
    source_url: "https://nvidianews.nvidia.com/q1-fy2026-earnings",
    source_name: "NVIDIA Newsroom",
    published_at: new Date("2025-05-28T20:00:00Z"),
    event_type: "earnings",
    urgency_score: 65,
    commercial_relevance_score: 80,
    confidence_score: 99,
    impact_summary:
      "Confirms strong GPU demand cycle. CoreWeave and Lambda are among top buyers -- validates their continued procurement activity.",
    recommended_outreach_department: null,
    suggested_outreach_angle: null,
    component_impact: [
      {
        category: "gpu",
        impact: "Sustained high demand confirms market opportunity",
      },
    ],
    hardware_categories: ["gpu"],
    account_id: null,
    linked_accounts: [
      { account_id: "acc_coreweave", link_type: "auto" },
      { account_id: "acc_lambda", link_type: "auto" },
    ],
    created_at: new Date("2025-05-29T08:00:00Z"),
    updated_at: new Date("2025-05-29T08:00:00Z"),
  },
  {
    id: "news_03",
    title:
      "OVHcloud Breaks Ground on New Data Center Campus in Strasbourg",
    summary:
      "OVHcloud has begun construction on a replacement data center campus in Strasbourg, France, with a planned capacity of 60,000 servers and an estimated EUR 250M investment.",
    source_url:
      "https://corporate.ovhcloud.com/en/newsroom/strasbourg-campus",
    source_name: "OVHcloud Newsroom",
    published_at: new Date("2025-05-15T09:00:00Z"),
    event_type: "infrastructure_build",
    urgency_score: 85,
    commercial_relevance_score: 90,
    confidence_score: 95,
    impact_summary:
      "60,000 new servers will require massive component procurement from OVHcloud's in-house manufacturing line. SSD and memory demand will spike.",
    recommended_outreach_department: "infrastructure",
    suggested_outreach_angle:
      "Offer competitive NVMe SSD and DDR5 memory volume pricing for the new campus buildout timeline.",
    component_impact: [
      { category: "server", impact: "60,000 new servers planned" },
      { category: "ssd", impact: "NVMe-only storage architecture" },
      { category: "memory", impact: "DDR5 ECC at scale for new platform" },
    ],
    hardware_categories: ["server", "ssd", "memory", "networking"],
    account_id: "acc_ovhcloud",
    linked_accounts: [],
    created_at: new Date("2025-05-15T10:00:00Z"),
    updated_at: new Date("2025-05-15T10:00:00Z"),
  },
  {
    id: "news_04",
    title: "Hetzner Announces GPU Cloud Offering with NVIDIA L40S",
    summary:
      "Hetzner Online is entering the GPU cloud market with new dedicated GPU servers featuring NVIDIA L40S accelerators, marking the company's first foray into AI/ML infrastructure.",
    source_url: "https://www.hetzner.com/news/gpu-cloud-launch",
    source_name: "Hetzner News",
    published_at: new Date("2025-04-20T07:00:00Z"),
    event_type: "product_launch",
    urgency_score: 78,
    commercial_relevance_score: 85,
    confidence_score: 88,
    impact_summary:
      "New GPU product line means Hetzner is now procuring GPUs for the first time at scale. Opens new hardware category opportunity.",
    recommended_outreach_department: "procurement",
    suggested_outreach_angle:
      "Introduce GPU server configurations and supply chain support for their new product line.",
    component_impact: [
      {
        category: "gpu",
        impact: "New buyer entering GPU market at scale",
      },
      {
        category: "server",
        impact: "Custom GPU server chassis required",
      },
    ],
    hardware_categories: ["gpu", "server", "memory"],
    account_id: "acc_hetzner",
    linked_accounts: [],
    created_at: new Date("2025-04-20T08:00:00Z"),
    updated_at: new Date("2025-04-20T08:00:00Z"),
  },
  {
    id: "news_05",
    title:
      "Equinix Expands xScale Program with Three New Hyperscale Data Centers",
    summary:
      "Equinix announced three new xScale data center facilities in Tokyo, Frankfurt, and Dallas, adding over 100MW of capacity for hyperscale cloud customers.",
    source_url: "https://www.equinix.com/newsroom/xscale-expansion-2025",
    source_name: "Equinix Newsroom",
    published_at: new Date("2025-05-20T14:00:00Z"),
    event_type: "expansion",
    urgency_score: 70,
    commercial_relevance_score: 75,
    confidence_score: 92,
    impact_summary:
      "xScale expansion primarily serves hyperscaler tenants who bring their own hardware. Limited direct procurement impact, but networking infrastructure will be purchased.",
    recommended_outreach_department: "infrastructure",
    suggested_outreach_angle:
      "Focus on networking equipment needs for the new xScale facilities.",
    component_impact: [
      {
        category: "networking",
        impact:
          "New facilities require full networking buildout",
      },
    ],
    hardware_categories: ["networking"],
    account_id: "acc_equinix",
    linked_accounts: [],
    created_at: new Date("2025-05-20T15:00:00Z"),
    updated_at: new Date("2025-05-20T15:00:00Z"),
  },
];
