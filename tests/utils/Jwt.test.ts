// import * as JwtUtils from '../../utils/jwt-utils/index.js'
// import jwt, { TokenExpiredError } from 'jsonwebtoken'
// import * as SessionsModel from '../../models/session/sessions'
// import { type User } from '../../models.js'
// import { ACCESS_TOKEN_EXPIRATION, JWT_SECRET, REFRESH_TOKEN_EXPIRATION } from '../../utils/jwt-utils/contants'

// jest.mock('../../models/session/sessions')

// const MOCK_USERNAME = 'mockUsername'

// describe('JWT Utils Test Suite', () => {
//   describe('generateJwtToken', () => {
//     it('should return access and refresh token', async () => {
//       jest.spyOn(SessionsModel, 'storeSession').mockImplementation(jest.fn())

//       const mockUser: User = {
//         email: 'mockEmail@gmail.com',
//         gender: 'male',
//         password: 'mockPassword',
//         username: MOCK_USERNAME
//       }
//       const result = await JwtUtils.generateJwtToken(mockUser)

//       expect(result).toHaveProperty('accessToken')
//       expect(result.accessToken).toBeTruthy()
//       expect(result).toHaveProperty('refreshToken')
//       expect(result.refreshToken).toBeTruthy()
//     })

//     it('should call storeSession to store refresh token in database', async () => {
//       const mockStoreSession = jest.fn()
//       jest.spyOn(SessionsModel, 'storeSession').mockImplementation(mockStoreSession)

//       jest.spyOn(JwtUtils, 'createRefreshToken').mockReturnValue('mockRefreshToken')

//       const mockUser: User = {
//         email: 'mockEmail@gmail.com',
//         gender: 'male',
//         password: 'mockPassword',
//         username: MOCK_USERNAME
//       }
//       await JwtUtils.generateJwtToken(mockUser)

//       expect(mockStoreSession).toHaveBeenCalled()
//       expect(mockStoreSession).toHaveBeenCalledTimes(1)
//       expect(mockStoreSession).toHaveBeenCalledWith({ username: MOCK_USERNAME, sessionid: 'mockRefreshToken' })
//     })
//   })

//   describe('validateAccessToken', () => {
//     it('should return decoded jwt data when jwt is successfully verified', async () => {
//       const mockAccessToken = JwtUtils.createAccessToken(MOCK_USERNAME)

//       const result = await JwtUtils.validateAccessToken(mockAccessToken)

//       expect(result).toHaveProperty('decoded')
//       expect(result.decoded).toHaveProperty('username', MOCK_USERNAME)
//       expect(result).toHaveProperty('expired', false)
//     })

//     it('should return expired true and decoded null when accessToken is expired', async () => {
//       jest.spyOn(jwt, 'verify').mockImplementation(() => {
//         throw new TokenExpiredError('expired mock message', new Date())
//       })

//       const mockAccessToken = JwtUtils.createAccessToken(MOCK_USERNAME)

//       const result = await JwtUtils.validateAccessToken(mockAccessToken)

//       expect(result).toHaveProperty('expired', true)
//       expect(result).toHaveProperty('decoded')
//       expect(result.decoded).toBeNull()
//     })

//     it('should throw error when jwt verification throws non token expiration error', async () => {
//       jest.spyOn(jwt, 'verify').mockImplementation(() => {
//         throw new Error('non expiration mock error')
//       })

//       const mockAccessToken = JwtUtils.createAccessToken(MOCK_USERNAME)

//       await expect(JwtUtils.validateAccessToken(mockAccessToken)).rejects.toThrow('non expiration mock error')
//     })
//   })

//   describe('validateRefreshToken', () => {
//     it('should call verify function', async () => {
//       const mockVerify = jest.fn().mockImplementation(() => {
//         throw new Error('random error')
//       })
//       jest.spyOn(jwt, 'verify').mockImplementation(mockVerify)

//       await JwtUtils.validateRefreshToken('mockRefreshToken', MOCK_USERNAME)

