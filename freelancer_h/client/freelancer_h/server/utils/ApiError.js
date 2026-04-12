export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export const createError = (statusCode, message) => {
  return new ApiError(statusCode, message);
};
