import Jwt from '../../utils/jwt-utils'
import SessionUtils from '../../utils/session-utils'
import SessionModel from '../../models/user/sessions'
import { jest } from '@jest/globals'
import AuthMdw from '../../middlewares/auth'
import { SESSION_COOKIE_NAME } from '../../constants.js'
import { type DeleteCommandOutput } from '@aws-sdk/lib-dynamodb'

describe('Auth Middleware Test Suite', () => {
  describe('validateTokens', () => {
    it('should call extractTokens with correct argument', async () => {
      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens')

      const mockReq: any = {}
      const mockRes: any = {}
      const mockNext = jest.fn()
      const mockExtractTokens = jest.fn<typeof SessionUtils.extractTokens>().mockReturnValue(null)
      spyExtractTokens.mockImplementation(mockExtractTokens)

      await AuthMdw.validateTokens(mockReq, mockRes, mockNext)

      expect(mockExtractTokens).toHaveBeenCalled()
      expect(mockExtractTokens).toHaveBeenCalledWith(mockReq)
    })

    it('should add sessionTokens to the response.locals when session tokens are successfully extracted from request', async () => {
      const mockReq: any = {}
      const mockRes: any = {
        locals: {}
      }
      const mockNext = jest.fn()

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens')
      const mockExtractTokens = jest
        .fn<typeof SessionUtils.extractTokens>()
        .mockReturnValue({ accessToken: 'xyz', refreshToken: 'abc' })
      spyExtractTokens.mockImplementation(mockExtractTokens)

      const spyValidateAccessToken = jest.spyOn(Jwt, 'validateAccessToken')
      const mockValidateAccessToken = jest
        .fn<typeof Jwt.validateAccessToken>()
        .mockResolvedValue({ decoded: null, expired: false })
      spyValidateAccessToken.mockImplementation(mockValidateAccessToken)

      await AuthMdw.validateTokens(mockReq, mockRes, mockNext)

      expect(mockRes.locals.sessionTokens).toHaveProperty('accessToken', 'xyz')
      expect(mockRes.locals.sessionTokens).toHaveProperty('refreshToken', 'abc')
    })

    it('should not add sessionTokens to response.locals.sessionTokens next when sessionTokens are not found', async () => {
      const mockReq: any = {}
      const mockRes: any = {
        locals: {}
      }
      const mockNext = jest.fn()

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens')
      const mockExtractTokens = jest.fn<typeof SessionUtils.extractTokens>().mockReturnValue(null)
      spyExtractTokens.mockImplementation(mockExtractTokens)

      await AuthMdw.validateTokens(mockReq, mockRes, mockNext)

      expect(mockRes.locals.sessionTokens).toBeUndefined()
      expect(mockNext).toHaveBeenCalled()
    })

    it('should respond with 500 status when extractTokens throws error', async () => {
      const mockSend = jest.fn()
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend
      })
      const mockReq: any = {}
      const mockRes: any = {
        locals: {},
        status: mockStatus,
        send: mockSend,
        end: () => {}
      }
      const mockNext = jest.fn()

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens')
      spyExtractTokens.mockImplementation(() => {
        throw new Error('new error')
      })

      await AuthMdw.validateTokens(mockReq, mockRes, mockNext)

      expect(mockRes.locals.sessionTokens).toBeUndefined()
      expect(mockRes.locals.authenticated).toBeUndefined()
      expect(mockRes.locals.jwt).toBeUndefined()
      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockSend).toHaveBeenCalledWith('Something went wrong! Please try again later!')
    })

    it('should call next when extractTokens returns null', async () => {
      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens')

      const mockReq: any = {}
      const mockRes: any = {}
      const mockNext = jest.fn()
      const mockExtractTokens = jest.fn<typeof SessionUtils.extractTokens>().mockReturnValue(null)
      spyExtractTokens.mockImplementation(mockExtractTokens)

      await AuthMdw.validateTokens(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should call next when extractTokens returns session tokens', async () => {
      const mockReq: any = {}
      const mockRes: any = {
        locals: {}
      }
      const mockNext = jest.fn()

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens')
      const mockExtractTokens = jest
        .fn<typeof SessionUtils.extractTokens>()
        .mockReturnValue({ accessToken: 'xyz', refreshToken: 'abc' })
      spyExtractTokens.mockImplementation(mockExtractTokens)

      const spyValidateAccessToken = jest.spyOn(Jwt, 'validateAccessToken')
      const mockValidateAccessToken = jest
        .fn<typeof Jwt.validateAccessToken>()
        .mockResolvedValue({ decoded: null, expired: false })
      spyValidateAccessToken.mockImplementation(mockValidateAccessToken)

      await AuthMdw.validateTokens(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should call validateAccessToken with correct argument when extractTokens returns session tokens', async () => {
      const mockReq: any = {}
      const mockRes: any = {
        locals: {}
      }
      const mockNext = jest.fn()

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens')
      const mockExtractTokens = jest
        .fn<typeof SessionUtils.extractTokens>()
        .mockReturnValue({ accessToken: 'xyz', refreshToken: 'abc' })
      spyExtractTokens.mockImplementation(mockExtractTokens)

      const spyValidateAccessToken = jest.spyOn(Jwt, 'validateAccessToken')
      const mockValidateAccessToken = jest
        .fn<typeof Jwt.validateAccessToken>()
        .mockResolvedValue({ decoded: null, expired: false })
      spyValidateAccessToken.mockImplementation(mockValidateAccessToken)

      await AuthMdw.validateTokens(mockReq, mockRes, mockNext)

      expect(mockValidateAccessToken).toHaveBeenCalled()
      expect(mockValidateAccessToken).toHaveBeenCalledWith('xyz')
    })

    it('should not call validateAccessToken when extractTokens returns null', async () => {
      const mockReq: any = {}
      const mockRes: any = {
        locals: {}
      }
      const mockNext = jest.fn()

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens')
      const mockExtractTokens = jest.fn<typeof SessionUtils.extractTokens>().mockReturnValue(null)
      spyExtractTokens.mockImplementation(mockExtractTokens)

      const spyValidateAccessToken = jest.spyOn(Jwt, 'validateAccessToken')
      const mockValidateAccessToken = jest
        .fn<typeof Jwt.validateAccessToken>()
        .mockResolvedValue({ decoded: null, expired: false })
      spyValidateAccessToken.mockImplementation(mockValidateAccessToken)

      await AuthMdw.validateTokens(mockReq, mockRes, mockNext)

      expect(mockValidateAccessToken).not.toHaveBeenCalled()
    })

    it('should add authenticated and jwt data to response.locals when validateAccessToken returns decoded and non expired data', async () => {
      const mockReq: any = {}
      const mockRes: any = {
        locals: {}
      }
      const mockNext = jest.fn()

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens')
      const mockExtractTokens = jest
        .fn<typeof SessionUtils.extractTokens>()
        .mockReturnValue({ accessToken: 'xyz', refreshToken: 'abc' })
      spyExtractTokens.mockImplementation(mockExtractTokens)

      const spyValidateAccessToken = jest.spyOn(Jwt, 'validateAccessToken')
      const mockValidateAccessToken = jest
        .fn<typeof Jwt.validateAccessToken>()
        .mockResolvedValue({ decoded: 'blah', expired: false })
      spyValidateAccessToken.mockImplementation(mockValidateAccessToken)

      await AuthMdw.validateTokens(mockReq, mockRes, mockNext)

      expect(mockValidateAccessToken).toHaveBeenCalled()
      expect(mockRes.locals.authenticated).toBe(true)
      expect(mockRes.locals.jwt).toBe('blah')
    })

    it('should not add authenticated and jwt data to response.locals when validateAccessToken does not returns decoded and returns expired data', async () => {
      const mockReq: any = {}
      const mockRes: any = {
        locals: {}
      }
      const mockNext = jest.fn()

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens')
      const mockExtractTokens = jest
        .fn<typeof SessionUtils.extractTokens>()
        .mockReturnValue({ accessToken: 'xyz', refreshToken: 'abc' })
      spyExtractTokens.mockImplementation(mockExtractTokens)

      const spyValidateAccessToken = jest.spyOn(Jwt, 'validateAccessToken')
      const mockValidateAccessToken = jest
        .fn<typeof Jwt.validateAccessToken>()
        .mockResolvedValue({ decoded: null, expired: true })
      spyValidateAccessToken.mockImplementation(mockValidateAccessToken)

      await AuthMdw.validateTokens(mockReq, mockRes, mockNext)

      expect(mockValidateAccessToken).toHaveBeenCalled()
      expect(mockRes.locals.authenticated).toBeUndefined()
      expect(mockRes.locals.jwt).toBeUndefined()
    })

    it('should respond with 500 status when validateAccessToken throws error or rejects', async () => {
      const mockSend = jest.fn()
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend
      })
      const mockReq: any = {}
      const mockRes: any = {
        locals: {},
        status: mockStatus,
        send: mockSend,
        end: () => {}
      }
      const mockNext = jest.fn()

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens')
      const mockExtractTokens = jest
        .fn<typeof SessionUtils.extractTokens>()
        .mockReturnValue({ accessToken: 'xyz', refreshToken: 'abc' })
      spyExtractTokens.mockImplementation(mockExtractTokens)

      const spyValidateAccessToken = jest.spyOn(Jwt, 'validateAccessToken')
      const mockValidateAccessToken = jest.fn<typeof Jwt.validateAccessToken>().mockRejectedValue({ random: 'random' })
      spyValidateAccessToken.mockImplementation(mockValidateAccessToken)

      await AuthMdw.validateTokens(mockReq, mockRes, mockNext)

      expect(mockValidateAccessToken).toHaveBeenCalled()
      expect(mockRes.locals.authenticated).toBeUndefined()
      expect(mockRes.locals.jwt).toBeUndefined()
      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockSend).toHaveBeenCalledWith('Something went wrong! Please try again later!')
    })
  })

  describe('rejectUnAuthenticated', () => {
    it('should not call next when response.locals.authenticated is not already set', () => {
      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {},
        sendStatus: mockSendStatus
      }

      AuthMdw.rejectUnAuthenticated(mockReq, mockRes, mockNext)

      expect(mockSendStatus).toHaveBeenCalledTimes(1)
      expect(mockSendStatus).toHaveBeenCalledWith(401)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should call next when response.locals.authenticated is already set', () => {
      const mockSendStatus = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          authenticated: {
            username: 'blah'
          }
        },
        sendStatus: mockSendStatus
      }

      AuthMdw.rejectUnAuthenticated(mockReq, mockRes, mockNext)

      expect(mockSendStatus).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('redirectUnAuthenticated', () => {
    it('should call redirect() with correct argument when response.locals.authenticated is not already set', () => {
      const mockRedirect = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {},
        redirect: mockRedirect
      }

      AuthMdw.redirectUnAuthenticated(mockReq, mockRes, mockNext)

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith('/')
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should call next when response.locals.authenticated is already set', () => {
      const mockRedirect = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          authenticated: {
            username: 'blah'
          }
        },
        redirect: mockRedirect
      }

      AuthMdw.redirectUnAuthenticated(mockReq, mockRes, mockNext)

      expect(mockRedirect).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    describe('should clearCookie and redirect', () => {
      it('when refreshToken and decoded user id exists in response locals', async () => {
        const mockClearCookie = jest.fn()
        const mockRedirect = jest.fn()
        jest.spyOn(SessionModel, 'deleteSession').mockImplementation(jest.fn<typeof SessionModel.deleteSession>())

        const mockReq: any = {}
        const mockNext = jest.fn()
        const mockRes: any = {
          locals: {
            sessionTokens: {
              refreshToken: 'mockRefreshToken'
            },
            decoded: {
              userId: 'mockUserId'
            }
          },
          clearCookie: mockClearCookie,
          redirect: mockRedirect
        }

        await AuthMdw.logout(mockReq, mockRes, mockNext)

        expect(mockRedirect).toHaveBeenCalled()
        expect(mockRedirect).toHaveBeenCalledWith('/')
        expect(mockClearCookie).toHaveBeenCalled()
        expect(mockClearCookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME)
      })

      it('when refreshToken does not exists', async () => {
        const mockClearCookie = jest.fn()
        const mockRedirect = jest.fn()
        jest.spyOn(SessionModel, 'deleteSession').mockImplementation(jest.fn<typeof SessionModel.deleteSession>())

        const mockReq: any = {}
        const mockNext = jest.fn()
        const mockRes: any = {
          locals: {
            decoded: {
              userId: 'mockUserId'
            }
          },
          clearCookie: mockClearCookie,
          redirect: mockRedirect
        }

        await AuthMdw.logout(mockReq, mockRes, mockNext)

        expect(mockRedirect).toHaveBeenCalled()
        expect(mockRedirect).toHaveBeenCalledWith('/')
        expect(mockClearCookie).toHaveBeenCalled()
        expect(mockClearCookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME)
      })

      it('when decoded user id does not exists', async () => {
        const mockClearCookie = jest.fn()
        const mockRedirect = jest.fn()
        jest.spyOn(SessionModel, 'deleteSession').mockImplementation(jest.fn<typeof SessionModel.deleteSession>())

        const mockReq: any = {}
        const mockNext = jest.fn()
        const mockRes: any = {
          locals: {
            sessionTokens: {
              refreshToken: 'mockRefreshToken'
            }
          },
          clearCookie: mockClearCookie,
          redirect: mockRedirect
        }

        await AuthMdw.logout(mockReq, mockRes, mockNext)

        expect(mockRedirect).toHaveBeenCalled()
        expect(mockRedirect).toHaveBeenCalledWith('/')
        expect(mockClearCookie).toHaveBeenCalled()
        expect(mockClearCookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME)
      })
    })

    it('should call deleteSession if refreshToken and decoded userId exists', async () => {
      const spiedDeleteSession = jest.spyOn(SessionModel, 'deleteSession')
      const mockDeleteSessionOutput: DeleteCommandOutput = {
        $metadata: {
          httpStatusCode: 500
        },
        ConsumedCapacity: {}
      }

      const mockDeleteSession = jest.fn<typeof SessionModel.deleteSession>().mockResolvedValue(mockDeleteSessionOutput)
      spiedDeleteSession.mockImplementation(mockDeleteSession)

      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          sessionTokens: {
            refreshToken: 'mockRefreshToken'
          },
          decoded: {
            userId: 'mockUserId'
          }
        },
        clearCookie: () => {},
        redirect: () => {}
      }

      await AuthMdw.logout(mockReq, mockRes, mockNext)

      expect(mockDeleteSession).toHaveBeenCalled()
      expect(mockDeleteSession).toHaveBeenCalledWith('mockUserId', 'mockRefreshToken')
    })

    it('should send status 500 with correct message when error occurs', async () => {
      const mockStatus = jest.fn()
      const mockRedirect = jest.fn()
      const mockSend = jest.fn()
      jest.spyOn(SessionModel, 'deleteSession').mockImplementation(() => {
        console.log('Executing mock delete session')
        throw new Error('MockDeleteSession throws error')
      })

      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          sessionTokens: {
            refreshToken: 'mockRefreshToken'
          },
          decoded: {
            userId: 'mockUserId'
          }
        },
        clearCookie: () => {},
        redirect: mockRedirect,
        status: mockStatus,
        send: mockSend
      }

      await AuthMdw.logout(mockReq, mockRes, mockNext)

      expect(mockRedirect).not.toHaveBeenCalled()
      expect(mockStatus).toHaveBeenCalled()
      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockSend).toHaveBeenCalled()
      expect(mockSend).toHaveBeenCalledWith('Something went wrong. Please try again!')
    })
  })

  describe('register', () => {
    it('should redirect to home page when user is authenticated', () => {
      const mockRedirect = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          authenticated: true
        },
        redirect: mockRedirect
      }

      AuthMdw.register(mockReq, mockRes, mockNext)

      expect(mockRedirect).toHaveBeenCalled()
      expect(mockRedirect).toHaveBeenCalledWith('/home')
    })

    it('should send register page when user is not authenticated', () => {
      const mockSendFile = jest.fn()
      const mockRedirect = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {},
        redirect: mockRedirect,
        sendFile: mockSendFile
      }

      AuthMdw.register(mockReq, mockRes, mockNext)

      expect(mockRedirect).not.toHaveBeenCalled()
      expect(mockSendFile).toHaveBeenCalled()
      expect(mockSendFile).toHaveBeenCalledWith('register.html', { root: expect.stringContaining('public') })
    })
  })
})
