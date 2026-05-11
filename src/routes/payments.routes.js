import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { emitAdminEvent } from "../lib/socket.js";

export const paymentsRouter = Router();

paymentsRouter.get("/mock/:orderId", async (req, res, next) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.orderId },
      data: {
        paymentStatus: "PAID",
        payment: {
          update: { status: "PAID" }
        }
      },
      include: {
        items: { include: { product: true } },
        payment: true
      }
    });

    emitAdminEvent("order:paid", order);

    res.send(`
      <!doctype html>
      <html lang="ru">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Оплата прошла</title>
          <link rel="stylesheet" href="/css/styles.css" />
        </head>
        <body class="payment-page kiosk-body">
          <main class="payment-success">
            <p class="micro-label">Мок-оплата</p>
            <h1>Оплата принята</h1>
            <p>Заказ #${order.id.slice(-6).toUpperCase()} подтверждён. Мы уже видим его в кондитерской.</p>
            <a class="action-button hot" href="/">Вернуться в витрину</a>
          </main>
        </body>
      </html>
    `);
  } catch (error) {
    next(error);
  }
});
