export class ApiError extends Error {
  public statusCode: number;
  public code?: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code?: string
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}