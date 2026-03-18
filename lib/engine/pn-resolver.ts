import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase/client";
import type { ComponentLookup } from "@/lib/types/pn-lookup";

// ---------------------------------------------------------------------------
// Known PN patterns — instant resolution with full spec data
// ---------------------------------------------------------------------------

const KNOWN_PATTERNS: Array<{
  pattern: RegExp;
  resolve: (pn: string, match: RegExpMatchArray) => Partial<ComponentLookup>;
}> = [
  // AMD EPYC 9454 tray PN
  {
    pattern: /^100-000000478$/,
    resolve: () => ({
      manufacturer: "AMD",
      category: "cpu",
      subcategory: "epyc",
      ecosystem: "amd",
      socket_platform: "SP5",
      description: "AMD EPYC 9454 48-Core Genoa",
      specs: {
        cores: 48,
        threads: 96,
        base_clock_ghz: 2.75,
        boost_clock_ghz: 3.8,
        tdp_watts: 290,
        cache_mb: 256,
        memory_channels: 12,
        generation: "4th Gen Genoa",
        target_segment: "datacenter general purpose",
        architecture: "Zen 4",
      },
    }),
  },
  // AMD EPYC generic tray PN format: 100-000000XXX
  {
    pattern: /^100-0000(\d{5})$/,
    resolve: (_pn, match) => ({
      manufacturer: "AMD",
      category: "cpu",
      subcategory: "epyc",
      ecosystem: "amd",
      socket_platform: "SP5",
      description: `AMD EPYC (tray PN ending ${match[1]})`,
      specs: { generation: "4th Gen Genoa", architecture: "Zen 4" },
    }),
  },
  // Intel Xeon - PK format
  {
    pattern: /^PK\d{13}$/,
    resolve: () => ({
      manufacturer: "Intel",
      category: "cpu",
      subcategory: "xeon",
      ecosystem: "intel",
      socket_platform: "LGA4677",
      description: "Intel Xeon Scalable Processor",
      specs: { generation: "5th Gen Emerald Rapids", architecture: "P-core" },
    }),
  },
  // Intel S-spec
  {
    pattern: /^SR[A-Z0-9]{3}$/,
    resolve: () => ({
      manufacturer: "Intel",
      category: "cpu",
      subcategory: "xeon",
      ecosystem: "intel",
      description: "Intel Xeon (S-spec)",
      specs: {},
    }),
  },
  // NVIDIA H100
  {
    pattern: /GPU-NV.*H100/i,
    resolve: () => ({
      manufacturer: "NVIDIA",
      category: "gpu",
      subcategory: "h100",
      ecosystem: "nvidia",
      socket_platform: "SXM5",
      description: "NVIDIA H100 SXM5 80GB",
      specs: {
        vram_gb: 80,
        memory_type: "HBM3",
        memory_bandwidth_gbps: 3350,
        tdp_watts: 700,
        fp8_tflops: 3958,
        interconnect: "NVLink 4.0",
        target_segment: "AI training and inference",
        architecture: "Hopper",
      },
    }),
  },
  // NVIDIA H200
  {
    pattern: /GPU-NV.*H200/i,
    resolve: () => ({
      manufacturer: "NVIDIA",
      category: "gpu",
      subcategory: "h200",
      ecosystem: "nvidia",
      socket_platform: "SXM5",
      description: "NVIDIA H200 SXM 141GB",
      specs: {
        vram_gb: 141,
        memory_type: "HBM3e",
        memory_bandwidth_gbps: 4800,
        tdp_watts: 700,
        interconnect: "NVLink 4.0",
        target_segment: "AI training, large language models",
        architecture: "Hopper",
      },
    }),
  },
  // NVIDIA B200
  {
    pattern: /GPU-NV.*B200/i,
    resolve: () => ({
      manufacturer: "NVIDIA",
      category: "gpu",
      subcategory: "b200",
      ecosystem: "nvidia",
      description: "NVIDIA B200 GPU",
      specs: {
        vram_gb: 192,
        memory_type: "HBM3e",
        tdp_watts: 1000,
        interconnect: "NVLink 5.0",
        target_segment: "AI training, next-gen inference",
        architecture: "Blackwell",
      },
    }),
  },
  // NVIDIA A100
  {
    pattern: /GPU-NV.*A100/i,
    resolve: () => ({
      manufacturer: "NVIDIA",
      category: "gpu",
      subcategory: "a100",
      ecosystem: "nvidia",
      socket_platform: "SXM4",
      description: "NVIDIA A100 SXM4 80GB",
      specs: {
        vram_gb: 80,
        memory_type: "HBM2e",
        memory_bandwidth_gbps: 2039,
        tdp_watts: 400,
        fp16_tflops: 312,
        interconnect: "NVLink 3.0",
        target_segment: "AI training and inference",
        architecture: "Ampere",
      },
    }),
  },
  // NVIDIA L40S
  {
    pattern: /GPU-NV.*L40/i,
    resolve: () => ({
      manufacturer: "NVIDIA",
      category: "gpu",
      subcategory: "l40s",
      ecosystem: "nvidia",
      socket_platform: "PCIe",
      description: "NVIDIA L40S PCIe 48GB",
      specs: {
        vram_gb: 48,
        memory_type: "GDDR6",
        tdp_watts: 350,
        form_factor: "PCIe dual-slot",
        target_segment: "inference, video processing",
        architecture: "Ada Lovelace",
      },
    }),
  },
  // Supermicro systems
  {
    pattern: /^SYS-(.+)/i,
    resolve: (_pn, match) => ({
      manufacturer: "Supermicro",
      category: "system",
      subcategory: "server",
      description: `Supermicro Server System ${match[1]}`,
      specs: {},
    }),
  },
  // Supermicro motherboards
  {
    pattern: /^MBD-(.+)/i,
    resolve: (_pn, match) => ({
      manufacturer: "Supermicro",
      category: "fru",
      subcategory: "motherboard",
      description: `Supermicro Motherboard ${match[1]}`,
      specs: {},
    }),
  },
  // Supermicro PSU
  {
    pattern: /^PWS-(.+)/i,
    resolve: (_pn, match) => ({
      manufacturer: "Supermicro",
      category: "fru",
      subcategory: "power_supply",
      description: `Supermicro Power Supply ${match[1]}`,
      specs: {},
    }),
  },
  // Supermicro AOC (network/riser cards)
  {
    pattern: /^AOC-(.+)/i,
    resolve: (_pn, match) => ({
      manufacturer: "Supermicro",
      category: "networking",
      subcategory: "add_on_card",
      description: `Supermicro Add-on Card ${match[1]}`,
      specs: {},
    }),
  },
  // Mellanox/NVIDIA ConnectX
  {
    pattern: /MCX([0-9]+)/i,
    resolve: (_pn, match) => ({
      manufacturer: "NVIDIA",
      category: "networking",
      subcategory: "connectx",
      ecosystem: "nvidia",
      description: `NVIDIA Mellanox ConnectX-${match[1]?.[0] || ""}`,
      specs: { type: "InfiniBand/Ethernet NIC" },
    }),
  },
  // Micron memory
  {
    pattern: /^MTA[0-9]/i,
    resolve: () => ({
      manufacturer: "Micron",
      category: "memory",
      subcategory: "ddr",
      description: "Micron Server Memory Module",
      specs: { type: "DDR5 RDIMM" },
    }),
  },
  // Samsung memory
  {
    pattern: /^M3[0-9]/i,
    resolve: () => ({
      manufacturer: "Samsung",
      category: "memory",
      subcategory: "ddr",
      description: "Samsung Server Memory Module",
      specs: { type: "DDR5 RDIMM" },
    }),
  },
];

