import { type Request } from 'express'

export interface CustomRequest extends Request {
  s3Path?: string
  fileNamePrefix?: string
}
