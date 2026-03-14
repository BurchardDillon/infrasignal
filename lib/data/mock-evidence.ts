import type { Evidence } from "@/lib/types";

export const MOCK_EVIDENCE: Evidence[] = [
  {
    id: "evi_01",
    account_id: "acc_coreweave",
    headline: "CoreWeave hiring Senior GPU Cluster Architect",
    description:
      "Job posting for a Senior GPU Cluster Architect referencing large-scale NVIDIA H100 and B200 deployments. Mentions designing multi-thousand GPU clusters with InfiniBand interconnect.",
    raw_excerpt:
      "You will architect GPU clusters of 10,000+ GPUs using NVIDIA H100 and next-gen B200 accelerators, connected via 400Gbps InfiniBand fabric...",
    source_url: "https://careers.coreweave.com/gpu-cluster-architect",
    source_type: "job_posting",
    signal_direction: "positive",
    signal_category: "hiring_signal",
    reliability_score: 85,
    hardware_categories: ["gpu", "networking"],
    detected_at: new Date("2025-05-28T06:00:00Z"),
    created_at: new Date("2025-05-28T06:15:00Z"),
    updated_at: new Date("2025-05-28T06:15:00Z"),
  },
  {
    id: "evi_02",
    account_id: "acc_coreweave",
    headline: "CoreWeave secures $7.5B in debt financing for data center expansion",
    description:
      "Press release announcing a major debt raise earmarked for new data center construction and GPU hardware procurement across three new US sites.",
    raw_excerpt:
      "CoreWeave has closed a $7.5 billion debt financing facility to fund the construction and equipping of new data center campuses in Texas, Illinois, and Virginia...",
    source_url:
      "https://www.reuters.com/technology/coreweave-debt-financing-2025",
    source_type: "press_release",
    signal_direction: "positive",
    signal_category: "expansion_signal",
    reliability_score: 95,
    hardware_categories: ["gpu", "server", "networking"],
    detected_at: new Date("2025-06-02T14:00:00Z"),
    created_at: new Date("2025-06-02T14:10:00Z"),
    updated_at: new Date("2025-06-02T14:10:00Z"),
  },
  {
    id: "evi_03",
    account_id: "acc_lambda",
    headline: "Lambda blog post: Building our next-gen 1-Click Clusters",
    description:
      "Engineering blog detailing Lambda's new cluster architecture using custom 4U GPU servers with liquid cooling. Reveals internal hardware design and procurement decisions.",
    raw_excerpt:
      "We designed a custom 4U chassis that houses 8x H100 SXM modules with direct-to-chip liquid cooling, reducing PUE to 1.08 and allowing us to pack 40% more compute per rack...",
    source_url: "https://lambdalabs.com/blog/next-gen-clusters",
    source_type: "engineering_blog",
    signal_direction: "positive",
    signal_category: "infrastructure_footprint",
    reliability_score: 90,
    hardware_categories: ["gpu", "server", "memory"],
    detected_at: new Date("2025-04-15T10:30:00Z"),
    created_at: new Date("2025-04-15T10:45:00Z"),
    updated_at: new Date("2025-04-15T10:45:00Z"),
  },
  {
    id: "evi_04",
    account_id: "acc_equinix",
    headline: "Equinix Metal adds AMD EPYC 9004 bare-metal configurations",
    description:
      "Product announcement showing Equinix Metal expanding its bare-metal server fleet with AMD EPYC Genoa processors, indicating active server hardware procurement cycle.",
    raw_excerpt: null,
    source_url:
      "https://www.equinix.com/newsroom/metal-amd-epyc-9004",
    source_type: "press_release",
    signal_direction: "positive",
    signal_category: "purchase_intent",
    reliability_score: 88,
    hardware_categories: ["server", "memory", "ssd"],
    detected_at: new Date("2025-05-10T08:00:00Z"),
    created_at: new Date("2025-05-10T08:20:00Z"),
    updated_at: new Date("2025-05-10T08:20:00Z"),
  },
  {
    id: "evi_05",
    account_id: "acc_hetzner",
    headline: "Hetzner opens new data center in Falkenstein with 10,000 server capacity",
    description:
      "Company announcement of a major new data center facility in Falkenstein, Germany. The expansion will require procurement of server components, storage drives, and networking equipment at scale.",
    raw_excerpt:
      "Our new DC7 facility in Falkenstein will house over 10,000 servers, featuring our latest in-house designed server platform with NVMe-only storage...",
    source_url: "https://www.hetzner.com/news/dc7-falkenstein",
    source_type: "company_site",
    signal_direction: "positive",
    signal_category: "expansion_signal",
    reliability_score: 92,
    hardware_categories: ["server", "ssd", "networking"],
    detected_at: new Date("2025-03-20T07:00:00Z"),
    created_at: new Date("2025-03-20T07:30:00Z"),
    updated_at: new Date("2025-03-20T07:30:00Z"),
  },
  {
    id: "evi_06",
    account_id: "acc_ovhcloud",
    headline: "OVHcloud Q1 2025 earnings: increased CapEx for server manufacturing",
    description:
      "SEC-equivalent filing (AMF) from OVHcloud's quarterly earnings showing a 35% year-over-year increase in capital expenditure, primarily driven by expanded in-house server manufacturing capacity.",
    raw_excerpt:
      "Capital expenditure for Q1 FY2025 reached EUR 142M, up 35% YoY, driven by investments in our Croix manufacturing facility and new NVMe storage platform rollout...",
    source_url:
      "https://corporate.ovhcloud.com/en/investors/q1-2025-results",
    source_type: "sec_filing",
    signal_direction: "positive",
    signal_category: "budget_signal",
    reliability_score: 97,
    hardware_categories: ["server", "ssd", "memory"],
    detected_at: new Date("2025-05-05T16:00:00Z"),
    created_at: new Date("2025-05-05T16:30:00Z"),
    updated_at: new Date("2025-05-05T16:30:00Z"),
  },
];
