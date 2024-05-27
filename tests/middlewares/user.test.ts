import { updateSingleUserSetting } from '../../middlewares/user'
import UserModel from '../../models/user/users'
import { jest } from '@jest/globals'

jest.mock('../../models/user/users')

describe('User Middleware Test', () => {
  describe('updateSingleUserSetting', () => {
    it('should throw error when provided setting key and value is invalid', async () => {
      const mockSend = jest.fn()
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend
      })
      const mockReq: any = {
        params: {
          settingKey: 'invalidSettingKeyName',
          settingValue: 'invalidSettingKeyValue'
        }
      }
      const mockRes: any = {
        send: mockSend,
        status: mockStatus
      }
      const mockNext = jest.fn()

      await updateSingleUserSetting(mockReq, mockRes, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockStatus).toHaveBeenCalledTimes(1)
      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend).toHaveBeenCalledWith({ data: {}, error: 'Invalid setting properties provided' })
    })

    it('should throw error when setting key and value not provided', async () => {
      const mockSend = jest.fn()
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend
      })
      const mockReq: any = {
        params: {}
      }
      const mockRes: any = {
        send: mockSend,
        status: mockStatus
      }
      const mockNext = jest.fn()

      await updateSingleUserSetting(mockReq, mockRes, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockStatus).toHaveBeenCalledTimes(1)
      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend).toHaveBeenCalledWith({ data: {}, error: 'Invalid setting properties provided' })
    })

    it('should throw error when req params not provided', async () => {
      const mockSend = jest.fn()
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend
      })
      const mockReq: any = {}
      const mockRes: any = {
        send: mockSend,
        status: mockStatus
      }
      const mockNext = jest.fn()

      await updateSingleUserSetting(mockReq, mockRes, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockStatus).toHaveBeenCalledTimes(1)
      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend).toHaveBeenCalledWith({ data: {}, error: 'Invalid setting properties provided' })
    })

    it('should NOT call updateSingleUserSettingDb when invalid setting key and value is provided', async () => {
      const mockSend = jest.fn()
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend
      })
      const mockReq: any = {}
      const mockRes: any = {
        send: mockSend,
        status: mockStatus
      }
      const mockNext = jest.fn()

      const mockUpdateSingleUserSettingDb = jest.fn<typeof UserModel.updateSingleUserSettingDb>()
      jest.spyOn(UserModel, 'updateSingleUserSettingDb').mockImplementation(mockUpdateSingleUserSettingDb)

      await updateSingleUserSetting(mockReq, mockRes, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockUpdateSingleUserSettingDb).not.toHaveBeenCalled()

      expect(mockStatus).toHaveBeenCalledTimes(1)
      expect(mockStatus).toHaveBeenCalledWith(400)

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend).toHaveBeenCalledWith({ data: {}, error: 'Invalid setting properties provided' })
    })

    it('should call updateSingleUserSettingDb when valid setting key and value is provided', async () => {
      const mockSend = jest.fn()
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend
      })
      const mockReq: any = {
        params: {
          settingKey: 'enterSendsMessage',
          settingValue: true
        }
      }
      const mockRes: any = {
        locals: {
          jwt: {
            username: 'mockUsername'
          }
        },
        send: mockSend,
        status: mockStatus
      }
      const mockNext = jest.fn()

      const mockUpdateSingleUserSettingDb = jest.fn<typeof UserModel.updateSingleUserSettingDb>().mockResolvedValue({
        $metadata: {
          httpStatusCode: 200
        }
      })
      jest.spyOn(UserModel, 'updateSingleUserSettingDb').mockImplementation(mockUpdateSingleUserSettingDb)

      await updateSingleUserSetting(mockReq, mockRes, mockNext)

      expect(mockUpdateSingleUserSettingDb).toHaveBeenCalled()

      expect(mockStatus).not.toHaveBeenCalled()
      expect(mockSend).not.toHaveBeenCalled()
    })

    it('should throw CustomError when updateSingleUserSettingDb returns non-200 status code', async () => {
      const mockSend = jest.fn()
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend
      })
      const mockReq: any = {
        params: {
          settingKey: 'enterSendsMessage',
          settingValue: 'true'
        }
      }
      const mockRes: any = {
        locals: {
          jwt: {
            username: 'mockUsername'
          }
        },
        send: mockSend,
        status: mockStatus
      }
      const mockNext = jest.fn()

      const mockUpdateSingleUserSettingDb = jest.fn<typeof UserModel.updateSingleUserSettingDb>().mockResolvedValue({
        $metadata: {
          httpStatusCode: 400
        }
      })
      jest.spyOn(UserModel, 'updateSingleUserSettingDb').mockImplementation(mockUpdateSingleUserSettingDb)

      await updateSingleUserSetting(mockReq, mockRes, mockNext)

      expect(mockUpdateSingleUserSettingDb).toHaveBeenCalled()
      expect(mockUpdateSingleUserSettingDb).toHaveBeenCalledWith('mockUsername', 'enterSendsMessage', true)

      expect(mockNext).not.toHaveBeenCalled()

      expect(mockStatus).toHaveBeenCalledTimes(1)
      expect(mockStatus).toHaveBeenCalledWith(500)

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend).toHaveBeenCalledWith({ data: {}, error: "Couldn't update user setting." })
    })
  })
})
