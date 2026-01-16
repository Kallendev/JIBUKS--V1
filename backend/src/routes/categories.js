import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyJWT } from '../middleware/auth.js';
import { seedFamilyCategories } from '../services/accountingService.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Get all categories for the user's family
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const { type } = req.query;

        const categories = await prisma.category.findMany({
            where: {
                tenantId,
                ...(type && { type })
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Create a new category
router.post('/', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const { name, type, icon, color } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });
        }

        const category = await prisma.category.create({
            data: {
                tenantId,
                name,
                type,
                icon,
                color
            }
        });

        res.status(201).json(category);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Category with this name already exists' });
        }
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// Update a category
router.put('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const existing = await prisma.category.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const { name, type, icon, color } = req.body;

        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(type && { type }),
                ...(icon !== undefined && { icon }),
                ...(color !== undefined && { color })
            }
        });

        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Delete a category
router.delete('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const existing = await prisma.category.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Category not found' });
        }

        await prisma.category.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Seed default categories for the family
router.post('/seed', async (req, res) => {
    try {
        const { tenantId, role } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        // Only owners and admins can seed categories
        if (role !== 'OWNER' && role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only owners or admins can seed categories' });
        }

        const { force = false } = req.body;

        // Check existing categories
        const existingCount = await prisma.category.count({
            where: { tenantId }
        });

        if (existingCount > 0 && !force) {
            return res.status(400).json({
                error: 'Categories already exist. Use force=true to reseed.',
                existingCount
            });
        }

        // If force, delete all existing categories (careful!)
        if (force && existingCount > 0) {
            await prisma.category.deleteMany({
                where: { tenantId }
            });
        }

        // Seed categories
        const count = await seedFamilyCategories(tenantId);

        res.json({
            message: 'Categories seeded successfully',
            categoriesCreated: count
        });
    } catch (error) {
        console.error('Error seeding categories:', error);
        res.status(500).json({ error: 'Failed to seed categories' });
    }
});

export default router;