// ---------------------------------------------------------------------------
// Anthropic client (lazy)
// ---------------------------------------------------------------------------

function getAnthropicClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key, maxRetries: 1, timeout: 30_000 });
}

// ---------------------------------------------------------------------------
// AI fallback resolver — uses web search to identify unknown PNs
// ---------------------------------------------------------------------------

async function resolveWithAI(pn: string): Promise<Partial<ComponentLookup>> {
  const client = getAnthropicClient();

  const prompt = `I need to identify this server/datacenter hardware part number: "${pn}"

Search the web to find what this part number is. Return the information in this EXACT JSON format (no markdown, no explanation, just the JSON):
{
  "manufacturer": "string",
  "model_name": "string",
  "category": "cpu|gpu|memory|ssd|networking|system|fru|other",
  "subcategory": "string (e.g. epyc, xeon, h100, ddr, connectx)",
  "socket_platform": "string or null",
  "ecosystem": "amd|intel|nvidia|other or null",
  "description": "Full product name/description",
  "specs": { ... any known specs like cores, threads, clock speeds, TDP, memory, etc }
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    tools: [{ type: "web_search_20250305" as const, name: "web_search" }],
    messages: [{ role: "user", content: prompt }],
  });

  // Handle continuation for web search tool use
  let finalResponse = response;
  let continuations = 0;
  while (finalResponse.stop_reason === "pause_turn" && continuations < 3) {
    continuations++;
    finalResponse = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      tools: [{ type: "web_search_20250305" as const, name: "web_search" }],
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: finalResponse.content },
      ],
    });
  }

  const textBlock = finalResponse.content.find((b) => b.type === "text");
  const rawText = textBlock && "text" in textBlock ? textBlock.text : "";

  // Extract JSON from the response
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      manufacturer: parsed.manufacturer || null,
      description: parsed.description || parsed.model_name || null,
      category: parsed.category || null,
      subcategory: parsed.subcategory || null,
      socket_platform: parsed.socket_platform || null,
      ecosystem: parsed.ecosystem || null,
      specs: parsed.specs || {},
    };
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

export async function resolvePN(partNumber: string): Promise<{
  component: ComponentLookup | null;
  resolved_by: string;
}> {
  const pn = partNumber.trim().toUpperCase();

  // 1. Check cache
  const { data: cached } = await supabase
    .from("component_lookups")
    .select("*")
    .eq("part_number", pn)
    .single();

  if (cached) {
    const row = cached as unknown as {
      id: string;
      part_number: string;
      manufacturer: string | null;
      description: string | null;
      category: string | null;
      subcategory: string | null;
      socket_platform: string | null;
      ecosystem: string | null;
      specs: Record<string, unknown>;
      source: string;
      created_at: string;
      updated_at: string;
    };
    return {
      component: {
        ...row,
        specs: row.specs ?? {},
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
      },
      resolved_by: "cache",
    };
  }

  // 2. Try pattern matching
  for (const { pattern, resolve } of KNOWN_PATTERNS) {
    const match = pn.match(pattern);
    if (match) {
      const resolved = resolve(pn, match);
      const component: ComponentLookup = {
        id: "",
        part_number: pn,
        manufacturer: resolved.manufacturer ?? null,
        description: resolved.description ?? null,
        category: resolved.category ?? null,
        subcategory: resolved.subcategory ?? null,
        socket_platform: resolved.socket_platform ?? null,
        ecosystem: resolved.ecosystem ?? null,
        specs: resolved.specs ?? {},
        source: "pattern",
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Cache it
      const { data: inserted } = await supabase
        .from("component_lookups")
        .insert({
          part_number: pn,
          manufacturer: component.manufacturer,
          description: component.description,
          category: component.category,
          subcategory: component.subcategory,
          socket_platform: component.socket_platform,
          ecosystem: component.ecosystem,
          specs: component.specs,
          source: "pattern",
        } as never)
        .select("id")
        .single();

      if (inserted) {
        component.id = (inserted as unknown as { id: string }).id;
      }

      return { component, resolved_by: "pattern" };
    }
  }

  // 3. AI fallback with web search
  try {
    console.log(`[pn-resolver] No pattern match for "${pn}", calling AI...`);
    const aiResolved = await resolveWithAI(pn);

    if (aiResolved.manufacturer || aiResolved.category) {
      const component: ComponentLookup = {
        id: "",
        part_number: pn,
        manufacturer: aiResolved.manufacturer ?? null,
        description: aiResolved.description ?? null,
        category: aiResolved.category ?? null,
        subcategory: aiResolved.subcategory ?? null,
        socket_platform: aiResolved.socket_platform ?? null,
        ecosystem: aiResolved.ecosystem ?? null,
        specs: aiResolved.specs ?? {},
        source: "ai_web_search",
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Cache it
      const { data: inserted } = await supabase
        .from("component_lookups")
        .insert({
          part_number: pn,
          manufacturer: component.manufacturer,
          description: component.description,
          category: component.category,
          subcategory: component.subcategory,
          socket_platform: component.socket_platform,
          ecosystem: component.ecosystem,
          specs: component.specs,
          source: "ai_web_search",
        } as never)
        .select("id")
        .single();

      if (inserted) {
        component.id = (inserted as unknown as { id: string }).id;
      }

      return { component, resolved_by: "ai_web_search" };
    }
  } catch (err) {
    console.error("[pn-resolver] AI resolution failed:", err);
  }

  // 4. No match at all
  return { component: null, resolved_by: "unresolved" };
}
