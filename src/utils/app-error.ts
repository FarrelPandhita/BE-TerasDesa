// app error handler to get rid of guessing status code
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message)
    // Restore prototype chain when extending built-in Error
    Object.setPrototypeOf(this, new.target.prototype)
    this.name = "AppError"
  }
}
