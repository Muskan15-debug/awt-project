export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.parse(req.body);
      req.validatedBody = result;
      next();
    } catch (error) {
      const errors = error.errors?.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.parse(req.query);
      req.validatedQuery = result;
      next();
    } catch (error) {
      const errors = error.errors?.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ message: 'Invalid query parameters', errors });
    }
  };
};
