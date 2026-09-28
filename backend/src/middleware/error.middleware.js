function notFound(req, res, next) {
  res.status(404).json({ message: 'مسیر مورد نظر یافت نشد.' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'خطای داخلی سرور رخ داده است.',
  });
}

module.exports = { notFound, errorHandler };
