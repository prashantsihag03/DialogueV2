import { GenericErrorHandler } from '../../middlewares/error'

describe('Error Middleware Test Suite', () => {
  describe('GenericErrorHandler', () => {
    it('send 500 status', () => {
      const mockSendStatus = jest.fn()
      const mockErrBack: any = {}
      const mockReq: any = {}
      const mockNext = jest.fn()
      const mockRes: any = {
        locals: {
          sessionTokens: {
            refreshToken: 'mockRefreshToken'
          }
        },
        sendStatus: mockSendStatus
      }

      GenericErrorHandler(mockErrBack, mockReq, mockRes, mockNext)

      expect(mockSendStatus).toHaveBeenCalled()
      expect(mockSendStatus).toHaveBeenCalledWith(500)
    })
  })
})
