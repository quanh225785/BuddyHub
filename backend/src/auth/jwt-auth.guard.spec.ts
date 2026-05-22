import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const jwt = {
    verify: jest.fn(),
  } as unknown as JwtService;

  let guard: JwtAuthGuard;
  let request: { headers: { authorization?: string }; user?: unknown };

  const createContext = () =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(jwt);
    request = { headers: {} };
  });

  it('accepts case-insensitive bearer scheme with extra whitespace', () => {
    request.headers.authorization = 'bearer   access-token';
    jest.spyOn(jwt, 'verify').mockReturnValue({
      sub: 'user-id',
      email: 'user@sis.hust.edu.vn',
    });

    expect(guard.canActivate(createContext())).toBe(true);
    expect(jwt.verify).toHaveBeenCalledWith('access-token');
    expect(request.user).toEqual({
      id: 'user-id',
      email: 'user@sis.hust.edu.vn',
    });
  });

  it('rejects missing bearer tokens with a string message', () => {
    expect(() => guard.canActivate(createContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects invalid tokens', () => {
    request.headers.authorization = 'Bearer invalid-token';
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('invalid token');
    });

    expect(() => guard.canActivate(createContext())).toThrow(
      UnauthorizedException,
    );
  });
});
