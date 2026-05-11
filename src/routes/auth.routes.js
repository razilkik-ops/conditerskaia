import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.schema.js";

export const authRouter = Router();

function sessionUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin
  };
}

authRouter.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const email = req.validated.body.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return res.status(409).json({ message: "Пользователь с таким email уже зарегистрирован" });
    }

    const user = await prisma.user.create({
      data: {
        name: req.validated.body.name.trim(),
        email,
        phone: req.validated.body.phone?.trim() || null,
        passwordHash: await hashPassword(req.validated.body.password)
      }
    });

    await prisma.order.updateMany({
      where: {
        userId: null,
        customerEmail: { equals: email, mode: "insensitive" }
      },
      data: { userId: user.id }
    });

    req.session.user = sessionUser(user);
    res.status(201).json({ user: req.session.user });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const email = req.validated.body.email.trim().toLowerCase();
    const { password } = req.validated.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }

    await prisma.order.updateMany({
      where: {
        userId: null,
        customerEmail: { equals: email, mode: "insensitive" }
      },
      data: { userId: user.id }
    });

    req.session.user = sessionUser(user);

    res.json({ user: req.session.user });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Вы вышли из аккаунта" });
  });
});

authRouter.get("/me", (req, res) => {
  res.json({ user: req.session?.user || null });
});
