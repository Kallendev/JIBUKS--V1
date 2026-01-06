import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import { sendInvitationEmail } from '../services/emailService.js';

/**
 * Get current family (tenant) details and members
 */
export async function getFamily(req, res, next) {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(404).json({ error: 'User is not part of any family' });
        }

        const family = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        avatarUrl: true,
                        createdAt: true,
                    }
                }
            }
        });

        if (!family) {
            return res.status(404).json({ error: 'Family not found' });
        }

        res.json(family);
    } catch (err) {
        next(err);
    }
}

/**
 * Update family details
 */
export async function updateFamily(req, res, next) {
    try {
        const { tenantId, role } = req.user;
        const { name, metadata } = req.body;

        console.log('Update family - User role:', role, 'Tenant:', tenantId);

        // Allow if user has a tenant (is part of a family)
        if (!tenantId) {
            return res.status(403).json({ error: 'Not part of any family' });
        }

        const updatedFamily = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                ...(name && { name }),
                ...(metadata && { metadata }),
            }
        });

        res.json(updatedFamily);
    } catch (err) {
        next(err);
    }
}

/**
 * Create a new member directly (e.g. for children)
 */
export async function createMember(req, res, next) {
    try {
        const { tenantId, role: creatorRole } = req.user;
        const { name, email, password, role, age } = req.body;

        console.log('Create member - Creator role:', creatorRole, 'Tenant:', tenantId);
        console.log('Member data:', { name, email, role });

        // Allow if user has a tenant (is part of a family)
        if (!tenantId) {
            return res.status(403).json({ error: 'Not part of any family' });
        }

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let avatarUrl = null;
        if (req.file) {
            // Construct public URL
            const protocol = req.protocol;
            const host = req.get('host');
            avatarUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
            console.log('Image uploaded successfully:', avatarUrl);
        } else {
            console.log('No image uploaded');
        }

        const newUser = await prisma.user.create({
            data: {
                tenantId,
                name,
                email,
                password: hashedPassword,
                role: role || 'CHILD',
                avatarUrl,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                createdAt: true,
            }
        });

        // Get family name for email
        const family = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { name: true }
        });

        // Send invitation email
        try {
            console.log('Sending invitation email to:', email);
            const emailSent = await sendInvitationEmail(email, password, req.user.name || 'A family member', family.name);
            console.log('Email sent successfully:', emailSent);
        } catch (emailErr) {
            console.error('Failed to send invitation email:', emailErr);
            // Don't fail the request if email fails
        }

        res.status(201).json(newUser);
    } catch (err) {
        next(err);
    }
}
