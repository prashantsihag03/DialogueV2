import * as ValidationUtils from '../../utils/validation-utils'
import { validateSignUpCredentials } from '../../middlewares/signup'

describe('Signup Middleware Test Suite', () => {
  describe('validateSignUpCredentials', () => {
    it('should send 400 status code with correct text when request does not contain body', async () => {
      const mockStatus = jest.fn()
      const mockSend = jest.fn()
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        status: mockStatus,
        send: mockSend
      }

      await validateSignUpCredentials(mockReq, mockRes, mockNext)

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockSend).toHaveBeenCalledWith('Malformed Request!')
    })

    it('should send 400 status code with correct text when request body does not contain required user details', async () => {
      const mockStatus = jest.fn()
      const mockSend = jest.fn()
      const mockReq: any = {
        body: {}
      }
      const mockNext = jest.fn()
      const mockRes: any = {
        status: mockStatus,
        send: mockSend
      }

      await validateSignUpCredentials(mockReq, mockRes, mockNext)

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockSend).toHaveBeenCalledWith('Required details missing!')
    })

    it('should not send 400 status code with text when request body contains required user details', async () => {
      const mockStatus = jest.fn()
      const mockSend = jest.fn()
      const mockReq: any = {
        body: {
          username: 'mockUsername',
          password: 'mockPassword',
          email: 'mockEmail',
          gender: 'mockGender'
        }
      }
      const mockNext = jest.fn()
      const mockRes: any = {
        status: mockStatus,
        send: mockSend
      }

      await validateSignUpCredentials(mockReq, mockRes, mockNext)

      expect(mockStatus).not.toHaveBeenCalledWith(400)
      expect(mockSend).not.toHaveBeenCalledWith('Required details missing!')
    })

    it('should validate user details by calling respective isValid function', async () => {
      const mockIsValidUsername = jest.fn().mockReturnValue(true)
      const mockisValidPassword = jest.fn().mockReturnValue(true)
      const mockisValidEmail = jest.fn().mockReturnValue(true)
      const mockisValidGender = jest.fn().mockReturnValue(false)

      jest.spyOn(ValidationUtils, 'isValidUsername').mockImplementation(mockIsValidUsername)
      jest.spyOn(ValidationUtils, 'isValidPassword').mockImplementation(mockisValidPassword)
      jest.spyOn(ValidationUtils, 'isValidEmail').mockImplementation(mockisValidEmail)
      jest.spyOn(ValidationUtils, 'isValidGender').mockImplementation(mockisValidGender)

      const mockStatus = jest.fn()
      const mockSend = jest.fn()
      const mockNext = jest.fn()
      const mockReq: any = {
        body: {
          username: 'mockUsername',
          password: 'mockPassword',
          email: 'mockEmail',
          gender: 'mockGender'
        }
      }
      const mockRes: any = {
        status: mockStatus,
        send: mockSend
      }

      await validateSignUpCredentials(mockReq, mockRes, mockNext)

      expect(mockIsValidUsername).toHaveBeenCalled()
      expect(mockIsValidUsername).toHaveBeenCalledWith('mockUsername')

      expect(mockisValidPassword).toHaveBeenCalled()
      expect(mockisValidPassword).toHaveBeenCalledWith('mockPassword')

      expect(mockisValidEmail).toHaveBeenCalled()
      expect(mockisValidEmail).toHaveBeenCalledWith('mockEmail')

      expect(mockisValidGender).toHaveBeenCalled()
      expect(mockisValidGender).toHaveBeenCalledWith('mockGender')
    })

    it('should send 401 status with correct text and not add validatedPotentialUserDetails parameter to response.locals object when any user details are invalid', async () => {
      jest.spyOn(ValidationUtils, 'isValidUsername').mockReturnValue(true)
      jest.spyOn(ValidationUtils, 'isValidPassword').mockReturnValue(true)
      jest.spyOn(ValidationUtils, 'isValidEmail').mockReturnValue(true)
      jest.spyOn(ValidationUtils, 'isValidGender').mockReturnValue(false)

      const mockStatus = jest.fn()
      const mockSend = jest.fn()
      const mockNext = jest.fn()
      const mockReq: any = {
        body: {
          username: 'mockUsername',
          password: 'mockPassword',
          email: 'mockEmail',
          gender: 'mockGender'
        }
      }
      const mockRes: any = {
        locals: {},
        status: mockStatus,
        send: mockSend
      }

      await validateSignUpCredentials(mockReq, mockRes, mockNext)

      expect(mockRes.locals.validatedPotentialUserDetails).toBeUndefined()
      expect(mockStatus).toHaveBeenCalledWith(401)
      expect(mockSend).toHaveBeenCalledWith('One or more details incorrect or missing!')
    })

    it('should call next function and pass on validated data along with hashed password via locals obj in response when all user provided details are valid', async () => {
      jest.spyOn(ValidationUtils, 'isValidUsername').mockReturnValue(true)
      jest.spyOn(ValidationUtils, 'isValidPassword').mockReturnValue(true)
      jest.spyOn(ValidationUtils, 'isValidEmail').mockReturnValue(true)
      jest.spyOn(ValidationUtils, 'isValidGender').mockReturnValue(true)

      const mockStatus = jest.fn()
      const mockSend = jest.fn()
      const mockNext = jest.fn()
      const mockReq: any = {
        body: {
          username: 'mockUsername',
          password: 'mockPassword',
          email: 'mockEmail',
          gender: 'mockGender'
        }
      }
      const mockRes: any = {
        locals: {},
        status: mockStatus,
        send: mockSend
      }

      await validateSignUpCredentials(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockSend).not.toHaveBeenCalled()
      expect(mockStatus).not.toHaveBeenCalled()
      expect(mockRes.locals.validatedPotentialUserDetails).not.toBeUndefined()

      expect(mockRes.locals.validatedPotentialUserDetails).toHaveProperty('username')
      expect(mockRes.locals.validatedPotentialUserDetails.username).toBe('mockUsername')

      expect(mockRes.locals.validatedPotentialUserDetails).toHaveProperty('password')
      expect(mockRes.locals.validatedPotentialUserDetails.password).not.toBe('mockPassword')

      expect(mockRes.locals.validatedPotentialUserDetails).toHaveProperty('email')
      expect(mockRes.locals.validatedPotentialUserDetails.email).toBe('mockEmail')

      expect(mockRes.locals.validatedPotentialUserDetails).toHaveProperty('friends')
      expect(mockRes.locals.validatedPotentialUserDetails.friends).toEqual([])

      expect(mockRes.locals.validatedPotentialUserDetails).toHaveProperty('gender')
      expect(mockRes.locals.validatedPotentialUserDetails.gender).toBe('mockGender')
    })
  })
})
