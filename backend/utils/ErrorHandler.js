class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super();
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = ErrorHandler;
