import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyJWT as authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/vat-rates - Get all active VAT rates for the tenant
router.get('/', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        const vatRates = await prisma.vatRate.findMany({
            where: {
                tenantId,
                isActive: true
            },
            orderBy: {
                rate: 'desc' // Show highest rates first
            }
        });

        res.json(vatRates);
    } catch (error) {
        console.error('Error fetching VAT rates:', error);
        res.status(500).json({ error: 'Failed to fetch VAT rates' });
    }
});

// GET /api/vat-rates/:id - Get specific VAT rate
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        const vatRate = await prisma.vatRate.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            }
        });

        if (!vatRate) {
            return res.status(404).json({ error: 'VAT rate not found' });
        }

        res.json(vatRate);
    } catch (error) {
        console.error('Error fetching VAT rate:', error);
        res.status(500).json({ error: 'Failed to fetch VAT rate' });
    }
});

// POST /api/vat-rates - Create new VAT rate (Admin only)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { name, rate, code, description, isActive } = req.body;

        // Validate required fields
        if (!name || rate === undefined || !code) {
            return res.status(400).json({ error: 'Name, rate, and code are required' });
        }

        const vatRate = await prisma.vatRate.create({
            data: {
                tenantId,
                name,
                rate: parseFloat(rate),
                code,
                description,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        res.status(201).json(vatRate);
    } catch (error) {
        console.error('Error creating VAT rate:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'VAT rate code already exists' });
        }
        res.status(500).json({ error: 'Failed to create VAT rate' });
    }
});

// PUT /api/vat-rates/:id - Update VAT rate
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;
        const { name, rate, description, isActive } = req.body;

        // Check if VAT rate exists and belongs to tenant
        const existing = await prisma.vatRate.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'VAT rate not found' });
        }

        const updated = await prisma.vatRate.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(rate !== undefined && { rate: parseFloat(rate) }),
                ...(description !== undefined && { description }),
                ...(isActive !== undefined && { isActive })
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating VAT rate:', error);
        res.status(500).json({ error: 'Failed to update VAT rate' });
    }
});

// DELETE /api/vat-rates/:id - Delete VAT rate
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        // Check if VAT rate exists and belongs to tenant
        const existing = await prisma.vatRate.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'VAT rate not found' });
        }

        await prisma.vatRate.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'VAT rate deleted successfully' });
    } catch (error) {
        console.error('Error deleting VAT rate:', error);
        res.status(500).json({ error: 'Failed to delete VAT rate' });
    }
});

export default router;
