import { prisma } from "../lib/prisma.js";
import { emitAdminEvent } from "../lib/socket.js";
import { assertCartAvailability, toDateOnly } from "./availability.service.js";
import { createMockPaymentLink } from "./payment.service.js";

function optionExtra(selectedOptions = {}) {
  return Number(selectedOptions.extraPrice || 0);
}

export async function createOrder(input, userId = null) {
  await assertCartAvailability(input.items);

  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((item) => item.productId) } }
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  const preparedItems = input.items.map((item) => {
    const product = productMap.get(item.productId);
    const unitPrice = product.price + optionExtra(item.selectedOptions);
    const totalPrice = unitPrice * item.quantity;

    return {
      productId: item.productId,
      quantity: item.quantity,
      selectedDate: toDateOnly(item.selectedDate),
      selectedOptions: item.selectedOptions || {},
      unitPrice,
      totalPrice
    };
  });

  const totalAmount = preparedItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        orderType: input.orderType,
        fulfillmentType: input.fulfillmentType,
        deliveryAddress: input.fulfillmentType === "DELIVERY" ? input.deliveryAddress : null,
        pickupDateTime: new Date(input.pickupDateTime),
        comment: input.comment || null,
        totalAmount,
        items: { create: preparedItems }
      },
      include: {
        items: { include: { product: true } }
      }
    });

    const payment = createMockPaymentLink(created);

    return tx.order.update({
      where: { id: created.id },
      data: {
        payment: { create: payment }
      },
      include: {
        items: { include: { product: true } },
        payment: true
      }
    });
  });

  emitAdminEvent("order:created", order);
  return order;
}

export async function listOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: true } },
      payment: true
    }
  });
}

export async function listUserOrders(userId) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: true } },
      payment: true
    }
  });
}

export async function updateOrder(id, data) {
  const order = await prisma.order.update({
    where: { id },
    data,
    include: {
      items: { include: { product: true } },
      payment: true
    }
  });

  emitAdminEvent("order:updated", order);
  return order;
}
