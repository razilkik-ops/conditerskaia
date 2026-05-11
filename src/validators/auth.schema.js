import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Введите имя").max(80, "Имя слишком длинное"),
    email: z.string().email("Введите корректный email"),
    phone: z.string().min(7, "Введите телефон").max(40, "Телефон слишком длинный").optional().nullable(),
    password: z.string().min(6, "Минимум 6 символов").max(120, "Пароль слишком длинный")
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Введите корректный email"),
    password: z.string().min(6, "Минимум 6 символов")
  })
});
