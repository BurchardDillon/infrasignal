import { z } from "zod";

export const rawArticleSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  body: z.string().min(20, "Body must be at least 20 characters"),
  source_url: z.url("Must be a valid URL"),
  source_name: z.string().min(1, "Source name is required"),
  published_at: z.string().min(1, "Published date is required"),
  mentioned_companies: z
    .string()
    .transform((val) =>
      val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),
});

export type RawArticleFormData = z.infer<typeof rawArticleSchema>;
