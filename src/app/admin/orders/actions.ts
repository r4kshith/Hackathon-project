"use server";

import { z } from "zod";
import { OrderStatus } from "../../../generated/prisma/enums";
import { tenantData } from "../../../lib/tenant";

const statusSchema = z.enum(["PLACED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]);
export async function updateOrderStatusAction(id: string, rawStatus: unknown) {
  const parsed = statusSchema.safeParse(rawStatus);
  if (!parsed.success) return { error: "Choose a valid order status." };
  const scoped = await tenantData();
  const updated = await scoped.orders.updateStatus(id, parsed.data as OrderStatus);
  return updated ? { ok: true } : { error: "That order was not found in this store." };
}
