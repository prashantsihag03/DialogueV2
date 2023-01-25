import * as JwtUtils from ".";
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import * as SessionsModel from "../../models/session/sessions";
import { User } from "../../models/types";

jest.mock("../../models/session/sessions");

describe('JWT Utils Test Suite', () => {
  describe('generateJwtToken', () => {
    it('should return access and refresh token', async () => {
      jest.spyOn(SessionsModel, 'storeSession').mockImplementation(jest.fn());
  
      const mockUser: User = {
        email: 'mockEmail@gmail.com',
        friends: [],
        gender: 'male',
        password: 'mockPassword',
        username: 'mockUsername',
      }
      const result = await JwtUtils.generateJwtToken(mockUser);
  
      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBeTruthy();
      expect(result).toHaveProperty('refreshToken');
      expect(result.refreshToken).toBeTruthy();
    });
  
    it('should call storeSession to store refresh token in database', async () => {
      const mockStoreSession = jest.fn();
      jest.spyOn(SessionsModel, 'storeSession').mockImplementation(mockStoreSession);
  
      jest.spyOn(JwtUtils, 'createRefreshToken').mockReturnValue('mockRefreshToken');
  
      const mockUser: User = {
        email: 'mockEmail@gmail.com',
        friends: [],
        gender: 'male',
        password: 'mockPassword',
        username: 'mockUsername',
      }
      const result = await JwtUtils.generateJwtToken(mockUser);
  
      expect(mockStoreSession).toHaveBeenCalled();
      expect(mockStoreSession).toHaveBeenCalledTimes(1);
      expect(mockStoreSession).toHaveBeenCalledWith({username: 'mockUsername', sessionid: 'mockRefreshToken'});
    });
  })

  describe('validateAccessToken', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return decoded jwt data when jwt is successfully verified', async () => {
      const mockAccessToken = JwtUtils.createAccessToken('mockUsername');
  
      const result = await JwtUtils.validateAccessToken(mockAccessToken);
  
      expect(result).toHaveProperty('decoded');
      expect(result.decoded).toHaveProperty('username', 'mockUsername');
      expect(result).toHaveProperty('expired', false);
    });
  
    it('should return expired true and decoded null when accessToken is expired', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new TokenExpiredError("expired mock message", new Date());
      })
  
      const mockAccessToken = JwtUtils.createAccessToken('mockUsername');
  
      const result = await JwtUtils.validateAccessToken(mockAccessToken);
  
      expect(result).toHaveProperty('expired', true);
      expect(result).toHaveProperty('decoded');
      expect(result.decoded).toBeNull();
    })
  
    it('should throw error when jwt verification throws non token expiration error', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error("non expiration mock error");
      })
  
      const mockAccessToken = JwtUtils.createAccessToken('mockUsername');
  
      await expect(JwtUtils.validateAccessToken(mockAccessToken)).rejects.toThrow("non expiration mock error");
    })  
  })

  describe('validateRefreshToken', () => {
    it('should call verify function', async () => {
      const mockVerify = jest.fn().mockImplementation(() => {throw "random error"});
      jest.spyOn(jwt, 'verify').mockImplementation(mockVerify);
      
      await JwtUtils.validateRefreshToken("mockRefreshToken", "mockUsername");
      
      expect(mockVerify).toHaveBeenCalled();
      expect(mockVerify).toHaveBeenCalledWith("mockRefreshToken", expect.anything());
    });

    it('should call getSession when refreshToken verification is successful', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {return "mock"});
      const mockGetSession = jest.fn().mockRejectedValue(new Error('failed!'));
      jest.spyOn(SessionsModel, 'getSession').mockImplementation(mockGetSession);

      await JwtUtils.validateRefreshToken("mockRefreshToken", "mockUsername");

      expect(mockGetSession).toHaveBeenCalled();
      expect(mockGetSession).toHaveBeenCalledWith("mockRefreshToken");
    });

    it("should return true when valid refresh token is provided that is also stored in sessions", async () => {
      const mockResponse: any = {};
      const mockRefreshToken = JwtUtils.createRefreshToken("mockUsername");
      jest.spyOn(SessionsModel, 'getSession').mockResolvedValue({
        $response: mockResponse,
        Item: {
          sessionId: mockRefreshToken,
          username: "mockUsername",
        }
      });

      const result = await JwtUtils.validateRefreshToken(mockRefreshToken, "mockUsername");

      expect(result).toBe(true);
    });

    it("should return false when in-valid refresh token is provided", async () => {
      const result = await JwtUtils.validateRefreshToken("invalidRefreshToken", "mockUsername");
      expect(result).toBe(false);
    });

    it("should return false when valid refresh token is provided but is not stored in sessions", async () => {
      const mockResponse: any = {};
      const mockRefreshToken = JwtUtils.createRefreshToken("mockUsername");
      jest.spyOn(SessionsModel, 'getSession').mockResolvedValue({
        $response: mockResponse,
        Item: {
          sessionId: "differentRefreshToken",
          username: "mockUsername",
        }
      });

      const result = await JwtUtils.validateRefreshToken(mockRefreshToken, "mockUsername");
      expect(result).toBe(false);
    });

    it('should return false when getSession throws error', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {return "mock"});
      const mockGetSession = jest.fn().mockImplementation(() => new Error('failed!'));
      jest.spyOn(SessionsModel, 'getSession').mockImplementation(mockGetSession);

      const result = await JwtUtils.validateRefreshToken("mockRefreshToken", "mockUsername");

      expect(result).toBe(false);
    });

    it('should return false when getSession rejects', async () => {
      const mockResponse: any = {};
      const mockRefreshToken = JwtUtils.createRefreshToken("mockUsername");
      jest.spyOn(SessionsModel, 'getSession').mockRejectedValue({
        $response: mockResponse,
        Item: {
          sessionId: mockRefreshToken,
          username: "mockUsername",
        }
      });

      const result = await JwtUtils.validateRefreshToken(mockRefreshToken, "mockUsername");

      expect(result).toBe(false);
    });

    it('should return false when verify throws error', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {new Error('failed!')});

      const result = await JwtUtils.validateRefreshToken("mockRefreshToken", "mockUsername");

      expect(result).toBe(false);
    });
  });

  describe('createAccessToken', () => {});

  describe('createRefreshToken', () => {});
  
  describe('createToken', () => {});
  
  describe('decodeAccessToken', () => {});
})