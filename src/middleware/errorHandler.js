export function notFound(_req, res) {
  res.status(404).json({ message: "Маршрут не найден" });
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;

  if (process.env.NODE_ENV !== "test") {
    console.error(error);
  }

  res.status(status).json({
    message: error.publicMessage || "Что-то пошло не так. Попробуйте ещё раз.",
    details: process.env.NODE_ENV === "production" ? undefined : error.message
  });
}
