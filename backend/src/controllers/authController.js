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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        role: user.role
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Register new user with email/password
 */
async function register(req, res, next) {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword, tenantSlug } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    let tenant;

    // If tenantSlug is provided, try to join existing tenant
    let role = 'MEMBER';
    if (tenantSlug) {
      tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug }
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found. Please check the tenant slug and try again.' });
      }
    } else {
      // Create a new tenant for this user
      tenant = await prisma.tenant.create({
        data: {
          name: `${firstName} ${lastName}`,
          slug: email.split('@')[0],
          ownerEmail: email,
        },
      });
      role = 'OWNER';
    }

    // Create user record
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        name: `${firstName} ${lastName}`,
        password: hashedPassword,
        role: role,
      },
    });

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        role: user.role
      },
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
        tenantId: true,
        role: true,
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
  register,
  login,
  refreshToken,
  getCurrentUser,
  logout,
};