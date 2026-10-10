ALTER TYPE "PaymentMethod" ADD VALUE 'RAZORPAY';

ALTER TABLE "Order"
  ADD COLUMN "gatewayOrderId" TEXT,
  ADD COLUMN "gatewayPaymentId" TEXT;

CREATE UNIQUE INDEX "Order_gatewayOrderId_key" ON "Order"("gatewayOrderId");
CREATE UNIQUE INDEX "Order_gatewayPaymentId_key" ON "Order"("gatewayPaymentId");
