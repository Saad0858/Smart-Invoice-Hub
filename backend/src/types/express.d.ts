declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      requestId: string;
    }
  }
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export {};
