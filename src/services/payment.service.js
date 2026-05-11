import { env } from "../config/env.js";

export function createMockPaymentLink(order) {
  return {
    provider: "MOCK",
    status: "PENDING",
    amount: order.totalAmount,
    paymentUrl: `${env.appUrl}/api/payments/mock/${order.id}`
  };
}
