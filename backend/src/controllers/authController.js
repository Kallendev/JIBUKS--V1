import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateToken, generateRefreshToken, JWT_SECRET } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const SALT_ROUNDS = 10;

/**
 * Local login with email/password (fallback)
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password || '');
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, tenantId: user.tenantId },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Auth0 callback handler
 * In production, Auth0 will redirect to /auth/callback with a code
 */
async function auth0Callback(req, res, next) {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // In a real setup, exchange code for tokens from Auth0
    // For now, this is a placeholder
    res.json({ message: 'Auth0 callback received. Exchange code for tokens in production.' });
  } catch (err) {
    next(err);
  }
}

/**
 * OAuth2 login/signup endpoint (Auth0 profile exchange)
 * Call this after receiving Auth0 ID token from mobile app
 */
async function oauth2Login(req, res, next) {
  try {
    const { auth0Id, email, name, tenantId } = req.body;
    if (!auth0Id || !email) {
      return res.status(400).json({ error: 'auth0Id and email required' });
    }

    // Try to find existing user with auth0_id
    let user = await prisma.user.findUnique({ where: { auth0Id } });
    
    if (user) {
      // User exists, return token
      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      return res.json({
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name, tenantId: user.tenantId },
      });
    }

    // Create new user (auto-signup)
    // If no tenant_id provided, create or use default tenant
    let finalTenantId = tenantId;
    if (!finalTenantId) {
      // Create a default tenant for this user
      const tenant = await prisma.tenant.create({
        data: {
          name: email.split('@')[0],
          slug: email.split('@')[0],
          ownerEmail: email,
        },
      });
      finalTenantId = tenant.id;
    }

    user = await prisma.user.create({
      data: {
        tenantId: finalTenantId,
        email,
        name: name || email,
        auth0Id,
      },
    });

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, tenantId: user.tenantId },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'User already exists' });
    }
    next(err);
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken required' });
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const newAccessToken = generateToken(user);

      res.json({ accessToken: newAccessToken });
    } catch (err) {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Get current user from JWT
 */
async function getCurrentUser(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        auth0Id: true,
        tenantId: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * Logout (invalidate refresh token in production)
 */
async function logout(req, res, next) {
  try {
    // In production, add refreshToken to blacklist
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export {
  login,
  oauth2Login,
  auth0Callback,
  refreshToken,
  getCurrentUser,
  logout,
};