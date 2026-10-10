import { z } from "zod";

export const assistantTools = {
  top_products: z.object({ period: z.enum(["week", "month", "all"]), limit: z.number().int().min(1).max(10) }).strict(),
  low_stock: z.object({ threshold: z.number().int().min(0).max(100) }).strict(),
  revenue_compare: z.object({ periodA: z.enum(["this_week", "last_week", "this_month", "last_month"]), periodB: z.enum(["this_week", "last_week", "this_month", "last_month"]) }).strict(),
  orders_by_status: z.object({}).strict(),
  sales_by_category: z.object({}).strict(),
  recent_orders: z.object({ limit: z.number().int().min(1).max(10) }).strict(),
  customer_count: z.object({}).strict(),
};
export type AssistantToolName = keyof typeof assistantTools;
export function questionPolicy(question: string): "allow" | "deny" | "unsupported" {
  const q = question.toLowerCase();
  if (/\b(delete|remove|update|change|cancel|edit)\b/.test(q)) return "deny";
  if (/\b(another|other|competitor|someone else's|store b|different store)\b/.test(q)) return "deny";
  if (/\b(top|best.?sell|selling|product\w*|stock|inventory|restock|revenue|sales|order\w*|categor\w*|customer\w*|week|month)\b/.test(q)) return "allow";
  return "unsupported";
}
