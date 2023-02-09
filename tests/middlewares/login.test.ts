import * as bcrypt from 'bcrypt'
import * as AuthUtils from '../../utils/auth-utils'
import * as UserModel from '../../models/user/users'
import { authenticateLoginCredentials, rejectInValidLoginCredentials } from '../../middlewares/login'

jest.mock('bcrypt')

describe('Login Middleware Test suite', () => {
  describe('rejectInValidLoginCredentials', () => {
    it('should send 400 status code when request doesnt not contain body', () => {
      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        sendStatus: mockSendStatus
      }

      rejectInValidLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockSendStatus).toHaveBeenCalledWith(400)
    })

    it('should send 400 status code when request body does not contain username and password', () => {
      const mockSendStatus = jest.fn()
      const mockReq: any = {
        body: {}
      }
      const mockNext = jest.fn()
      const mockRes: any = {
        sendStatus: mockSendStatus
      }

      rejectInValidLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockSendStatus).toHaveBeenCalledWith(400)
    })

    it('should send 401 status code when request body contains invalid credentials', () => {
      const spiedGetValidCredentials = jest.spyOn(AuthUtils, 'getValidatedCredentials')
      const mockGetValidCredentials = jest.fn().mockReturnValue(null)
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
      const mockGetValidCredentials = jest.fn().mockReturnValue({
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
      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {},
        sendStatus: mockSendStatus
      }

      await authenticateLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockSendStatus).toHaveBeenCalledWith(401)
    })

    it('should send 401 status when response.locals.validated.username is NOT already set', async () => {
      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          validatedCredentials: {}
        },
        sendStatus: mockSendStatus
      }

      await authenticateLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockSendStatus).toHaveBeenCalledWith(401)
    })

    it('should call getUser when response.locals.validated.username is set', async () => {
      const spiedGetUser = jest.spyOn(UserModel, 'getUser')
      const mockGetUser = jest.fn().mockResolvedValue(null)
      spiedGetUser.mockImplementation(mockGetUser)

      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername'
          }
        },
        sendStatus: mockSendStatus
      }

      await authenticateLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockGetUser).toHaveBeenCalledTimes(1)
      expect(mockGetUser).toHaveBeenCalledWith('mockValidatedUsername')
    })

    it('should send 401 status when result from getUser is undefined', async () => {
      const spiedGetUser = jest.spyOn(UserModel, 'getUser')
      const mockGetUser = jest.fn().mockResolvedValue(null)
      spiedGetUser.mockImplementation(mockGetUser)

      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername'
          }
        },
        sendStatus: mockSendStatus
      }

      await authenticateLoginCredentials(mockReq, mockRes, mockNext)

      expect(mockSendStatus).toHaveBeenCalledWith(401)
      expect(mockGetUser).toHaveBeenCalledTimes(1)
      expect(mockGetUser).toHaveBeenCalledWith('mockValidatedUsername')
    })

    it('should send 401 status when result from getUser has undefined/null Item', async () => {
      const spiedGetUser = jest.spyOn(UserModel, 'getUser')
      const mockGetUser = jest.fn().mockResolvedValue({})
      spiedGetUser.mockImplementation(mockGetUser)

      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername'
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
      const mockGetUser = jest.fn().mockResolvedValue({
        Item: {}
      })
      spiedGetUser.mockImplementation(mockGetUser)

      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername'
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
      const mockGetUser = jest.fn().mockResolvedValue({
        Item: {
          username: 'mockValidatedUsername',
          password: 'encryptedUserPassword'
        }
      })
      spiedGetUser.mockImplementation(mockGetUser)

      const spiedBcryptCompare = jest.spyOn(bcrypt, 'compare')
      const mockBcryptCompare = jest.fn().mockResolvedValue(false)
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
      const mockGetUserData = {
        Item: {
          username: 'mockValidatedUsername',
          password: 'encryptedUserPassword'
        }
      }
      const spiedGetUser = jest.spyOn(UserModel, 'getUser')
      const mockGetUser = jest.fn().mockResolvedValue(mockGetUserData)
      spiedGetUser.mockImplementation(mockGetUser)

      const spiedBcryptCompare = jest.spyOn(bcrypt, 'compare')
      const mockBcryptCompare = jest.fn().mockResolvedValue(true)
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

      expect(mockGetUserData.Item.password).toBeUndefined()
      expect(mockRes.locals.validatedCredentials.password).toBeUndefined()
    })

    it('should add Item from getUser to response.local.authenticated and call Next function when bcrypt.compare returns true', async () => {
      const mockGetUserData = {
        Item: {
          username: 'mockValidatedUsername',
          password: 'encryptedUserPassword'
        }
      }
      const spiedGetUser = jest.spyOn(UserModel, 'getUser')
      const mockGetUser = jest.fn().mockResolvedValue(mockGetUserData)
      spiedGetUser.mockImplementation(mockGetUser)

      const spiedBcryptCompare = jest.spyOn(bcrypt, 'compare')
      const mockBcryptCompare = jest.fn().mockResolvedValue(true)
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
      expect(mockRes.locals.authenticated).toBe(mockGetUserData.Item)
    })

    it('should send 401 status when anything throws an error', async () => {
      const spiedGetUser = jest.spyOn(UserModel, 'getUser')
      spiedGetUser.mockImplementation(async () => {
        throw new Error('random error')
      })

      const spiedBcryptCompare = jest.spyOn(bcrypt, 'compare')
      const mockBcryptCompare = jest.fn().mockResolvedValue(false)
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
