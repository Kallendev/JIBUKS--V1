/**
 * Inventory Routes
 * API endpoints for World-Class Inventory Management
 */
import express from 'express';
import { prisma } from '../lib/prisma.js';
import * as inventoryService from '../services/inventoryService.js';
import { verifyJWT as authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/inventory/products
 * List all products with filtering, searching, and pagination
 */
router.get('/products', authenticate, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const {
            search,
            type,
            category,
            lowStock,
            page = 1,
            limit = 50,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        const where = {
            tenantId,
            isActive: true
        };

        // Search (Name, SKU, Barcode)
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Filters
        if (type) where.productType = type;
        if (category) where.category = category;

        // Low Stock Filter
        if (lowStock === 'true') {
            where.quantity = {
                lte: prisma.inventoryItem.fields.reorderLevel
            };
        }

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Sorting
        const orderBy = {};
        orderBy[sortBy] = sortOrder;

        const [products, total] = await Promise.all([
            prisma.inventoryItem.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy
            }),
            prisma.inventoryItem.count({ where })
        ]);

        res.json({
            data: products,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

/**
 * GET /api/inventory/alerts
 * Get low stock alerts specifically
 */
router.get('/alerts', authenticate, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        // Find items where quantity <= reorderLevel
        // Note: Prisma doesn't strictly support comparing two columns directly in `where` easily in all versions without raw query or client-side filtering.
        // But for most cases `reorderLevel` is a fixed value.
        // Improved: Fetch items with reorderLevel set, then filter.

        const productsWithReorder = await prisma.inventoryItem.findMany({
            where: {
                tenantId,
                isActive: true,
                reorderLevel: { not: null },
                productType: 'GOODS'
            }
        });

        // Filter in memory for precise comparison (qty <= reorderLevel)
        const alerts = productsWithReorder.filter(p =>
            Number(p.quantity) <= Number(p.reorderLevel)
        );

        res.json({
            count: alerts.length,
            alerts: alerts.map(p => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                quantity: Number(p.quantity),
                reorderLevel: Number(p.reorderLevel),
                reorderQuantity: Number(p.reorderQuantity)
            }))
        });

    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

/**
 * POST /api/inventory/products
 * Create a new product
 */
router.post('/products', authenticate, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        const productData = req.body;

        const product = await inventoryService.createProduct({
            tenantId,
            userId,
            ...productData
        });

        // If initial quantity provided, create adjustment
        if (productData.initialQuantity && Number(productData.initialQuantity) > 0) {
            await inventoryService.adjustStock({
                tenantId,
                userId,
                itemId: product.id,
                type: 'IN',
                reason: 'OPENING_STOCK',
                quantity: Number(productData.initialQuantity),
                unitCost: Number(productData.costPrice), // Opening stock valued at cost
                notes: 'Initial stock creation'
            });
            // Re-fetch product to get updated qty
            const updatedProduct = await prisma.inventoryItem.findUnique({ where: { id: product.id } });
            return res.status(201).json(updatedProduct);
        }

        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/inventory/products/:id
 * Get single product details + recent history
 */
router.get('/products/:id', authenticate, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const productId = parseInt(req.params.id);

        const product = await prisma.inventoryItem.findFirst({
            where: { id: productId, tenantId },
            include: {
                movements: {
                    take: 10,
                    orderBy: { date: 'desc' }
                },
                valuationHistory: {
                    take: 5,
                    orderBy: { date: 'desc' }
                }
            }
        });

        if (!product) return res.status(404).json({ error: 'Product not found' });

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

/**
 * POST /api/inventory/adjust
 * Adjust stock (IN/OUT/Correction)
 */
router.post('/adjust', authenticate, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        const { itemId, type, reason, quantity, unitCost, notes, reference } = req.body;

        const result = await inventoryService.adjustStock({
            tenantId,
            userId,
            itemId,
            type,
            reason,
            quantity,
            unitCost,
            notes,
            reference
        });

        res.json(result);
    } catch (error) {
        console.error('Error adjusting stock:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/inventory/transactions
 * List inventory movements/transactions
 */
router.get('/transactions', authenticate, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { page = 1, limit = 50, itemId } = req.query;

        const where = { tenantId };
        if (itemId) where.itemId = parseInt(itemId);

        const skip = (Number(page) - 1) * Number(limit);

        const [transactions, total] = await Promise.all([
            prisma.stockMovement.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { date: 'desc' },
                include: {
                    item: {
                        select: { name: true, sku: true }
                    }
                }
            }),
            prisma.stockMovement.count({ where })
        ]);

        res.json({
            data: transactions,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

/**
 * GET /api/inventory/catalog
 * Search the global master catalog for common products
 */
import { masterCatalog } from '../data/masterCatalog.js';

router.get('/catalog', authenticate, (req, res) => {
    try {
        const { search, category } = req.query;
        let results = masterCatalog;

        if (search) {
            const query = search.toLowerCase();
            results = results.filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.barcode && p.barcode.includes(query))
            );
        }

        if (category) {
            results = results.filter(p => p.category === category);
        }

        // Limit results to top 20 to avoid payload bloat
        res.json(results.slice(0, 20));
    } catch (error) {
        console.error('Error searching catalog:', error);
        res.status(500).json({ error: 'Failed to search catalog' });
    }
});

export default router;
