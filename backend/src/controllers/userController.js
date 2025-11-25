import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, tenantId } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashed,
        tenantId: tenantId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (err) {
    // Unique constraint violation (Prisma code P2002)
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'email already exists' });
    }
    next(err);
  }
}

export { listUsers, createUser };
