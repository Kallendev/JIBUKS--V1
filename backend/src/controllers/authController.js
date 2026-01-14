import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateToken, generateRefreshToken, JWT_SECRET } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { sendEmail } from '../services/emailService.js';
import crypto from 'crypto';

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



/**
 * Forgot Password - Send OTP
 */
async function forgotPassword(req, res, next) {
  try {
    const { email, phone, deliveryMethod } = req.body;

    // Validate input based on delivery method
    if (deliveryMethod === 'sms') {
      if (!phone) {
        return res.status(400).json({ error: 'Phone number is required for SMS delivery' });
      }
    } else {
      if (!email) {
        return res.status(400).json({ error: 'Email is required for email delivery' });
      }
    }

    // Find user by email or phone
    let user;
    if (deliveryMethod === 'sms' && phone) {
      user = await prisma.user.findFirst({ where: { phone } });
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    if (!user) {
      return res.json({ message: 'If that contact is in our system, we sent an OTP.' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOtp: otp,
        resetPasswordExpires: expires,
      },
    });

    // Send OTP via selected method
    if (deliveryMethod === 'sms' && user.phone) {
      const { sendOtpSMS } = await import('../services/smsService.js');
      await sendOtpSMS(user.phone, otp);
      res.json({ message: 'OTP sent to phone number' });
    } else {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}`,
        html: `<p>Your OTP for password reset is: <strong>${otp}</strong></p><p>This code expires in 15 minutes.</p>`,
      });
      res.json({ message: 'OTP sent to email' });
    }
  } catch (err) {
    next(err);
  }
}


/**
 * Verify OTP
 */
async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    if (user.resetPasswordOtp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    res.json({ message: 'OTP verified' });
  } catch (err) {
    next(err);
  }
}

/**
 * Reset Password
 */
async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    if (user.resetPasswordOtp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordOtp: null,
        resetPasswordExpires: null,
      },
    });

    res.json({ message: 'Password reset successfully' });
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
  forgotPassword,
  verifyOtp,
  resetPassword,
};
