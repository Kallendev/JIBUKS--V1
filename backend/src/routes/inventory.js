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
 * GET /api/inventory
 * List all products (alias for /products for backward compatibility)
 */
router.get('/', authenticate, async (req, res) => {
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
            // Get all items with reorder level set
            const allItems = await prisma.inventoryItem.findMany({
                where: {
                    ...where,
                    reorderLevel: { not: null }
                }
            });

            // Filter items where quantity <= reorderLevel
            const lowStockItems = allItems.filter(item =>
                Number(item.quantity) <= Number(item.reorderLevel)
            );

            // Add calculated fields
            const enrichedItems = lowStockItems.map(item => ({
                ...item,
                isLowStock: Number(item.quantity) <= Number(item.reorderLevel),
                stockValue: Number(item.quantity) * Number(item.costPrice || 0)
            }));

            return res.json(enrichedItems);
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

        // Add calculated fields
        const enrichedProducts = products.map(item => ({
            ...item,
            isLowStock: item.reorderLevel ? Number(item.quantity) <= Number(item.reorderLevel) : false,
            stockValue: Number(item.quantity) * Number(item.costPrice || 0)
        }));

        res.json(enrichedProducts);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

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
 * GET /api/inventory/valuation/current
 * Get total inventory valuation and breakdown by category
 */
router.get('/valuation/current', authenticate, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        // Get all active inventory items
        const items = await prisma.inventoryItem.findMany({
            where: {
                tenantId,
                isActive: true,
                productType: 'GOODS' // Only physical goods have valuation
            },
            select: {
                id: true,
                name: true,
                sku: true,
                category: true,
                quantity: true,
                costPrice: true,
                sellingPrice: true
            }
        });

        // Calculate valuations
        let totalCostValue = 0;
        let totalRetailValue = 0;
        const categoryBreakdown = {};

        items.forEach(item => {
            const qty = Number(item.quantity) || 0;
            const cost = Number(item.costPrice) || 0;
            const retail = Number(item.sellingPrice) || 0;

            const itemCostValue = qty * cost;
            const itemRetailValue = qty * retail;

            totalCostValue += itemCostValue;
            totalRetailValue += itemRetailValue;

            // Category breakdown
            const cat = item.category || 'Uncategorized';
            if (!categoryBreakdown[cat]) {
                categoryBreakdown[cat] = {
                    category: cat,
                    items: 0,
                    quantity: 0,
                    costValue: 0,
                    retailValue: 0
                };
            }

            categoryBreakdown[cat].items += 1;
            categoryBreakdown[cat].quantity += qty;
            categoryBreakdown[cat].costValue += itemCostValue;
            categoryBreakdown[cat].retailValue += itemRetailValue;
        });

        // Convert category breakdown to array
        const categories = Object.values(categoryBreakdown).sort((a, b) =>
            b.costValue - a.costValue
        );

        res.json({
            summary: {
                totalItems: items.length,
                totalQuantity: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
                totalCostValue,
                totalRetailValue,
                potentialProfit: totalRetailValue - totalCostValue,
                profitMargin: totalRetailValue > 0
                    ? ((totalRetailValue - totalCostValue) / totalRetailValue * 100).toFixed(2)
                    : 0
            },
            categories,
            topItems: items
                .map(item => ({
                    id: item.id,
                    name: item.name,
                    sku: item.sku,
                    quantity: Number(item.quantity || 0),
                    costPrice: Number(item.costPrice || 0),
                    value: Number(item.quantity || 0) * Number(item.costPrice || 0)
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 10)
        });

    } catch (error) {
        console.error('Error calculating valuation:', error);
        res.status(500).json({ error: 'Failed to calculate inventory valuation' });
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

// ============================================
// IMPORT INVENTORY ACCOUNTING SERVICE
// ============================================
import * as inventoryAccountingService from '../services/inventoryAccountingService.js';

// ============================================
// INVENTORY ACCOUNTING ROUTES
// ============================================

/**
 * POST /api/inventory/credit-memo
 * Process a customer return (Credit Memo)
 * 
 * This reverses both revenue and COGS:
 * - Revenue Reversal: DR Sales Returns, CR AR
 * - COGS Reversal: DR Inventory Asset, CR COGS
 */
router.post('/credit-memo', authenticate, async (req, res) => {
    try {
        const { tenantId, userId } = req.user;
        const { invoiceId, creditMemoNumber, items, date } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'At least one item is required' });
        }

        const result = await inventoryAccountingService.processCustomerReturn({
            tenantId,
            userId,
            invoiceId: parseInt(invoiceId),
            creditMemoNumber,
            items: items.map(item => ({
                inventoryItemId: item.inventoryItemId,
                quantity: parseFloat(item.quantity),
                sellingPrice: parseFloat(item.sellingPrice || item.unitPrice)
            })),
            date: date ? new Date(date) : new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Customer return processed successfully',
            ...result
        });
    } catch (error) {
        console.error('Error processing credit memo:', error);
        res.status(500).json({ error: error.message || 'Failed to process customer return' });
    }
});

/**
 * POST /api/inventory/adjust
 * Process inventory adjustment (shrinkage, damage, count)
 * 
 * Adjustment types: DAMAGED, EXPIRED, THEFT, LOST, FOUND, COUNT_ADJUSTMENT
 * 
 * For shrinkage: DR Shrinkage Expense, CR Inventory Asset
 * For found stock: DR Inventory Asset, CR Other Income
 */
router.post('/adjust', authenticate, async (req, res) => {
    try {
        const { tenantId, userId } = req.user;
        const {
            itemId,
            reason,
            quantity,
            adjustmentType,
            notes,
            date
        } = req.body;

        if (!itemId) {
            return res.status(400).json({ error: 'Item ID is required' });
        }

        if (quantity === undefined || quantity === null) {
            return res.status(400).json({ error: 'Quantity is required' });
        }

        // Validate reason
        const validReasons = ['DAMAGED', 'EXPIRED', 'THEFT', 'LOST', 'FOUND', 'COUNT_ADJUSTMENT', 'OTHER'];
        const normalizedReason = reason?.toUpperCase() || 'OTHER';

        if (!validReasons.includes(normalizedReason)) {
            return res.status(400).json({
                error: `Invalid reason. Must be one of: ${validReasons.join(', ')}`
            });
        }

        const result = await inventoryAccountingService.processInventoryAdjustment({
            tenantId,
            userId,
            itemId: parseInt(itemId),
            reason: normalizedReason,
            quantity: Math.abs(parseFloat(quantity)),
            adjustmentType: adjustmentType || (normalizedReason === 'FOUND' ? 'INCREASE' : 'DECREASE'),
            notes: notes || `Adjustment: ${normalizedReason}`,
            date: date ? new Date(date) : new Date()
        });

        res.status(201).json({
            success: true,
            message: `Inventory adjustment processed: ${result.summary.adjustmentType} of ${Math.abs(result.summary.quantityChange)} units`,
            ...result
        });
    } catch (error) {
        console.error('Error processing inventory adjustment:', error);
        res.status(500).json({ error: error.message || 'Failed to process adjustment' });
    }
});

/**
 * POST /api/inventory/physical-count
 * Process physical inventory count
 * 
 * Sets the quantity to the actual counted value
 * Creates adjustment journal entries as needed
 */
router.post('/physical-count', authenticate, async (req, res) => {
    try {
        const { tenantId, userId } = req.user;
        const { itemId, actualQuantity, notes, date } = req.body;

        if (!itemId) {
            return res.status(400).json({ error: 'Item ID is required' });
        }

        if (actualQuantity === undefined || actualQuantity === null) {
            return res.status(400).json({ error: 'Actual quantity is required' });
        }

        const result = await inventoryAccountingService.processInventoryAdjustment({
            tenantId,
            userId,
            itemId: parseInt(itemId),
            reason: 'COUNT_ADJUSTMENT',
            quantity: parseFloat(actualQuantity),
            adjustmentType: 'SET_TO',
            notes: notes || 'Physical count adjustment',
            date: date ? new Date(date) : new Date()
        });

        res.status(201).json({
            success: true,
            message: `Physical count recorded: ${result.item.previousQty} → ${result.item.newQty} units`,
            ...result
        });
    } catch (error) {
        console.error('Error processing physical count:', error);
        res.status(500).json({ error: error.message || 'Failed to process physical count' });
    }
});

/**
 * GET /api/inventory/accounting/valuation
 * Get comprehensive inventory valuation report
 * 
 * Returns:
 * - Total inventory value at cost
 * - Potential retail value
 * - Gross profit margin
 * - Breakdown by category
 * - Top items by value
 */
router.get('/accounting/valuation', authenticate, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        const valuation = await inventoryAccountingService.getInventoryValuation(tenantId);

        res.json({
            success: true,
            report: 'Inventory Valuation Report',
            asOfDate: new Date().toISOString(),
            ...valuation
        });
    } catch (error) {
        console.error('Error getting inventory valuation:', error);
        res.status(500).json({ error: 'Failed to get inventory valuation' });
    }
});

