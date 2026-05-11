import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { availabilityQuerySchema } from "../validators/order.schema.js";
import { getDessertAvailability } from "../services/availability.service.js";

export const productsRouter = Router();

productsRouter.get("/", async (req, res, next) => {
  try {
    const type = req.query.type;
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        type: type === "CAKE" || type === "DESSERT" ? type : undefined
      },
      orderBy: [{ type: "asc" }, { createdAt: "desc" }],
      include: {
        cakeOptions: true
      }
    });

    res.json({ products });
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/availability", validate(availabilityQuerySchema), async (req, res, next) => {
  try {
    const { productId, date, quantity } = req.validated.query;
    const availability = await getDessertAvailability(productId, date, quantity);
    res.json({ availability });
  } catch (error) {
    next(error);
  }
});
