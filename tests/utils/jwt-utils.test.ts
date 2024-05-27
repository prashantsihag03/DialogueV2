import JwtUtils from '../../utils/jwt-utils'
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken'
import { jest } from '@jest/globals'
import SessionsModel from '../../models/user/sessions'
import { ACCESS_TOKEN_EXPIRATION, JWT_SECRET, REFRESH_TOKEN_EXPIRATION } from '../../utils/jwt-utils/contants'

jest.mock('jsonwebtoken')
jest.mock('../../models/user/sessions')

const MOCK_USERNAME = 'mockUsername'
const MOCK_JWT_SIGN_TOKEN = 'mockJwtSignToken'

describe('JWT Utils Test Suite', () => {
  describe('generateJwtToken', () => {
    it('should return access and refresh token', async () => {
      const mockJwtSign = jest
        .fn<(payload: string | Buffer | object, secretOrPrivateKey: Secret, options?: SignOptions) => string>()
        .mockReturnValue(MOCK_JWT_SIGN_TOKEN)

      jest.spyOn(SessionsModel, 'storeSession').mockImplementation(jest.fn<typeof SessionsModel.storeSession>())
      jest.spyOn(jwt, 'sign').mockImplementation(mockJwtSign)

      const result = await JwtUtils.generateJwtToken(MOCK_USERNAME)

      expect(result).toHaveProperty('accessToken')
      expect(result.accessToken).toBe(MOCK_JWT_SIGN_TOKEN)
      expect(result).toHaveProperty('refreshToken')
      expect(result.refreshToken).toBe(MOCK_JWT_SIGN_TOKEN)
    })

    it('should generate access tokens with correct data', async () => {
      const mockJwtSign = jest
        .fn<(payload: string | Buffer | object, secretOrPrivateKey: Secret, options?: SignOptions) => string>()
        .mockReturnValue(MOCK_JWT_SIGN_TOKEN)

      jest.spyOn(SessionsModel, 'storeSession').mockImplementation(jest.fn<typeof SessionsModel.storeSession>())
      jest.spyOn(jwt, 'sign').mockImplementation(mockJwtSign)

      const result = await JwtUtils.generateJwtToken(MOCK_USERNAME)

      expect(mockJwtSign).toHaveBeenCalledTimes(2)
      expect(mockJwtSign).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ username: MOCK_USERNAME }),
        JWT_SECRET,
        expect.objectContaining({ expiresIn: Number(ACCESS_TOKEN_EXPIRATION) })
      )

      expect(result).toHaveProperty('accessToken')
      expect(result.accessToken).toBe(MOCK_JWT_SIGN_TOKEN)
    })

    it('should generate refresh tokens with correct data', async () => {
      const mockJwtSign = jest
        .fn<(payload: string | Buffer | object, secretOrPrivateKey: Secret, options?: SignOptions) => string>()
        .mockReturnValue(MOCK_JWT_SIGN_TOKEN)

      jest.spyOn(SessionsModel, 'storeSession').mockImplementation(jest.fn<typeof SessionsModel.storeSession>())
      jest.spyOn(jwt, 'sign').mockImplementation(mockJwtSign)

      const result = await JwtUtils.generateJwtToken(MOCK_USERNAME)

      expect(mockJwtSign).toHaveBeenCalledTimes(2)
      expect(mockJwtSign).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ username: MOCK_USERNAME }),
        JWT_SECRET,
        expect.objectContaining({ expiresIn: Number(REFRESH_TOKEN_EXPIRATION) })
      )

      expect(result).toHaveProperty('refreshToken')
      expect(result.refreshToken).toBe(MOCK_JWT_SIGN_TOKEN)
    })

    it('should call storeSession to store refresh token in database', async () => {
      const mockStoreSession = jest.fn<typeof SessionsModel.storeSession>()
      const mockJwtSign = jest
        .fn<(payload: string | Buffer | object, secretOrPrivateKey: Secret, options?: SignOptions) => string>()
        .mockReturnValue(MOCK_JWT_SIGN_TOKEN)

      jest.spyOn(jwt, 'sign').mockImplementation(mockJwtSign)
      jest.spyOn(SessionsModel, 'storeSession').mockImplementation(mockStoreSession)

      const result = await JwtUtils.generateJwtToken(MOCK_USERNAME)

      expect(result).toStrictEqual({ accessToken: MOCK_JWT_SIGN_TOKEN, refreshToken: MOCK_JWT_SIGN_TOKEN })

      expect(mockStoreSession).toHaveBeenCalled()
      expect(mockStoreSession).toHaveBeenCalledTimes(1)

      expect(mockStoreSession).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: MOCK_JWT_SIGN_TOKEN,
          createdAt: expect.anything(),
          pkid: 'USER#mockUsername',
          skid: `SESSION#${MOCK_JWT_SIGN_TOKEN}`
        })
      )
    })
  })

  describe('validateAccessToken', () => {
    it('should return decoded jwt data when jwt is successfully verified', async () => {
      const mockAccessToken = JwtUtils.createAccessToken(MOCK_USERNAME)

      const result = await JwtUtils.validateAccessToken(mockAccessToken)

      expect(result).toHaveProperty('decoded')
      expect(result.decoded).toHaveProperty('username', MOCK_USERNAME)
      expect(result).toHaveProperty('expired', false)
    })

    it('should return expired true and decoded null when accessToken is expired', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new jwt.TokenExpiredError('expired mock message', new Date())
      })

      const mockAccessToken = JwtUtils.createAccessToken(MOCK_USERNAME)

      const result = await JwtUtils.validateAccessToken(mockAccessToken)

      expect(result).toHaveProperty('expired', true)
      expect(result).toHaveProperty('decoded')
      expect(result.decoded).toBeNull()
    })

    it('should throw error when jwt verification throws non token expiration error', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('non expiration mock error')
      })

      const mockAccessToken = JwtUtils.createAccessToken(MOCK_USERNAME)

      await expect(JwtUtils.validateAccessToken(mockAccessToken)).rejects.toThrow('non expiration mock error')
    })
  })

  describe('validateRefreshToken', () => {
    it('should call verify function', async () => {
      const mockVerify = jest.fn().mockImplementation(() => {
        throw new Error('random error')
      })
      jest.spyOn(jwt, 'verify').mockImplementation(mockVerify)

      await JwtUtils.validateRefreshToken('mockRefreshToken', MOCK_USERNAME)

      expect(mockVerify).toHaveBeenCalled()
      expect(mockVerify).toHaveBeenCalledWith('mockRefreshToken', expect.anything())
    })

    it('should call getSession when refreshToken verification is successful', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        return 'mock'
      })
      const mockGetSession = jest.fn<typeof SessionsModel.getSession>().mockResolvedValue({ $metadata: {} })
      jest.spyOn(SessionsModel, 'getSession').mockImplementation(mockGetSession)

      await JwtUtils.validateRefreshToken('mockRefreshToken', MOCK_USERNAME)

      expect(mockGetSession).toHaveBeenCalled()
      expect(mockGetSession).toHaveBeenCalledWith(MOCK_USERNAME, 'mockRefreshToken')
    })

    it('should return true when valid refresh token is provided that is also stored in sessions', async () => {
      const mockRefreshToken = JwtUtils.createRefreshToken(MOCK_USERNAME)
      jest.spyOn(SessionsModel, 'getSession').mockResolvedValue({
        $metadata: {},
        Item: {
          sessionId: mockRefreshToken,
          username: MOCK_USERNAME
        }
      })

      const result = await JwtUtils.validateRefreshToken(mockRefreshToken, MOCK_USERNAME)

      expect(result).toBe(true)
    })

    it('should return false when in-valid refresh token is provided', async () => {
      const result = await JwtUtils.validateRefreshToken('invalidRefreshToken', MOCK_USERNAME)
      expect(result).toBe(false)
    })

    it('should return false when valid refresh token is provided but is not stored in sessions', async () => {
      const mockRefreshToken = JwtUtils.createRefreshToken(MOCK_USERNAME)
      jest.spyOn(SessionsModel, 'getSession').mockResolvedValue({
        $metadata: {},
        Item: {
          sessionId: 'differentRefreshToken',
          username: MOCK_USERNAME
        }
      })

      const result = await JwtUtils.validateRefreshToken(mockRefreshToken, MOCK_USERNAME)
      expect(result).toBe(false)
    })

    it('should return false when getSession throws error', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        return 'mock'
      })
      const mockGetSession = jest.fn<typeof SessionsModel.getSession>().mockRejectedValue(new Error('failed!'))
      jest.spyOn(SessionsModel, 'getSession').mockImplementation(mockGetSession)

      const result = await JwtUtils.validateRefreshToken('mockRefreshToken', MOCK_USERNAME)

      expect(result).toBe(false)
    })

    it('should return false when getSession rejects', async () => {
      const mockResponse: any = {}
      const mockRefreshToken = JwtUtils.createRefreshToken(MOCK_USERNAME)
      jest.spyOn(SessionsModel, 'getSession').mockRejectedValue({
        $response: mockResponse,
        Item: {
          sessionId: mockRefreshToken,
          username: MOCK_USERNAME
        }
      })

      const result = await JwtUtils.validateRefreshToken(mockRefreshToken, MOCK_USERNAME)

      expect(result).toBe(false)
    })

    it('should return false when verify throws error', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('failed!')
      })

      const result = await JwtUtils.validateRefreshToken('mockRefreshToken', MOCK_USERNAME)

      expect(result).toBe(false)
    })
  })

  describe('createAccessToken', () => {
    it('should call jwt.sign with correct data', () => {
      const mockJwtSign = jest
        .fn<(payload: string | Buffer | object, secretOrPrivateKey: Secret, options?: SignOptions) => string>()
        .mockReturnValue(MOCK_JWT_SIGN_TOKEN)

      jest.spyOn(jwt, 'sign').mockImplementation(mockJwtSign)

      const result = JwtUtils.createAccessToken(MOCK_USERNAME)

      expect(mockJwtSign).toHaveBeenCalledTimes(1)
      expect(mockJwtSign).toHaveBeenCalledWith({ username: MOCK_USERNAME }, JWT_SECRET, {
        expiresIn: Number(ACCESS_TOKEN_EXPIRATION)
      })
      expect(result).toBe(MOCK_JWT_SIGN_TOKEN)
    })

    it('should throw error when jwt.sign throws error', () => {
      const mockJwtSign = jest
        .fn<(payload: string | Buffer | object, secretOrPrivateKey: Secret, options?: SignOptions) => string>()
        .mockImplementation(() => {
          throw new Error('any error')
        })

      jest.spyOn(jwt, 'sign').mockImplementation(mockJwtSign)

      expect(() => {
        JwtUtils.createAccessToken(MOCK_USERNAME)
      }).toThrowError('any error')
    })
  })

  describe('createRefreshToken', () => {
    it('should call jwt.sign with correct data', () => {
      const mockJwtSign = jest
        .fn<(payload: string | Buffer | object, secretOrPrivateKey: Secret, options?: SignOptions) => string>()
        .mockReturnValue(MOCK_JWT_SIGN_TOKEN)

      jest.spyOn(jwt, 'sign').mockImplementation(mockJwtSign)

      const result = JwtUtils.createRefreshToken(MOCK_USERNAME)

      expect(mockJwtSign).toHaveBeenCalledTimes(1)
      expect(mockJwtSign).toHaveBeenCalledWith({ username: MOCK_USERNAME }, JWT_SECRET, {
        expiresIn: Number(REFRESH_TOKEN_EXPIRATION)
      })
      expect(result).toBe(MOCK_JWT_SIGN_TOKEN)
    })

    it('should throw error when jwt.sign throws error', () => {
      const mockJwtSign = jest
        .fn<(payload: string | Buffer | object, secretOrPrivateKey: Secret, options?: SignOptions) => string>()
        .mockImplementation(() => {
          throw new Error('any error')
        })

      jest.spyOn(jwt, 'sign').mockImplementation(mockJwtSign)

      expect(() => {
        JwtUtils.createRefreshToken(MOCK_USERNAME)
      }).toThrowError('any error')
    })
  })

  describe('createToken', () => {
    it('should call jwt.sign with correct data', () => {
      const mockJwtSign = jest.fn().mockReturnValue('mockToken')
      jest.spyOn(jwt, 'sign').mockImplementation(mockJwtSign)

      const mockJwtData = { username: MOCK_USERNAME }
      const mockJwtSignOptions = { expiresIn: 100 }

      const result = JwtUtils.createToken(mockJwtData, mockJwtSignOptions)

      expect(mockJwtSign).toHaveBeenCalled()
      expect(mockJwtSign).toHaveBeenCalledWith(mockJwtData, JWT_SECRET, mockJwtSignOptions)
      expect(result).toBe('mockToken')
    })

    it('should throw error when jwt.sign throws error', () => {
      jest.spyOn(jwt, 'sign').mockImplementation(() => {
        throw new Error('any error')
      })
      const mockJwtData = { username: MOCK_USERNAME }
      const mockJwtSignOptions = { expiresIn: 100 }

      expect(() => {
        JwtUtils.createToken(mockJwtData, mockJwtSignOptions)
      }).toThrowError()
    })
  })

  describe('decodeAccessToken', () => {
    it('should call jwt.decode with correct data', () => {
      const mockJwtDecode = jest.fn<typeof jwt.decode>().mockReturnValue('mockDecoded')
      jest.spyOn(jwt, 'decode').mockImplementation(mockJwtDecode)

      const mockAccessToken = 'mockAccessToken'
      const result = JwtUtils.decodeAccessToken(mockAccessToken)

      expect(mockJwtDecode).toHaveBeenCalled()
      expect(mockJwtDecode).toHaveBeenCalledWith(mockAccessToken, { json: true })
      expect(result).toBe('mockDecoded')
    })

    it('should return data in correct format', () => {
      const mockAccessToken = JwtUtils.createAccessToken('mockUsername')
      const result = JwtUtils.decodeAccessToken(mockAccessToken)

      expect(result).toHaveProperty('username', 'mockUsername')
    })

    it('should throw error when jwt.decode throws error', () => {
      jest.spyOn(jwt, 'decode').mockImplementation(() => {
        throw new Error('any error')
      })
      expect(() => {
        JwtUtils.decodeAccessToken('mockAccessToken')
      }).toThrowError()
    })
  })
})
