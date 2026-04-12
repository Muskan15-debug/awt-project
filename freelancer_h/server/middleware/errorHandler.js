export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    // Mongoose validation error
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ message: 'Validation error', errors });
  }

  if (err.code === 11000) {
    // Duplicate key error
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ message: `${field} already exists` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  res.status(500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
};