//       expect(mockVerify).toHaveBeenCalled()
//       expect(mockVerify).toHaveBeenCalledWith('mockRefreshToken', expect.anything())
//     })

//     it('should call getSession when refreshToken verification is successful', async () => {
//       jest.spyOn(jwt, 'verify').mockImplementation(() => {
//         return 'mock'
//       })
//       const mockGetSession = jest.fn().mockRejectedValue(new Error('failed!'))
//       jest.spyOn(SessionsModel, 'getSession').mockImplementation(mockGetSession)

//       await JwtUtils.validateRefreshToken('mockRefreshToken', MOCK_USERNAME)

//       expect(mockGetSession).toHaveBeenCalled()
//       expect(mockGetSession).toHaveBeenCalledWith('mockRefreshToken')
//     })

//     it('should return true when valid refresh token is provided that is also stored in sessions', async () => {
//       const mockResponse: any = {}
//       const mockRefreshToken = JwtUtils.createRefreshToken(MOCK_USERNAME)
//       jest.spyOn(SessionsModel, 'getSession').mockResolvedValue({
//         $response: mockResponse,
//         Item: {
//           sessionId: mockRefreshToken,
//           username: MOCK_USERNAME
//         }
//       })

//       const result = await JwtUtils.validateRefreshToken(mockRefreshToken, MOCK_USERNAME)

//       expect(result).toBe(true)
//     })

//     it('should return false when in-valid refresh token is provided', async () => {
//       const result = await JwtUtils.validateRefreshToken('invalidRefreshToken', MOCK_USERNAME)
//       expect(result).toBe(false)
//     })

//     it('should return false when valid refresh token is provided but is not stored in sessions', async () => {
//       const mockResponse: any = {}
//       const mockRefreshToken = JwtUtils.createRefreshToken(MOCK_USERNAME)
//       jest.spyOn(SessionsModel, 'getSession').mockResolvedValue({
//         $response: mockResponse,
//         Item: {
//           sessionId: 'differentRefreshToken',
//           username: MOCK_USERNAME
//         }
//       })

//       const result = await JwtUtils.validateRefreshToken(mockRefreshToken, MOCK_USERNAME)
//       expect(result).toBe(false)
//     })

//     it('should return false when getSession throws error', async () => {
//       jest.spyOn(jwt, 'verify').mockImplementation(() => {
//         return 'mock'
//       })
//       const mockGetSession = jest.fn().mockImplementation(() => new Error('failed!'))
//       jest.spyOn(SessionsModel, 'getSession').mockImplementation(mockGetSession)

//       const result = await JwtUtils.validateRefreshToken('mockRefreshToken', MOCK_USERNAME)

//       expect(result).toBe(false)
//     })

//     it('should return false when getSession rejects', async () => {
//       const mockResponse: any = {}
//       const mockRefreshToken = JwtUtils.createRefreshToken(MOCK_USERNAME)
//       jest.spyOn(SessionsModel, 'getSession').mockRejectedValue({
//         $response: mockResponse,
//         Item: {
//           sessionId: mockRefreshToken,
//           username: MOCK_USERNAME
//         }
//       })

//       const result = await JwtUtils.validateRefreshToken(mockRefreshToken, MOCK_USERNAME)

//       expect(result).toBe(false)
//     })

//     it('should return false when verify throws error', async () => {
//       jest.spyOn(jwt, 'verify').mockImplementation(() => {
//         throw new Error('failed!')
//       })

//       const result = await JwtUtils.validateRefreshToken('mockRefreshToken', MOCK_USERNAME)

//       expect(result).toBe(false)
//     })
//   })

//   describe('createAccessToken', () => {
//     it('should call createToken function', () => {
//       const mockCreateToken = jest.fn().mockReturnValue('mockToken')
//       jest.spyOn(JwtUtils, 'createToken').mockImplementation(mockCreateToken)

//       const result = JwtUtils.createAccessToken(MOCK_USERNAME)

