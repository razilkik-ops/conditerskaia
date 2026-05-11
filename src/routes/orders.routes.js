import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { optionalUser, requireUser } from "../middleware/auth.js";
import { createOrderSchema } from "../validators/order.schema.js";
import { createOrder, listUserOrders } from "../services/order.service.js";

export const ordersRouter = Router();

ordersRouter.get("/my", requireUser, async (req, res, next) => {
  try {
    res.json({ orders: await listUserOrders(req.session.user.id) });
  } catch (error) {
    next(error);
  }
});

ordersRouter.post("/", optionalUser, validate(createOrderSchema), async (req, res, next) => {
  try {
    const order = await createOrder(req.validated.body, req.user?.id || null);
    res.status(201).json({
      message: "Заказ создан. Оплатите онлайн и получите подтверждение заказа.",
      order,
      paymentUrl: order.payment?.paymentUrl
    });
  } catch (error) {
    next(error);
  }
});
