/* eslint-disable @typescript-eslint/space-before-function-paren */
interface CustomErrorDetails {
  code: number
  internalMsg?: string
  data?: any
}

class CustomError extends Error {
  details: CustomErrorDetails

  constructor(message: string, details: CustomErrorDetails) {
    super(message)
    this.details = details
    Object.setPrototypeOf(this, CustomError.prototype)
  }
}

export default CustomError
