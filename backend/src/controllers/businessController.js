import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

/**
 * Get current business (tenant) details
 */
export async function getBusinessProfile(req, res, next) {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(404).json({ error: 'User is not part of any business' });
        }

        const business = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        avatarUrl: true,
                    }
                }
            }
        });

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        if (business.tenantType !== 'BUSINESS') {
            return res.status(400).json({ error: 'This profile is not a business profile' });
        }

        res.json(business);
    } catch (err) {
        next(err);
    }
}

/**
 * Update business profile (Onboarding step)
 */
export async function updateBusinessProfile(req, res, next) {
    try {
        const { tenantId } = req.user;
        const { name, industry, salesType, businessSize, currency } = req.body;

        if (!tenantId) {
            return res.status(403).json({ error: 'Not part of any business' });
        }

        // Fetch current tenant to merge metadata
        const currentTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!currentTenant) {
            return res.status(404).json({ error: 'Business not found' });
        }

        const existingMetadata = currentTenant.metadata || {};
        const newMetadata = {
            ...existingMetadata,
            ...(industry && { industry }),
            ...(salesType && { salesType }),
            ...(businessSize && { businessSize }),
            ...(currency && { currency }),
            onboardingCompleted: !!(industry && salesType) // Mark as completed if core info provided
        };

        const updatedBusiness = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                ...(name && { name }),
                metadata: newMetadata,
            }
        });

        res.json(updatedBusiness);
    } catch (err) {
        next(err);
    }
}

/**
 * Get onboarding status for the dashboard
 */
export async function getOnboardingStatus(req, res, next) {
    try {
        const { tenantId } = req.user;

        const business = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { metadata: true, name: true }
        });

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        const metadata = business.metadata || {};

        const status = {
            hasName: !!business.name,
            hasIndustry: !!metadata.industry,
            hasSalesType: !!metadata.salesType,
            isCompleted: !!metadata.onboardingCompleted
        };

        res.json(status);
    } catch (err) {
        next(err);
    }
}

/**
 * Update business contact information
 */
export async function updateBusinessContact(req, res, next) {
    try {
        const { tenantId } = req.user;
        const { phone, website, physicalAddress, email } = req.body;

        if (!tenantId) {
            return res.status(403).json({ error: 'Not part of any business' });
        }

        const currentTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        const existingMetadata = currentTenant.metadata || {};
        const newMetadata = {
            ...existingMetadata,
            ...(phone && { phone }),
            ...(website && { website }),
            ...(physicalAddress && { physicalAddress }),
            ...(email && { businessEmail: email })
        };

        const updatedBusiness = await prisma.tenant.update({
            where: { id: tenantId },
            data: { metadata: newMetadata }
        });

        res.json(updatedBusiness);
    } catch (err) {
        next(err);
    }
}

/**
 * Update business tax settings
 */
export async function updateBusinessTaxSettings(req, res, next) {
    try {
        const { tenantId } = req.user;
        const { kraPin, isTaxRegistered, taxType } = req.body;

        if (!tenantId) {
            return res.status(403).json({ error: 'Not part of any business' });
        }

        const currentTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        const existingMetadata = currentTenant.metadata || {};
        const newMetadata = {
            ...existingMetadata,
            ...(kraPin && { kraPin }),
            ...(isTaxRegistered !== undefined && { isTaxRegistered }),
            ...(taxType && { taxType })
        };

        const updatedBusiness = await prisma.tenant.update({
            where: { id: tenantId },
            data: { metadata: newMetadata }
        });

        res.json(updatedBusiness);
    } catch (err) {
        next(err);
    }
}

/**
 * List business staff members
 */
export async function listBusinessStaff(req, res, next) {
    try {
        const { tenantId } = req.user;

        const staff = await prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(staff);
    } catch (err) {
        next(err);
    }
}

/**
 * Add a new staff member to the business
 */
export async function addBusinessStaff(req, res, next) {
    try {
        const { tenantId } = req.user;
        const { name, email, password, role } = req.body;

        if (!tenantId) {
            return res.status(403).json({ error: 'Not part of any business' });
        }

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                tenantId,
                name,
                email,
                password: hashedPassword,
                role: role || 'MEMBER',
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });

        res.status(201).json(newUser);
    } catch (err) {
        next(err);
    }
}

/**
 * Consolidated Onboarding Submission
 */
export async function completeOnboarding(req, res, next) {
    try {
        const { tenantId } = req.user;
        const {
            businessName,
            industry,
            salesType,
            address,
            phoneNumber,
            email,
            currency,
            yearStart,
            vatChoice,
            styleChoice
        } = req.body;

        if (!tenantId) {
            return res.status(403).json({ error: 'Not part of any business' });
        }

        const currentTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        const existingMetadata = currentTenant.metadata || {};

        const newMetadata = {
            ...existingMetadata,
            ...(industry && { industry }),
            ...(salesType && { salesType }),
            ...(address && { address }),
            ...(phoneNumber && { phone: phoneNumber }),
            ...(email && { businessEmail: email }),
            ...(currency && { currency }),
            ...(yearStart && { financialYearStart: yearStart }),
            ...(vatChoice && { vatRegistered: vatChoice === 'yes' }),
            ...(styleChoice && { invoiceTemplate: styleChoice }),
            onboardingCompleted: true,
            onboardingCompletedAt: new Date().toISOString()
        };

        const updatedBusiness = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                name: businessName || currentTenant.name,
                metadata: newMetadata
            }
        });

        res.json({
            message: 'Onboarding completed successfully',
            business: updatedBusiness
        });
    } catch (err) {
        next(err);
    }
}
