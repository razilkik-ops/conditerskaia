export function requireAdmin(req, res, next) {
  if (req.session?.user?.isAdmin) return next();

  return res.status(401).json({
    message: "Нужен вход администратора"
  });
}

export function requireUser(req, res, next) {
  if (req.session?.user?.id) return next();

  return res.status(401).json({
    message: "Войдите в аккаунт"
  });
}

export function optionalUser(req, _res, next) {
  req.user = req.session?.user || null;
  next();
}
