import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateOrderStatusSchema } from "../validators/order.schema.js";
import { listOrders, updateOrder } from "../services/order.service.js";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get("/orders", async (_req, res, next) => {
  try {
    res.json({ orders: await listOrders() });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/orders/:id", validate(updateOrderStatusSchema), async (req, res, next) => {
  try {
    const order = await updateOrder(req.validated.params.id, req.validated.body);
    res.json({ order });
  } catch (error) {
    next(error);
  }
});
