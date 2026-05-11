import { prisma } from "../lib/prisma.js";

export function toDateOnly(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error("Некорректная дата");
    error.status = 400;
    error.publicMessage = "Выберите корректную дату";
    throw error;
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function assertDateIsAvailable(dateValue) {
  const date = toDateOnly(dateValue);
  const unavailable = await prisma.unavailableDate.findUnique({ where: { date } });

  if (unavailable) {
    const error = new Error(`Дата недоступна: ${unavailable.reason}`);
    error.status = 409;
    error.publicMessage = `Эта дата недоступна: ${unavailable.reason}`;
    throw error;
  }

  return date;
}

export async function getDessertAvailability(productId, dateValue, requestedQuantity = 1) {
  const date = await assertDateIsAvailable(dateValue);
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product || !product.isActive) {
    const error = new Error("Товар не найден");
    error.status = 404;
    error.publicMessage = "Товар не найден";
    throw error;
  }

  if (product.type !== "DESSERT") {
    return {
      productId,
      date,
      type: product.type,
      quantityAvailable: null,
      canOrder: true,
      message: "Для тортов проверяется только доступность даты"
    };
  }

  const inventory = await prisma.inventory.findUnique({
    where: { productId_date: { productId, date } }
  });

  const ordered = await prisma.orderItem.aggregate({
    where: {
      productId,
      selectedDate: date,
      order: { status: { not: "CANCELLED" } }
    },
    _sum: { quantity: true }
  });

  const baseQuantity = inventory?.quantityAvailable || 0;
  const reserved = ordered._sum.quantity || 0;
  const quantityAvailable = Math.max(baseQuantity - reserved, 0);

  return {
    productId,
    date,
    type: product.type,
    quantityAvailable,
    canOrder: quantityAvailable >= requestedQuantity,
    message: quantityAvailable >= requestedQuantity
      ? "Можно забрать уже сегодня"
      : "На эту дату десерт закончился"
  };
}

export async function assertCartAvailability(items) {
  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });

    if (!product || !product.isActive) {
      const error = new Error("Один из товаров больше недоступен");
      error.status = 409;
      error.publicMessage = "Один из товаров больше недоступен";
      throw error;
    }

    await assertDateIsAvailable(item.selectedDate);

    if (product.type === "DESSERT") {
      const availability = await getDessertAvailability(
        item.productId,
        item.selectedDate,
        item.quantity
      );

      if (!availability.canOrder) {
        const error = new Error(`${product.name}: недостаточно остатков`);
        error.status = 409;
        error.publicMessage = `${product.name}: осталось ${availability.quantityAvailable} шт.`;
        throw error;
      }
    }
  }
}
