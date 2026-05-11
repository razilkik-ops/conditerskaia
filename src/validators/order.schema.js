import { z } from "zod";

const fulfillmentType = z.enum(["DELIVERY", "PICKUP"]);

const cartItem = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  selectedDate: z.string().min(10),
  selectedOptions: z.record(z.any()).optional().default({})
});

export const availabilityQuerySchema = z.object({
  query: z.object({
    productId: z.string().min(1),
    date: z.string().min(10),
    quantity: z.coerce.number().int().min(1).default(1)
  })
});

export const createOrderSchema = z.object({
  body: z.object({
    customerName: z.string().min(2, "Введите имя"),
    customerEmail: z.string().email("Введите корректный email"),
    customerPhone: z.string().min(7, "Введите телефон"),
    orderType: z.enum(["STANDARD", "CUSTOM"]).default("STANDARD"),
    fulfillmentType,
    deliveryAddress: z.string().optional().nullable(),
    pickupDateTime: z.string().min(10),
    comment: z.string().max(800).optional().nullable(),
    items: z.array(cartItem).min(1, "Корзина пуста")
  }).superRefine((data, ctx) => {
    if (data.fulfillmentType === "DELIVERY" && !data.deliveryAddress?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryAddress"],
        message: "Введите адрес доставки"
      });
    }
  })
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    status: z.enum(["NEW", "CONFIRMED", "IN_PROGRESS", "READY", "COMPLETED", "CANCELLED"]).optional(),
    paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional()
  }).refine((data) => data.status || data.paymentStatus, {
    message: "Передайте новый статус заказа или оплаты"
  })
});