/**
 * GET /api/inventory/:itemId/history
 * Get stock movement history for an item
 */
router.get('/:itemId/history', authenticate, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { itemId } = req.params;
        const { startDate, endDate, limit = 50 } = req.query;

        const where = {
            itemId: parseInt(itemId),
            tenantId
        };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const movements = await prisma.stockMovement.findMany({
            where,
            orderBy: { date: 'desc' },
            take: parseInt(limit),
            include: {
                journal: {
                    select: {
                        id: true,
                        reference: true,
                        description: true
                    }
                }
            }
        });

        // Get the item details
        const item = await prisma.inventoryItem.findFirst({
            where: { id: parseInt(itemId), tenantId },
            select: {
                id: true,
                name: true,
                sku: true,
                quantity: true,
                costPrice: true,
                weightedAvgCost: true,
                sellingPrice: true
            }
        });

        res.json({
            item,
            currentStock: Number(item?.quantity || 0),
            currentWAC: Number(item?.weightedAvgCost || item?.costPrice || 0),
            movements: movements.map(m => ({
                id: m.id,
                date: m.date,
                type: m.type,
                reason: m.reason,
                quantity: Number(m.quantity),
                unitCost: Number(m.unitCost),
                totalValue: Number(m.totalValue || (m.quantity * m.unitCost)),
                qtyBefore: Number(m.qtyBefore || 0),
                qtyAfter: Number(m.qtyAfter || 0),
                wacBefore: Number(m.wacBefore || 0),
                wacAfter: Number(m.wacAfter || 0),
                reference: m.reference,
                notes: m.notes,
                journal: m.journal
            }))
        });
    } catch (error) {
        console.error('Error getting item history:', error);
        res.status(500).json({ error: 'Failed to get item history' });
    }
});

