import { NextFunction, Request, Response } from 'express';
import { jwtVerify, JWTPayload } from 'jose';

const SESSION_COOKIE_NAME = 'SESSION_TOKEN';

const getSessionTokenFromCookie = (cookieHeader?: string): string | undefined => {
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name === SESSION_COOKIE_NAME) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return undefined;
};

const AUTH_GUARD = async (req: Request, res: Response, next: NextFunction) => {
  // Bypass for Authentication Routes
  if (req.url.includes('/api/auth')) return next();

  const token = getSessionTokenFromCookie(req.headers.cookie);
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET),
    );

    (req as Request & { user?: JWTPayload }).user = payload;
    return next();
  } catch (err) {
    console.error('AUTH_GUARD:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

};

export { AUTH_GUARD }