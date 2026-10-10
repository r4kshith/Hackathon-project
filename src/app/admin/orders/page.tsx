import { tenantData } from "../../../lib/tenant";
import { OrdersManager } from "../../../components/admin/orders-manager";

export default async function OrdersPage() {
  const scoped = await tenantData();
  const orders = await scoped.orders.list();
  const serializable = orders.map((order) => ({ ...order, subtotal: Number(order.subtotal), shipping: Number(order.shipping), total: Number(order.total), items: order.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice), lineTotal: Number(item.lineTotal) })) }));
  return <OrdersManager orders={serializable} />;
}