/**
 * GET /api/inventory/cogs-report
 * Get Cost of Goods Sold report for a period
 */
router.get('/cogs-report', authenticate, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date();

        // Get all SALE movements in the period
        const saleMovements = await prisma.stockMovement.findMany({
            where: {
                tenantId,
                reason: 'SALE',
                date: {
                    gte: start,
                    lte: end
                }
            },
            include: {
                item: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        category: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        // Calculate totals
        let totalCOGS = 0;
        const categoryBreakdown = {};
        const itemBreakdown = {};

        for (const movement of saleMovements) {
            const value = Math.abs(Number(movement.totalValue || (movement.quantity * movement.unitCost)));
            totalCOGS += value;

            const category = movement.item?.category || 'Uncategorized';
            if (!categoryBreakdown[category]) {
                categoryBreakdown[category] = { category, cogs: 0, units: 0 };
            }
            categoryBreakdown[category].cogs += value;
            categoryBreakdown[category].units += Math.abs(Number(movement.quantity));

            const itemId = movement.item?.id || 'unknown';
            if (!itemBreakdown[itemId]) {
                itemBreakdown[itemId] = {
                    id: itemId,
                    name: movement.item?.name || 'Unknown',
                    sku: movement.item?.sku || '',
                    cogs: 0,
                    units: 0
                };
            }
            itemBreakdown[itemId].cogs += value;
            itemBreakdown[itemId].units += Math.abs(Number(movement.quantity));
        }

        res.json({
            report: 'Cost of Goods Sold Report',
            period: {
                start: start.toISOString(),
                end: end.toISOString()
            },
            totalCOGS: Math.round(totalCOGS * 100) / 100,
            transactions: saleMovements.length,
            byCategory: Object.values(categoryBreakdown)
                .sort((a, b) => b.cogs - a.cogs),
            byItem: Object.values(itemBreakdown)
                .sort((a, b) => b.cogs - a.cogs)
                .slice(0, 20)
        });
    } catch (error) {
        console.error('Error generating COGS report:', error);
        res.status(500).json({ error: 'Failed to generate COGS report' });
    }
});

export default router;
