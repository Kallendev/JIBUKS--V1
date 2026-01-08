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

        // Fetch current tenant to merge metadata if needed
        const currentTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

        let newMetadata = undefined;
        if (metadata && currentTenant) {
            const existingMetadata = currentTenant.metadata || {};
            newMetadata = { ...existingMetadata, ...metadata };
        }

        const updatedFamily = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                ...(name && { name }),
                ...(newMetadata && { metadata: newMetadata }),
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

        // Check permissions
        const creator = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { role: true, permissions: true }
        });
        const perms = creator.permissions || getDefaultPermissions(creator.role);

        if (!perms.canAdd && !perms.canInvite) {
            return res.status(403).json({ error: 'You do not have permission to add members' });
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
            avatarUrl = `/uploads/${req.file.filename}`;
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

/**
 * Create a new goal (family dream)
 */
export async function createGoal(req, res, next) {
    try {
        const { tenantId, id: userId } = req.user;
        const { name, targetAmount, targetDate, monthlyContribution, assignedUserId } = req.body;

        if (!tenantId) return res.status(403).json({ error: 'Not part of a family' });

        // Check permissions
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, permissions: true }
        });

        const perms = user.permissions || getDefaultPermissions(user.role);
        if (!perms.canContributeGoals) {
            return res.status(403).json({ error: 'You do not have permission to create goals' });
        }

        if (!name || !targetAmount) return res.status(400).json({ error: 'Name and target amount are required' });

        const goal = await prisma.goal.create({
            data: {
                tenantId,
                name,
                targetAmount,
                targetDate: targetDate ? new Date(targetDate) : null,
                monthlyContribution: monthlyContribution ? parseFloat(monthlyContribution) : null,
                assignedUserId: assignedUserId ? parseInt(assignedUserId) : null,
            }
        });

        res.status(201).json(goal);
    } catch (err) {
        next(err);
    }
}

/**
 * Get family goals
 */
export async function getGoals(req, res, next) {
    try {
        const { tenantId, id: userId } = req.user;
        if (!tenantId) return res.status(403).json({ error: 'Not part of a family' });

        // Check if user can view goals
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, permissions: true }
        });
        const perms = user.permissions || getDefaultPermissions(user.role);

        if (!perms.canViewGoals) {
            return res.status(403).json({ error: 'You do not have permission to view goals' });
        }

        const goals = await prisma.goal.findMany({
            where: { tenantId },
            include: { assignedUser: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' }
        });

        res.json(goals);
    } catch (err) {
        next(err);
    }
}

/**
 * Save monthly budgets
 */
export async function createBudgets(req, res, next) {
    try {
        const { tenantId, id: userId } = req.user;
        const { budgets } = req.body; // Expects array of { category, amount }

        if (!tenantId) return res.status(403).json({ error: 'Not part of a family' });

        // Check permissions
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, permissions: true }
        });
        const perms = user.permissions || getDefaultPermissions(user.role);

        if (!perms.canEditBudgets) {
            return res.status(403).json({ error: 'You do not have permission to edit budgets' });
        }

        if (!Array.isArray(budgets) || budgets.length === 0) {
            return res.status(400).json({ error: 'Budgets array is required' });
        }

        // Use transaction to ensure all save or none
        const result = await prisma.$transaction(async (tx) => {
            const budgetClient = tx.budget || tx.Budget;
            if (!budgetClient) {
                console.error('Available models in tx:', Object.keys(tx).filter(k => !k.startsWith('$')));
                throw new Error('Budget model not found in Prisma transaction context');
            }

            const savedBudgets = [];
            for (const item of budgets) {
                if (!item.amount) continue;

                const budget = await budgetClient.upsert({
                    where: {
                        // We need a unique constraint for upsert to work in this way
                        // For now, since Budget might not have a unique constraint on (tenantId, category, month),
                        // we will stick to findFirst then update/create but with the safety check.
                        id: (await budgetClient.findFirst({
                            where: {
                                tenantId,
                                category: item.category,
                                month: null
                            },
                            select: { id: true }
                        }))?.id || -1
                    },
                    update: { amount: parseFloat(item.amount) },
                    create: {
                        tenantId,
                        category: item.category,
                        amount: parseFloat(item.amount),
                        month: null
                    }
                });
                savedBudgets.push(budget);
            }
            return savedBudgets;
        });

        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

/**
 * Get monthly budgets
 */
export async function getBudgets(req, res, next) {
    try {
        const { tenantId, id: userId } = req.user;
        if (!tenantId) return res.status(403).json({ error: 'Not part of a family' });

        // Check permissions
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, permissions: true }
        });
        const perms = user.permissions || getDefaultPermissions(user.role);

        if (!perms.canViewBudgets) {
            return res.status(403).json({ error: 'You do not have permission to view budgets' });
        }

        const budgets = await prisma.budget.findMany({
            where: { tenantId }
        });

        res.json(budgets);
    } catch (err) {
        next(err);
    }
}

/**
 * Helper function to get default permissions based on role
 */
function getDefaultPermissions(role) {
    const defaults = {
        OWNER: {
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
            canViewBudgets: true,
            canEditBudgets: true,
            canViewGoals: true,
            canContributeGoals: true,
            canInvite: true,
            canRemove: true
        },
        ADMIN: {
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
            canViewBudgets: true,
            canEditBudgets: true,
            canViewGoals: true,
            canContributeGoals: true,
            canInvite: true,
            canRemove: false
        },
        PARENT: {
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: false,
            canViewBudgets: true,
            canEditBudgets: true,
            canViewGoals: true,
            canContributeGoals: true,
            canInvite: false,
            canRemove: false
        },
        CHILD: {
            canView: true,
            canAdd: false,
            canEdit: false,
            canDelete: false,
            canViewBudgets: true,
            canEditBudgets: false,
            canViewGoals: true,
            canContributeGoals: true,
            canInvite: false,
            canRemove: false
        },
        MEMBER: {
            canView: true,
            canAdd: false,
            canEdit: false,
            canDelete: false,
            canViewBudgets: true,
            canEditBudgets: false,
            canViewGoals: true,
            canContributeGoals: false,
            canInvite: false,
            canRemove: false
        }
    };

    return defaults[role] || defaults.MEMBER;
}