//       expect(mockCreateToken).toHaveBeenCalled()
//       expect(mockCreateToken).toHaveBeenCalledWith(
//         { username: MOCK_USERNAME },
//         { expiresIn: Number(ACCESS_TOKEN_EXPIRATION) }
//       )
//       expect(result).toBe('mockToken')
//     })

//     it('should throw error when createToken throws error', () => {
//       jest.spyOn(JwtUtils, 'createToken').mockImplementation(() => {
//         throw new Error('any error')
//       })
//       expect(() => {
//         JwtUtils.createAccessToken(MOCK_USERNAME)
//       }).toThrowError()
//     })
//   })

//   describe('createRefreshToken', () => {
//     it('should call createToken function', () => {
//       const mockCreateToken = jest.fn().mockReturnValue('mockToken')
//       jest.spyOn(JwtUtils, 'createToken').mockImplementation(mockCreateToken)

//       const result = JwtUtils.createRefreshToken(MOCK_USERNAME)

//       expect(mockCreateToken).toHaveBeenCalled()
//       expect(mockCreateToken).toHaveBeenCalledWith(
//         { username: MOCK_USERNAME },
//         { expiresIn: Number(REFRESH_TOKEN_EXPIRATION) }
//       )
//       expect(result).toBe('mockToken')
//     })

//     it('should throw error when createToken throws error', () => {
//       jest.spyOn(JwtUtils, 'createToken').mockImplementation(() => {
//         throw new Error('any error')
//       })
//       expect(() => {
//         JwtUtils.createRefreshToken(MOCK_USERNAME)
//       }).toThrowError()
//     })
//   })

//   describe('createToken', () => {
//     it('should call jwt.sign with correct data', () => {
//       const mockJwtSign = jest.fn().mockReturnValue('mockToken')
//       jest.spyOn(jwt, 'sign').mockImplementation(mockJwtSign)

//       const mockJwtData = { username: MOCK_USERNAME }
//       const mockJwtSignOptions = { expiresIn: 100 }

//       const result = JwtUtils.createToken(mockJwtData, mockJwtSignOptions)

//       expect(mockJwtSign).toHaveBeenCalled()
//       expect(mockJwtSign).toHaveBeenCalledWith(mockJwtData, JWT_SECRET, mockJwtSignOptions)
//       expect(result).toBe('mockToken')
//     })

//     it('should throw error when jwt.sign throws error', () => {
//       jest.spyOn(jwt, 'sign').mockImplementation(() => {
//         throw new Error('any error')
//       })
//       const mockJwtData = { username: MOCK_USERNAME }
//       const mockJwtSignOptions = { expiresIn: 100 }

//       expect(() => {
//         JwtUtils.createToken(mockJwtData, mockJwtSignOptions)
//       }).toThrowError()
//     })
//   })

//   describe('decodeAccessToken', () => {
//     it('should call jwt.decode with correct data', () => {
//       const mockJwtDecode = jest.fn().mockReturnValue('mockDecoded')
//       jest.spyOn(jwt, 'decode').mockImplementation(mockJwtDecode)

//       const mockAccessToken = 'mockAccessToken'
//       const result = JwtUtils.decodeAccessToken(mockAccessToken)

//       expect(mockJwtDecode).toHaveBeenCalled()
//       expect(mockJwtDecode).toHaveBeenCalledWith(mockAccessToken, { json: true })
//       expect(result).toBe('mockDecoded')
//     })

//     it('should return data in correct format', () => {
//       const mockAccessToken = JwtUtils.createAccessToken('mockUsername')
//       const result = JwtUtils.decodeAccessToken(mockAccessToken)

//       expect(result).toHaveProperty('username', 'mockUsername')
//     })

//     it('should throw error when jwt.decode throws error', () => {
//       jest.spyOn(jwt, 'decode').mockImplementation(() => {
//         throw new Error('any error')
//       })
//       expect(() => {
//         JwtUtils.decodeAccessToken('mockAccessToken')
//       }).toThrowError()
//     })
//   })
// })
