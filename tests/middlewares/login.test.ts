import bcrypt from 'bcrypt'
import AuthUtils from '../../utils/auth-utils'
import UserModel from '../../models/user/users'
import { jest } from '@jest/globals'
import { authenticateLoginCredentials, rejectInValidLoginCredentials } from '../../middlewares/login'
import { type GetCommandOutput } from '@aws-sdk/lib-dynamodb'

jest.mock('bcrypt')

describe('Login Middleware Test suite', () => {
  describe('rejectInValidLoginCredentials', () => {
    it('should send 400 status code when request does not contain body', () => {
      const mockSend = jest.fn()
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend
      })
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        status: mockStatus
      }

      rejectInValidLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockSend).toHaveBeenCalledWith('Validation failure. Please provide valid data.')
    })

    it('should send 400 status code when request body does not contain username and password', () => {
      const mockSend = jest.fn()
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend
      })
      const mockReq: any = {
        body: {}
      }
      const mockNext = jest.fn()
      const mockRes: any = {
        status: mockStatus
      }

      rejectInValidLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockSend).toHaveBeenCalledWith('Validation failure. Please provide valid data.')
    })

    it('should send 401 status code when request body contains invalid credentials', () => {
      const spiedGetValidCredentials = jest.spyOn(AuthUtils, 'getValidatedCredentials')
      const mockGetValidCredentials = jest.fn<typeof AuthUtils.getValidatedCredentials>().mockReturnValue(null)
      spiedGetValidCredentials.mockImplementation(mockGetValidCredentials)

      const mockSendStatus = jest.fn()
      const mockReq: any = {
        body: {
          username: 'anything',
          password: 'anything'
        }
      }
      const mockNext = jest.fn()
      const mockRes: any = {
        sendStatus: mockSendStatus
      }

      rejectInValidLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockSendStatus).toHaveBeenCalledWith(401)
    })

    it('Should assign validatedCredentials to response.locals and call next function when request body contains valid credentials', () => {
      const spiedGetValidCredentials = jest.spyOn(AuthUtils, 'getValidatedCredentials')
      const mockGetValidCredentials = jest.fn<typeof AuthUtils.getValidatedCredentials>().mockReturnValue({
        username: 'mockValidatedUsername',
        password: 'mockValidatedPassword'
      })
      spiedGetValidCredentials.mockImplementation(mockGetValidCredentials)

      const mockSendStatus = jest.fn()
      const mockReq: any = {
        body: {
          username: 'anything',
          password: 'anything'
        }
      }
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {},
        sendStatus: mockSendStatus
      }

      rejectInValidLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockSendStatus).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockRes.locals).toHaveProperty('validatedCredentials')
      expect(mockRes.locals.validatedCredentials).toHaveProperty('username', 'mockValidatedUsername')
      expect(mockRes.locals.validatedCredentials).toHaveProperty('password', 'mockValidatedPassword')
    })
  })

  describe('authenticateLoginCredentials', () => {
    it('should send 401 status when response.locals.validated is NOT already set', async () => {
      const mockSend = jest.fn()
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend
      })
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {},
        status: mockStatus
      }

      await authenticateLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockSend).toHaveBeenCalledWith({ data: {}, error: 'Something went wrong. Please try again later.' })
    })

    it('should send 500 status when response.locals.validated.username is NOT already set', async () => {
      const mockSend = jest.fn()
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend
      })
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          validatedCredentials: {}
        },
        status: mockStatus
      }

      await authenticateLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockSend).toHaveBeenCalledWith({ data: {}, error: 'Something went wrong. Please try again later.' })
    })

    it('should send 500 status when response.locals.validated.password is NOT already set', async () => {
      const mockSend = jest.fn()
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend
      })
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockUsername'
          }
        },
        status: mockStatus
      }

      await authenticateLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockSend).toHaveBeenCalledWith({ data: {}, error: 'Something went wrong. Please try again later.' })
    })

    it('should call getUser when username and password in response.locals.validated are set', async () => {
      const spiedGetUser = jest.spyOn(UserModel, 'getUser')
      const mockGetUserOutput: GetCommandOutput = {
        $metadata: {},
        ConsumedCapacity: {},
        Item: undefined
      }
      const mockGetUser = jest.fn<typeof UserModel.getUser>().mockResolvedValue(mockGetUserOutput)
      spiedGetUser.mockImplementation(mockGetUser)

      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername',
            password: 'mockPassword'
          }
        },
        sendStatus: mockSendStatus
      }

      await authenticateLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockGetUser).toHaveBeenCalledTimes(1)
      expect(mockGetUser).toHaveBeenCalledWith('mockValidatedUsername')
    })

    it('should send 401 status when result from getUser is undefined Item', async () => {
      const spiedGetUser = jest.spyOn(UserModel, 'getUser')
      const mockGetUserOutput: GetCommandOutput = {
        $metadata: {},
        ConsumedCapacity: {},
        Item: undefined
      }
      const mockGetUser = jest.fn<typeof UserModel.getUser>().mockResolvedValue(mockGetUserOutput)
      spiedGetUser.mockImplementation(mockGetUser)

      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername',
            password: 'mockValidatedPassword'
          }
        },
        sendStatus: mockSendStatus
      }

      await authenticateLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockSendStatus).toHaveBeenCalledWith(401)
      expect(mockGetUser).toHaveBeenCalledTimes(1)
      expect(mockGetUser).toHaveBeenCalledWith('mockValidatedUsername')
    })

    it('should send 401 status when result.Item from getUser has undefined/null username', async () => {
      const spiedGetUser = jest.spyOn(UserModel, 'getUser')
      const mockGetUserOutput: GetCommandOutput = {
        $metadata: {},
        ConsumedCapacity: {},
        Item: {}
      }
      const mockGetUser = jest.fn<typeof UserModel.getUser>().mockResolvedValue(mockGetUserOutput)
      spiedGetUser.mockImplementation(mockGetUser)

      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername',
            password: 'mockValidatedPassword'
          }
        },
        sendStatus: mockSendStatus
      }

      await authenticateLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockSendStatus).toHaveBeenCalledWith(401)
      expect(mockGetUser).toHaveBeenCalledTimes(1)
      expect(mockGetUser).toHaveBeenCalledWith('mockValidatedUsername')
    })

    it('should call bcrypt.compare when result from getUser returns valid data', async () => {
      const spiedGetUser = jest.spyOn(UserModel, 'getUser')
      const mockGetUserOutput: GetCommandOutput = {
        $metadata: {},
        ConsumedCapacity: {},
        Item: {
          username: 'mockValidatedUsername',
          password: 'encryptedUserPassword'
        }
      }
      const mockGetUser = jest.fn<typeof UserModel.getUser>().mockResolvedValue(mockGetUserOutput)
      spiedGetUser.mockImplementation(mockGetUser)

      const spiedBcryptCompare = jest.spyOn(bcrypt, 'compare')
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      const mockBcryptCompare = jest.fn().mockImplementation(async () => await Promise.resolve(false))
      spiedBcryptCompare.mockImplementation(mockBcryptCompare)

      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername',
            password: 'mockValidatedPassword'
          }
        },
        sendStatus: mockSendStatus
      }

      await authenticateLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockBcryptCompare).toHaveBeenCalledTimes(1)
      expect(mockBcryptCompare).toHaveBeenCalledWith('mockValidatedPassword', 'encryptedUserPassword')
    })

    it('should remove password from response and getUser result when bcrypt.compare returns true', async () => {
      const mockGetUserItem = {
        username: 'mockValidatedUsername',
        password: 'encryptedUserPassword'
      }
      const spiedGetUser = jest.spyOn(UserModel, 'getUser')
      const mockGetUserOutput: GetCommandOutput = {
        $metadata: {},
        ConsumedCapacity: {},
        Item: mockGetUserItem
      }
      const mockGetUser = jest.fn<typeof UserModel.getUser>().mockResolvedValue(mockGetUserOutput)
      spiedGetUser.mockImplementation(mockGetUser)

      const spiedBcryptCompare = jest.spyOn(bcrypt, 'compare')
      const mockBcryptCompare = jest.fn().mockImplementation(async () => await Promise.resolve(true))
      spiedBcryptCompare.mockImplementation(mockBcryptCompare)

      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername',
            password: 'mockValidatedPassword'
          }
        },
        sendStatus: mockSendStatus
      }

      await authenticateLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockGetUserItem.password).toBeUndefined()
      expect(mockRes.locals.validatedCredentials.password).toBeUndefined()
    })

    it('should username from getUser to response.local.authenticated and call Next function when bcrypt.compare returns true', async () => {
      const mockGetUserItem = {
        username: 'mockValidatedUsername',
        password: 'encryptedUserPassword'
      }
      const spiedGetUser = jest.spyOn(UserModel, 'getUser')
      const mockGetUserOutput: GetCommandOutput = {
        $metadata: {},
        ConsumedCapacity: {},
        Item: mockGetUserItem
      }
      const mockGetUser = jest.fn<typeof UserModel.getUser>().mockResolvedValue(mockGetUserOutput)
      spiedGetUser.mockImplementation(mockGetUser)

      const spiedBcryptCompare = jest.spyOn(bcrypt, 'compare')
      const mockBcryptCompare = jest.fn().mockImplementation(async () => await Promise.resolve(true))
      spiedBcryptCompare.mockImplementation(mockBcryptCompare)

      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername',
            password: 'mockValidatedPassword'
          }
        },
        sendStatus: mockSendStatus
      }

      await authenticateLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockRes.locals.authenticated).toBe(mockGetUserItem.username)
    })

    it('should send 401 status when anything throws an error', async () => {
      const spiedGetUser = jest.spyOn(UserModel, 'getUser')
      spiedGetUser.mockImplementation(async () => {
        throw new Error('random error')
      })

      const spiedBcryptCompare = jest.spyOn(bcrypt, 'compare')
      const mockBcryptCompare = jest.fn().mockImplementation(async () => await Promise.resolve(false))
      spiedBcryptCompare.mockImplementation(mockBcryptCompare)

      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername',
            password: 'mockValidatedPassword'
          }
        },
        sendStatus: mockSendStatus
      }

      await authenticateLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockNext).not.toHaveBeenCalledTimes(1)
      expect(mockBcryptCompare).not.toHaveBeenCalledTimes(1)
      expect(mockSendStatus).toHaveBeenCalledTimes(1)
      expect(mockSendStatus).toHaveBeenCalledWith(401)
    })
  })
})
