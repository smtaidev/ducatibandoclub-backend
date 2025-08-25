class ApiError extends Error {
  public statusCode: number;
  public errorData?: any;

  constructor(statusCode: number, message: string, stack = "") {
    super(message);
    this.statusCode = statusCode;

    // If stack is a JSON string, treat it as error data
    if (stack && stack.startsWith('{')) {
      try {
        this.errorData = JSON.parse(stack);
        Error.captureStackTrace(this, this.constructor);
      } catch (e) {
        this.stack = stack;
      }
    } else if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
