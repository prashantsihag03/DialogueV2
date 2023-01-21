import * as Jwt from "../../utils/Jwt";
import * as SessionUtils from "../../utils/SessionUtils";
import * as AuthUtils from "../../utils/AuthUtils";
import * as UserModel from "../../models/user/users";
import * as bcrypt from 'bcrypt';
import { authenticateLoginCredentials, redirectUnAuthenticated, rejectInValidLoginCredentials, rejectUnAuthenticated, validateTokens } from "../auth";

jest.mock('bcrypt');

describe("Auth Middleware Test Suite", () => {
  describe("validateTokens", () => {
    it("should call extractTokens with correct argument", async () => {
      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens');
      
      const mockReq: any = {};
      const mockRes: any = {};
      const mockNext = jest.fn();
      const mockExtractTokens = jest.fn().mockReturnValue(null);
      spyExtractTokens.mockImplementation(mockExtractTokens);

      await validateTokens(mockReq, mockRes, mockNext);

      expect(mockExtractTokens).toHaveBeenCalled();
      expect(mockExtractTokens).toHaveBeenCalledWith(mockReq);
    });

    it('should add sessionTokens to the response.locals when session tokens are successfully extracted from request', async () => {      
      const mockReq: any = {};
      const mockRes: any = {
        locals: {}
      };
      const mockNext = jest.fn();

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens');
      const mockExtractTokens = jest.fn()
        .mockReturnValue({accessToken: 'xyz', refreshToken: 'abc'});
      spyExtractTokens.mockImplementation(mockExtractTokens);

      const spyValidateAccessToken = jest.spyOn(Jwt, 'validateAccessToken');
      const mockValidateAccessToken = jest.fn()
        .mockResolvedValue({decoded: {}, expired: false}); 
      spyValidateAccessToken.mockImplementation(mockValidateAccessToken);

      await validateTokens(mockReq, mockRes, mockNext);

      expect(mockRes.locals.sessionTokens).toHaveProperty('accessToken', 'xyz');
      expect(mockRes.locals.sessionTokens).toHaveProperty('refreshToken', 'abc');
    })

    it("should not add sessionTokens to response.locals.sessionTokens next when sessionTokens are not found", async () => {
      const mockReq: any = {};
      const mockRes: any = {
        locals: {}
      };
      const mockNext = jest.fn();

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens');
      const mockExtractTokens = jest.fn().mockReturnValue(null);
      spyExtractTokens.mockImplementation(mockExtractTokens);

      await validateTokens(mockReq, mockRes, mockNext);
      
      expect(mockRes.locals.sessionTokens).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should respond with 500 status when extractTokens throws error', async () => {
      const mockStatus = jest.fn();
      const mockSend = jest.fn();
      const mockReq: any = {};
      const mockRes: any = {
        locals: {},
        status: mockStatus, 
        send: mockSend,
        end: () => {}

      };
      const mockNext = jest.fn();

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens');
      spyExtractTokens.mockImplementation(() => {
        throw "new error";
      });

      await validateTokens(mockReq, mockRes, mockNext);

      expect(mockRes.locals.sessionTokens).toBeUndefined();
      expect(mockRes.locals.authenticated).toBeUndefined();
      expect(mockRes.locals.jwt).toBeUndefined();
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend).toHaveBeenCalledWith("Something went wrong! Please try again later!");
    });

    it ('should call next when extractTokens returns null', async () => {
      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens');
      
      const mockReq: any = {};
      const mockRes: any = {};
      const mockNext = jest.fn();
      const mockExtractTokens = jest.fn().mockReturnValue(null);
      spyExtractTokens.mockImplementation(mockExtractTokens);

      await validateTokens(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    })

    it ('should call next when extractTokens returns session tokens', async () => {
      const mockReq: any = {};
      const mockRes: any = {
        locals: {}
      };
      const mockNext = jest.fn();

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens');
      const mockExtractTokens = jest.fn().mockReturnValue({accessToken: 'xyz', refreshToken: 'abc'});
      spyExtractTokens.mockImplementation(mockExtractTokens);

      const spyValidateAccessToken = jest.spyOn(Jwt, 'validateAccessToken');
      const mockValidateAccessToken = jest.fn()
        .mockResolvedValue({decoded: {}, expired: false});
      spyValidateAccessToken.mockImplementation(mockValidateAccessToken);

      await validateTokens(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    })

    it('should call validateAccessToken with correct argument when extractTokens returns session tokens', async () => {
      const mockReq: any = {};
      const mockRes: any = {
        locals: {}
      };
      const mockNext = jest.fn();

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens');
      const mockExtractTokens = jest.fn()
        .mockReturnValue({accessToken: 'xyz', refreshToken: 'abc'});
      spyExtractTokens.mockImplementation(mockExtractTokens);

      const spyValidateAccessToken = jest.spyOn(Jwt, 'validateAccessToken');
      const mockValidateAccessToken = jest.fn()
        .mockResolvedValue({decoded: {}, expired: false});
      spyValidateAccessToken.mockImplementation(mockValidateAccessToken);

      await validateTokens(mockReq, mockRes, mockNext);

      expect(mockValidateAccessToken).toHaveBeenCalled();
      expect(mockValidateAccessToken).toHaveBeenCalledWith('xyz');
    })

    it('should not call validateAccessToken when extractTokens returns null', async () => {
      const mockReq: any = {};
      const mockRes: any = {
        locals: {}
      };
      const mockNext = jest.fn();

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens');
      const mockExtractTokens = jest.fn().mockReturnValue(null);
      spyExtractTokens.mockImplementation(mockExtractTokens);

      const spyValidateAccessToken = jest.spyOn(Jwt, 'validateAccessToken');
      const mockValidateAccessToken = jest.fn()
        .mockResolvedValue({decoded: {}, expired: false});
      spyValidateAccessToken.mockImplementation(mockValidateAccessToken);

      await validateTokens(mockReq, mockRes, mockNext);

      expect(mockValidateAccessToken).not.toHaveBeenCalled();
    })

    it('should add authenticated and jwt data to response.locals when validateAccessToken returns decoded and non expired data', async () => {
      const mockReq: any = {};
      const mockRes: any = {
        locals: {}
      };
      const mockNext = jest.fn();

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens');
      const mockExtractTokens = jest.fn()
        .mockReturnValue({accessToken: 'xyz', refreshToken: 'abc'});
      spyExtractTokens.mockImplementation(mockExtractTokens);

      const spyValidateAccessToken = jest.spyOn(Jwt, 'validateAccessToken');
      const mockValidateAccessToken = jest.fn()
        .mockResolvedValue({decoded: 'blah', expired: false}); 
      spyValidateAccessToken.mockImplementation(mockValidateAccessToken);

      await validateTokens(mockReq, mockRes, mockNext);

      expect(mockValidateAccessToken).toHaveBeenCalled();
      expect(mockRes.locals.authenticated).toBe(true);
      expect(mockRes.locals.jwt).toBe('blah');
    })

    it('should not add authenticated and jwt data to response.locals when validateAccessToken does not returns decoded and returns expired data', async () => {
      const mockReq: any = {};
      const mockRes: any = {
        locals: {}
      };
      const mockNext = jest.fn();

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens');
      const mockExtractTokens = jest.fn()
        .mockReturnValue({accessToken: 'xyz', refreshToken: 'abc'});
      spyExtractTokens.mockImplementation(mockExtractTokens);

      const spyValidateAccessToken = jest.spyOn(Jwt, 'validateAccessToken');
      const mockValidateAccessToken = jest.fn()
        .mockResolvedValue({decoded: null, expired: true}); 
      spyValidateAccessToken.mockImplementation(mockValidateAccessToken);

      await validateTokens(mockReq, mockRes, mockNext);

      expect(mockValidateAccessToken).toHaveBeenCalled();
      expect(mockRes.locals.authenticated).toBeUndefined();
      expect(mockRes.locals.jwt).toBeUndefined();
    })

    it('should respond with 500 status when validateAccessToken throws error or rejects', async () => {
      const mockStatus = jest.fn();
      const mockSend = jest.fn();
      const mockReq: any = {};
      const mockRes: any = {
        locals: {},
        status: mockStatus, 
        send: mockSend,
        end: () => {}

      };
      const mockNext = jest.fn();

      const spyExtractTokens = jest.spyOn(SessionUtils, 'extractTokens');
      const mockExtractTokens = jest.fn()
        .mockReturnValue({accessToken: 'xyz', refreshToken: 'abc'});
      spyExtractTokens.mockImplementation(mockExtractTokens);

      const spyValidateAccessToken = jest.spyOn(Jwt, 'validateAccessToken');
      const mockValidateAccessToken = jest.fn()
        .mockRejectedValue({random: "random"}); 
      spyValidateAccessToken.mockImplementation(mockValidateAccessToken);

      await validateTokens(mockReq, mockRes, mockNext);

      expect(mockValidateAccessToken).toHaveBeenCalled();
      expect(mockRes.locals.authenticated).toBeUndefined();
      expect(mockRes.locals.jwt).toBeUndefined();
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend).toHaveBeenCalledWith("Something went wrong! Please try again later!");
    });
  });

  describe('rejectUnAuthenticated', () => {
    it('should not call next when response.locals.authenticated is not already set', () => {
      const mockSendStatus = jest.fn();
      const mockReq: any = {};
      const mockNext = jest.fn();
      const mockRes: any = {
        locals: {},
        sendStatus: mockSendStatus
      };

      rejectUnAuthenticated(mockReq, mockRes, mockNext);

      expect(mockSendStatus).toHaveBeenCalledTimes(1);
      expect(mockSendStatus).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    })

    it('should call next when response.locals.authenticated is already set', () => {
      const mockSendStatus = jest.fn();
      const mockReq: any = {};
      const mockNext = jest.fn();
      const mockRes: any = {
        locals: {
          authenticated: {
            username: 'blah'
          }
        },
        sendStatus: mockSendStatus
      };

      rejectUnAuthenticated(mockReq, mockRes, mockNext);

      expect(mockSendStatus).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    })
  })

  describe('redirectUnAuthenticated', () => {
    it('should call redirect() with correct argument when response.locals.authenticated is not already set', () => {
      const mockRedirect = jest.fn();
      const mockReq: any = {};
      const mockNext = jest.fn();
      const mockRes: any = {
        locals: {},
        redirect: mockRedirect
      };

      redirectUnAuthenticated(mockReq, mockRes, mockNext);

      expect(mockRedirect).toHaveBeenCalledTimes(1);
      expect(mockRedirect).toHaveBeenCalledWith('/');
      expect(mockNext).not.toHaveBeenCalled();
    })

    it('should call next when response.locals.authenticated is already set', () => {
      const mockRedirect = jest.fn();
      const mockReq: any = {};
      const mockNext = jest.fn();
      const mockRes: any = {
        locals: {
          authenticated: {
            username: 'blah'
          }
        },
        redirect: mockRedirect
      };

      redirectUnAuthenticated(mockReq, mockRes, mockNext);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    })
  })

  describe('rejectInValidLoginCredentials', () => {
    it('should send 400 status code when request doesnt not contain body', () => {
      const mockSendStatus = jest.fn();
      const mockReq: any = {};
      const mockNext = jest.fn();
      const mockRes: any = {
        sendStatus: mockSendStatus
      };

      rejectInValidLoginCredentials(mockReq, mockRes, mockNext);
      
      expect(mockSendStatus).toHaveBeenCalledWith(400);
    });

    it('should send 400 status code when request body does not contain username and password', () => {
      const mockSendStatus = jest.fn();
      const mockReq: any = {
        body: {},
      };
      const mockNext = jest.fn();
      const mockRes: any = {
        sendStatus: mockSendStatus
      };

      rejectInValidLoginCredentials(mockReq, mockRes, mockNext);
      
      expect(mockSendStatus).toHaveBeenCalledWith(400);
    });

    it('should send 401 status code when request body contains invalid credentials', () => {
      const spiedGetValidCredentials = jest.spyOn(AuthUtils, 'getValidatedCredentials');
      const mockGetValidCredentials = jest.fn().mockReturnValue(null);
      spiedGetValidCredentials.mockImplementation(mockGetValidCredentials);
      
      const mockSendStatus = jest.fn();
      const mockReq: any = {
        body: {
          username: 'anything',
          password: 'anything',
        },
      };
      const mockNext = jest.fn();
      const mockRes: any = {
        sendStatus: mockSendStatus
      };

      rejectInValidLoginCredentials(mockReq, mockRes, mockNext);
      
      expect(mockSendStatus).toHaveBeenCalledWith(401);
    });

    it('Should assign validatedCredentials to response.locals and call next function when request body contains valid credentials', () => {
      const spiedGetValidCredentials = jest.spyOn(AuthUtils, 'getValidatedCredentials');
      const mockGetValidCredentials = jest.fn().mockReturnValue({
        username: 'mockValidatedUsername',
        password: 'mockValidatedPassword'
      });
      spiedGetValidCredentials.mockImplementation(mockGetValidCredentials);
      
      const mockSendStatus = jest.fn();
      const mockReq: any = {
        body: {
          username: 'anything',
          password: 'anything',
        },
      };
      const mockNext = jest.fn();
      const mockRes: any = {
        locals: {},
        sendStatus: mockSendStatus
      };

      rejectInValidLoginCredentials(mockReq, mockRes, mockNext);
      
      expect(mockSendStatus).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.locals).toHaveProperty('validatedCredentials');
      expect(mockRes.locals.validatedCredentials).toHaveProperty('username', 'mockValidatedUsername');
      expect(mockRes.locals.validatedCredentials).toHaveProperty('password', 'mockValidatedPassword');
    });
  });

  describe('authenticateLoginCredentials', () => {
    it('should send 401 status when response.locals.validated is NOT already set', async () => {      
      const mockSendStatus = jest.fn();
      const mockReq: any = {};
      const mockNext = jest.fn();
      const mockRes: any = {
        locals: {},
        sendStatus: mockSendStatus
      };

      await authenticateLoginCredentials(mockReq, mockRes, mockNext);
      
      expect(mockSendStatus).toHaveBeenCalledWith(401);
    });

    it('should send 401 status when response.locals.validated.username is NOT already set', async () => {      
      const mockSendStatus = jest.fn();
      const mockReq: any = {};
      const mockNext = jest.fn();
      const mockRes: any = {
        locals: {
          validatedCredentials: {}
        },
        sendStatus: mockSendStatus
      };

      await authenticateLoginCredentials(mockReq, mockRes, mockNext);
      
      expect(mockSendStatus).toHaveBeenCalledWith(401);
    });

    it('should call getUser when response.locals.validated.username is set', async () => {
      const spiedGetUser = jest.spyOn(UserModel, 'getUser');
      const mockGetUser = jest.fn().mockResolvedValue(null);
      spiedGetUser.mockImplementation(mockGetUser);
      
      const mockSendStatus = jest.fn();
      const mockReq: any = {};
      const mockNext = jest.fn();
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername'
          }
        },
        sendStatus: mockSendStatus
      };

      await authenticateLoginCredentials(mockReq, mockRes, mockNext);
      
      expect(mockGetUser).toHaveBeenCalledTimes(1);
      expect(mockGetUser).toHaveBeenCalledWith('mockValidatedUsername');
    });

    it('should send 401 status when result from getUser is undefined', async () => {
      const spiedGetUser = jest.spyOn(UserModel, 'getUser');
      const mockGetUser = jest.fn().mockResolvedValue(null);
      spiedGetUser.mockImplementation(mockGetUser);
      
      const mockSendStatus = jest.fn();
      const mockReq: any = {};
      const mockNext = jest.fn();
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername'
          }
        },
        sendStatus: mockSendStatus
      };

      await authenticateLoginCredentials(mockReq, mockRes, mockNext);
      
      expect(mockSendStatus).toHaveBeenCalledWith(401);
      expect(mockGetUser).toHaveBeenCalledTimes(1);
      expect(mockGetUser).toHaveBeenCalledWith('mockValidatedUsername');
    });

    it('should send 401 status when result from getUser has undefined/null Item', async () => {
      const spiedGetUser = jest.spyOn(UserModel, 'getUser');
      const mockGetUser = jest.fn().mockResolvedValue({});
      spiedGetUser.mockImplementation(mockGetUser);
      
      const mockSendStatus = jest.fn();
      const mockReq: any = {};
      const mockNext = jest.fn();
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername'
          }
        },
        sendStatus: mockSendStatus
      };

      await authenticateLoginCredentials(mockReq, mockRes, mockNext);
      
      expect(mockSendStatus).toHaveBeenCalledWith(401);
      expect(mockGetUser).toHaveBeenCalledTimes(1);
      expect(mockGetUser).toHaveBeenCalledWith('mockValidatedUsername');
    });

    it('should send 401 status when result.Item from getUser has undefined/null username', async () => {
      const spiedGetUser = jest.spyOn(UserModel, 'getUser');
      const mockGetUser = jest.fn().mockResolvedValue({
        Item: {}
      });
      spiedGetUser.mockImplementation(mockGetUser);
      
      const mockSendStatus = jest.fn();
      const mockReq: any = {};
      const mockNext = jest.fn();
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername'
          }
        },
        sendStatus: mockSendStatus
      };

      await authenticateLoginCredentials(mockReq, mockRes, mockNext);
      
      expect(mockSendStatus).toHaveBeenCalledWith(401);
      expect(mockGetUser).toHaveBeenCalledTimes(1);
      expect(mockGetUser).toHaveBeenCalledWith('mockValidatedUsername');
    });

    it('should call bcrypt.compare when result from getUser returns valid data', async () => {
      const spiedGetUser = jest.spyOn(UserModel, 'getUser');
      const mockGetUser = jest.fn().mockResolvedValue({
        Item: {
          username: 'mockValidatedUsername',
          password: 'encryptedUserPassword'
        }
      });
      spiedGetUser.mockImplementation(mockGetUser);

      const spiedBcryptCompare = jest.spyOn(bcrypt, 'compare');
      const mockBcryptCompare = jest.fn().mockResolvedValue(false);
      spiedBcryptCompare.mockImplementation(mockBcryptCompare);
      
      const mockSendStatus = jest.fn();
      const mockReq: any = {};
      const mockNext = jest.fn();
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername',
            password: 'mockValidatedPassword'
          }
        },
        sendStatus: mockSendStatus
      };

      await authenticateLoginCredentials(mockReq, mockRes, mockNext);
      
      expect(mockBcryptCompare).toHaveBeenCalledTimes(1);
      expect(mockBcryptCompare).toHaveBeenCalledWith('mockValidatedPassword', 'encryptedUserPassword');
    });

    it('should remove password from response and getUser result when bcrypt.compare returns true', async () => {
      const mockGetUserData = {
        Item: {
          username: 'mockValidatedUsername',
          password: 'encryptedUserPassword'
        }
      }
      const spiedGetUser = jest.spyOn(UserModel, 'getUser');
      const mockGetUser = jest.fn().mockResolvedValue(mockGetUserData);
      spiedGetUser.mockImplementation(mockGetUser);

      const spiedBcryptCompare = jest.spyOn(bcrypt, 'compare');
      const mockBcryptCompare = jest.fn().mockResolvedValue(true);
      spiedBcryptCompare.mockImplementation(mockBcryptCompare);
      
      const mockSendStatus = jest.fn();
      const mockReq: any = {};
      const mockNext = jest.fn();
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername',
            password: 'mockValidatedPassword'
          }
        },
        sendStatus: mockSendStatus
      };

      await authenticateLoginCredentials(mockReq, mockRes, mockNext);

      expect(mockGetUserData.Item.password).toBeUndefined();
      expect(mockRes.locals.validatedCredentials.password).toBeUndefined();
    });

    it('should add Item from getUser to response.local.authenticated and call Next function when bcrypt.compare returns true', async () => {
      const mockGetUserData = {
        Item: {
          username: 'mockValidatedUsername',
          password: 'encryptedUserPassword'
        }
      }
      const spiedGetUser = jest.spyOn(UserModel, 'getUser');
      const mockGetUser = jest.fn().mockResolvedValue(mockGetUserData);
      spiedGetUser.mockImplementation(mockGetUser);

      const spiedBcryptCompare = jest.spyOn(bcrypt, 'compare');
      const mockBcryptCompare = jest.fn().mockResolvedValue(true);
      spiedBcryptCompare.mockImplementation(mockBcryptCompare);
      
      const mockSendStatus = jest.fn();
      const mockReq: any = {};
      const mockNext = jest.fn();
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername',
            password: 'mockValidatedPassword'
          }
        },
        sendStatus: mockSendStatus
      };

      await authenticateLoginCredentials(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.locals.authenticated).toBe(mockGetUserData.Item);
    });

    it('should send 401 status when anything throws an error', async () => {
      const spiedGetUser = jest.spyOn(UserModel, 'getUser');
      spiedGetUser.mockImplementation(async () => {
        throw 'random error';
      });

      const spiedBcryptCompare = jest.spyOn(bcrypt, 'compare');
      const mockBcryptCompare = jest.fn().mockResolvedValue(false);
      spiedBcryptCompare.mockImplementation(mockBcryptCompare);
      
      const mockSendStatus = jest.fn();
      const mockReq: any = {};
      const mockNext = jest.fn();
      const mockRes: any = {
        locals: {
          validatedCredentials: {
            username: 'mockValidatedUsername',
            password: 'mockValidatedPassword'
          }
        },
        sendStatus: mockSendStatus
      };

      await authenticateLoginCredentials(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalledTimes(1);
      expect(mockBcryptCompare).not.toHaveBeenCalledTimes(1);
      expect(mockSendStatus).toHaveBeenCalledTimes(1);
      expect(mockSendStatus).toHaveBeenCalledWith(401);
    });
  });
  
  describe('validateSignUpCredentials', () => {
  });
});
