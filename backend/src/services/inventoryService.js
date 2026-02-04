/**
 * Inventory Service
 * Core business logic for inventory/stock management with WORLD-CLASS features
 * 
 * This service handles:
 * - Product creation with Auto-SKU generation
 * - Weighted Average Cost (WAC) calculation
 * - Stock adjustments (in/out/adjustments)
 * - Automated journal entries for stock movements
 * - Inventory valuation history
 * 
 * Following best practices for inventory accounting:
 * - FIFO/Weighted Average costing
 * - Double-entry bookkeeping integration
 * - Audit trail for all movements
 */

import { prisma } from '../lib/prisma.js';
import { createJournalEntry } from './accountingService.js';

// ============================================
// SKU GENERATION UTILITIES
// ============================================

/**
 * Generate a unique SKU for a product
 * Format: {PREFIX}-{CATEGORY_CODE}-{RANDOM_ALPHANUMERIC}
 * 
 * Examples:
 * - PRD-ELEC-X7K9
 * - PRD-FOOD-A2B5
 * - PRD-APRL-M3N8
 * 
 * @param {Object} options - Options for SKU generation
 * @param {string} options.category - Product category
 * @param {string} options.name - Product name (optional, for fallback)
 * @param {number} options.tenantId - Tenant ID for uniqueness check
 * @returns {Promise<string>} Generated unique SKU
 */
export async function generateSKU({ category, name, tenantId }) {
    const prefix = 'PRD';

    // Category code: first 4 letters, uppercase
    let categoryCode = 'GNRL'; // Default: General
    if (category) {
        categoryCode = category
            .replace(/[^a-zA-Z]/g, '')
            .substring(0, 4)
            .toUpperCase()
            .padEnd(4, 'X');
    } else if (name) {
        // Fallback to first 4 letters of name
        categoryCode = name
            .replace(/[^a-zA-Z]/g, '')
            .substring(0, 4)
            .toUpperCase()
            .padEnd(4, 'X');
    }

    // Generate random alphanumeric suffix
    const generateRandomSuffix = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let suffix = '';
        for (let i = 0; i < 4; i++) {
            suffix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return suffix;
    };

    // Try up to 10 times to generate a unique SKU
    let attempts = 0;
    let sku = '';
    let isUnique = false;

    while (!isUnique && attempts < 10) {
        const randomSuffix = generateRandomSuffix();
        sku = `${prefix}-${categoryCode}-${randomSuffix}`;

        // Check if SKU already exists
        const existing = await prisma.inventoryItem.findFirst({
            where: { tenantId, sku }
        });

        if (!existing) {
            isUnique = true;
        }
        attempts++;
    }

    // Fallback: use timestamp if all attempts failed
    if (!isUnique) {
        const timestamp = Date.now().toString(36).toUpperCase();
        sku = `${prefix}-${categoryCode}-${timestamp.slice(-4)}`;
    }

    return sku;
}

/**
 * Validate barcode format (EAN-13, UPC-A, or custom)
 * 
 * @param {string} barcode - Barcode to validate
 * @returns {Object} { valid: boolean, type: string, message: string }
 */
export function validateBarcode(barcode) {
    if (!barcode) return { valid: true, type: null, message: 'No barcode provided' };

    const cleanBarcode = barcode.replace(/[-\s]/g, '');

    // EAN-13: 13 digits
    if (/^\d{13}$/.test(cleanBarcode)) {
        return { valid: true, type: 'EAN-13', message: 'Valid EAN-13 barcode' };
    }

    // UPC-A: 12 digits
    if (/^\d{12}$/.test(cleanBarcode)) {
        return { valid: true, type: 'UPC-A', message: 'Valid UPC-A barcode' };
    }

    // Custom: alphanumeric, 4-20 characters
    if (/^[A-Za-z0-9]{4,20}$/.test(cleanBarcode)) {
        return { valid: true, type: 'CUSTOM', message: 'Valid custom barcode' };
    }

    return { valid: false, type: null, message: 'Invalid barcode format' };
}

// ============================================
// WEIGHTED AVERAGE COST (WAC) CALCULATION
// ============================================

/**
 * Calculate new Weighted Average Cost after a purchase
 * WAC = (Existing Inventory Value + New Purchase Value) / (Existing Qty + New Qty)
 * 
 * @param {Object} params - Parameters
 * @param {number} params.currentQty - Current quantity on hand
 * @param {number} params.currentWAC - Current weighted average cost
 * @param {number} params.purchaseQty - Quantity being purchased
 * @param {number} params.purchaseUnitCost - Unit cost of new purchase
 * @returns {Object} { newWAC, existingValue, purchaseValue, totalValue, totalQty }
 */
export function calculateWeightedAverageCost({
    currentQty = 0,
    currentWAC = 0,
    purchaseQty,
    purchaseUnitCost
}) {
    // Validate inputs
    if (purchaseQty <= 0) {
        throw new Error('Purchase quantity must be positive');
    }
    if (purchaseUnitCost < 0) {
        throw new Error('Purchase unit cost cannot be negative');
    }

    const existingValue = Number(currentQty) * Number(currentWAC);
    const purchaseValue = Number(purchaseQty) * Number(purchaseUnitCost);
    const totalValue = existingValue + purchaseValue;
    const totalQty = Number(currentQty) + Number(purchaseQty);

    // Calculate new WAC
    const newWAC = totalQty > 0 ? totalValue / totalQty : purchaseUnitCost;

    return {
        newWAC: Math.round(newWAC * 100) / 100, // Round to 2 decimal places
        existingValue,
        purchaseValue,
        totalValue,
        totalQty
    };
}

/**
 * Calculate Cost of Goods Sold (COGS) using Weighted Average Cost
 * 
 * @param {Object} params - Parameters
 * @param {number} params.quantity - Quantity being sold
 * @param {number} params.weightedAvgCost - Current WAC
 * @returns {number} COGS value
 */
export function calculateCOGS({ quantity, weightedAvgCost }) {
    if (quantity <= 0) {
        throw new Error('Quantity must be positive');
    }
    return Number(quantity) * Number(weightedAvgCost);
}

// ============================================
// PRODUCT CREATION SERVICE
// ============================================

/**
 * Create a new product/inventory item with auto-SKU generation
 * 
 * @param {Object} params - Product creation parameters
 * @param {number} params.tenantId - Tenant ID
 * @param {number} params.userId - User creating the product
 * @param {string} params.name - Product name (required)
 * @param {string} params.sku - SKU (optional, will be auto-generated if not provided)
 * @param {string} params.barcode - Barcode (optional)
 * @param {string} params.description - Product description
 * @param {string} params.productType - GOODS, SERVICE, or BUNDLE
 * @param {string} params.category - Product category
 * @param {string} params.brand - Brand name
 * @param {string} params.unit - Unit of measurement
 * @param {number} params.costPrice - Cost/purchase price
 * @param {number} params.sellingPrice - Selling price
 * @param {number} params.minSellingPrice - Minimum selling price (floor)
 * @param {number} params.wholesalePrice - Wholesale price
 * @param {number} params.taxRate - Tax/VAT rate (default 16%)
 * @param {boolean} params.isTaxInclusive - Whether prices include tax
 * @param {number} params.reorderLevel - Alert threshold
 * @param {number} params.reorderQuantity - Suggested reorder quantity
 * @param {number} params.maxStockLevel - Maximum stock level
 * @param {number} params.assetAccountId - Inventory asset account ID
 * @param {number} params.cogsAccountId - COGS account ID
 * @param {number} params.incomeAccountId - Sales income account ID
 * @param {string} params.imageUrl - Product image URL
 * @param {string} params.notes - Internal notes
 * @param {Object} params.metadata - Additional flexible metadata
 * @returns {Promise<Object>} Created inventory item
 */
export async function createProduct({
    tenantId,
    userId,
    name,
    sku,
    barcode,
    description,
    productType = 'GOODS',
    category,
    brand,
    unit = 'pcs',
    costPrice,
    sellingPrice,
    minSellingPrice,
    wholesalePrice,
    taxRate = 16,
    isTaxInclusive = true,
    reorderLevel,
    reorderQuantity,
    maxStockLevel,
    assetAccountId,
    cogsAccountId,
    incomeAccountId,
    imageUrl,
    notes,
    metadata
}) {
    // Validation
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }
    if (!name || name.trim() === '') {
        throw new Error('Product name is required');
    }
    if (costPrice === undefined || costPrice === null) {
        throw new Error('Cost price is required');
    }
    if (sellingPrice === undefined || sellingPrice === null) {
        throw new Error('Selling price is required');
    }

    // Validate barcode if provided
    if (barcode) {
        const barcodeValidation = validateBarcode(barcode);
        if (!barcodeValidation.valid) {
            throw new Error(barcodeValidation.message);
        }

        // Check for duplicate barcode
        const existingBarcode = await prisma.inventoryItem.findFirst({
            where: { tenantId, barcode }
        });
        if (existingBarcode) {
            throw new Error('Barcode already exists for another product');
        }
    }

    // Auto-generate SKU if not provided
    let finalSKU = sku;
    if (!sku || sku.trim() === '') {
        finalSKU = await generateSKU({ category, name, tenantId });
    } else {
        // Check if provided SKU already exists
        const existingSKU = await prisma.inventoryItem.findFirst({
            where: { tenantId, sku }
        });
        if (existingSKU) {
            throw new Error('SKU already exists');
        }
    }

    // Get default accounts if not provided
    if (!assetAccountId) {
        const inventoryAccount = await prisma.account.findFirst({
            where: { tenantId, code: '1201' } // Merchandise Inventory
        });
        if (inventoryAccount) {
            assetAccountId = inventoryAccount.id;
        } else {
            throw new Error('Inventory asset account not found. Please set up your Chart of Accounts.');
        }
    }

    if (!cogsAccountId) {
        const cogsAccount = await prisma.account.findFirst({
            where: { tenantId, code: '5001' } // Cost of Sales - Inventory
        });
        if (cogsAccount) {
            cogsAccountId = cogsAccount.id;
        } else {
            throw new Error('COGS account not found. Please set up your Chart of Accounts.');
        }
    }

    if (!incomeAccountId) {
        const incomeAccount = await prisma.account.findFirst({
            where: { tenantId, code: '4101' } // Product Sales
        });
        if (incomeAccount) {
            incomeAccountId = incomeAccount.id;
        }
    }

    // Create the product
    const product = await prisma.inventoryItem.create({
        data: {
            tenantId,
            sku: finalSKU,
            barcode: barcode || null,
            name: name.trim(),
            description: description?.trim() || null,
            imageUrl: imageUrl || null,
            productType,
            category: category?.trim() || null,
            brand: brand?.trim() || null,
            unit: unit || 'pcs',
            costPrice: Number(costPrice),
            weightedAvgCost: Number(costPrice), // Initially equals cost price
            sellingPrice: Number(sellingPrice),
            minSellingPrice: minSellingPrice ? Number(minSellingPrice) : null,
            wholesalePrice: wholesalePrice ? Number(wholesalePrice) : null,
            taxRate: Number(taxRate),
            isTaxInclusive: Boolean(isTaxInclusive),
            quantity: 0, // Always starts at 0, stock comes via purchase/adjustment
            reservedQty: 0,
            reorderLevel: reorderLevel ? Number(reorderLevel) : null,
            reorderQuantity: reorderQuantity ? Number(reorderQuantity) : null,
            maxStockLevel: maxStockLevel ? Number(maxStockLevel) : null,
            assetAccountId: parseInt(assetAccountId),
            cogsAccountId: parseInt(cogsAccountId),
            incomeAccountId: incomeAccountId ? parseInt(incomeAccountId) : null,
            isActive: true,
            isSellable: productType !== 'SERVICE' || true,
            isPurchasable: true,
            notes: notes?.trim() || null,
            metadata: metadata || null,
            createdById: userId || null
        }
    });

    console.log(`[InventoryService] Created product: ${product.name} (SKU: ${product.sku})`);

    return {
        ...product,
        costPrice: Number(product.costPrice),
        weightedAvgCost: Number(product.weightedAvgCost),
        sellingPrice: Number(product.sellingPrice),
        quantity: Number(product.quantity)
    };
}

// ============================================
// STOCK ADJUSTMENT SERVICE
// ============================================

/**
 * Movement reasons with accounting implications
 */
export const MOVEMENT_REASONS = {
    PURCHASE: { label: 'Purchase', type: 'IN', requiresJournal: true, journalType: 'ASSET_INCREASE' },
    SALE: { label: 'Sale', type: 'OUT', requiresJournal: true, journalType: 'COGS' },
    CUSTOMER_RETURN: { label: 'Customer Return', type: 'IN', requiresJournal: true, journalType: 'COGS_REVERSAL' },
    SUPPLIER_RETURN: { label: 'Supplier Return', type: 'OUT', requiresJournal: true, journalType: 'ASSET_DECREASE' },
    DAMAGED: { label: 'Damaged Goods', type: 'OUT', requiresJournal: true, journalType: 'WRITE_OFF' },
    EXPIRED: { label: 'Expired Goods', type: 'OUT', requiresJournal: true, journalType: 'WRITE_OFF' },
    THEFT: { label: 'Theft/Shrinkage', type: 'OUT', requiresJournal: true, journalType: 'WRITE_OFF' },
    LOST: { label: 'Lost/Missing', type: 'OUT', requiresJournal: true, journalType: 'WRITE_OFF' },
    FOUND: { label: 'Found', type: 'IN', requiresJournal: true, journalType: 'GAIN' },
    COUNT_ADJUSTMENT: { label: 'Physical Count', type: 'ADJUSTMENT', requiresJournal: true, journalType: 'ADJUSTMENT' },
    OPENING_STOCK: { label: 'Opening Stock', type: 'IN', requiresJournal: true, journalType: 'OPENING' },
    PRODUCTION: { label: 'Used in Production', type: 'OUT', requiresJournal: true, journalType: 'WIP' },
    SAMPLE: { label: 'Given as Sample', type: 'OUT', requiresJournal: true, journalType: 'MARKETING_EXPENSE' },
    TRANSFER_IN: { label: 'Transfer In', type: 'IN', requiresJournal: false },
    TRANSFER_OUT: { label: 'Transfer Out', type: 'OUT', requiresJournal: false }
};

/**
 * Adjust stock levels with proper WAC calculation and journal entries
 * 
 * This is the MASTER function for all stock movements. It handles:
 * - Stock IN (purchases, returns, adjustments)
 * - Stock OUT (sales, damage, theft, etc.)
 * - Weighted Average Cost updates
 * - Automated journal entries
 * - Audit trail (valuation history)
 * 
 * @param {Object} params - Adjustment parameters
 * @param {number} params.tenantId - Tenant ID
 * @param {number} params.userId - User making the adjustment
 * @param {number} params.itemId - Inventory item ID
 * @param {string} params.type - Movement type: IN, OUT, ADJUSTMENT
 * @param {string} params.reason - Movement reason (from MOVEMENT_REASONS keys)
 * @param {number} params.quantity - Quantity (always positive, direction determined by type)
 * @param {number} params.unitCost - Unit cost (required for IN movements, optional for OUT)
 * @param {string} params.reference - External reference (PO number, invoice, etc.)
 * @param {string} params.sourceType - Source document type: PURCHASE, INVOICE, ADJUSTMENT, OPENING
 * @param {number} params.sourceId - Source document ID
 * @param {string} params.notes - Additional notes
 * @param {Date} params.date - Movement date (defaults to now)
 * @returns {Promise<Object>} Stock movement record with updated item
 */
export async function adjustStock({
    tenantId,
    userId,
    itemId,
    type,
    reason,
    quantity,
    unitCost,
    reference,
    sourceType,
    sourceId,
    notes,
    date = new Date()
}) {
    // Validation
    if (!tenantId) throw new Error('Tenant ID is required');
    if (!itemId) throw new Error('Item ID is required');
    if (!type || !['IN', 'OUT', 'ADJUSTMENT'].includes(type)) {
        throw new Error('Type must be IN, OUT, or ADJUSTMENT');
    }
    if (!quantity || quantity <= 0) {
        throw new Error('Quantity must be a positive number');
    }

    // Get the inventory item
    const item = await prisma.inventoryItem.findFirst({
        where: { id: parseInt(itemId), tenantId }
    });

    if (!item) {
        throw new Error('Inventory item not found');
    }

    // Get reason config
    const reasonConfig = reason ? MOVEMENT_REASONS[reason] : null;

    // Current values
    const currentQty = Number(item.quantity);
    const currentWAC = Number(item.weightedAvgCost || item.costPrice);

    // Calculate new values
    let newQty = currentQty;
    let newWAC = currentWAC;
    let movementQty = Number(quantity);
    let movementValue = 0;
    let wacBefore = currentWAC;
    let wacAfter = currentWAC;

    // Determine cost for the movement
    let effectiveUnitCost = unitCost ? Number(unitCost) : currentWAC;

    if (type === 'IN') {
        // Stock increase
        if (!unitCost && reason !== 'FOUND' && reason !== 'CUSTOMER_RETURN') {
            throw new Error('Unit cost is required for stock-in movements');
        }

        // For customer returns, use the current WAC
        if (reason === 'CUSTOMER_RETURN' && !unitCost) {
            effectiveUnitCost = currentWAC;
        }

        // Calculate new WAC
        const wacCalc = calculateWeightedAverageCost({
            currentQty,
            currentWAC,
            purchaseQty: movementQty,
            purchaseUnitCost: effectiveUnitCost
        });

        newQty = wacCalc.totalQty;
        newWAC = wacCalc.newWAC;
        wacAfter = newWAC;
        movementValue = wacCalc.purchaseValue;

    } else if (type === 'OUT') {
        // Stock decrease
        if (movementQty > currentQty) {
            throw new Error(`Insufficient stock. Available: ${currentQty}, Requested: ${movementQty}`);
        }

        newQty = currentQty - movementQty;
        // WAC doesn't change on stock out
        movementValue = movementQty * currentWAC;
        effectiveUnitCost = currentWAC; // Always use WAC for out movements

    } else if (type === 'ADJUSTMENT') {
        // Set to exact quantity (physical count)
        const adjustedQty = Number(quantity);
        const variance = adjustedQty - currentQty;

        if (variance > 0) {
            // Stock found/increased
            if (!unitCost) {
                effectiveUnitCost = currentWAC;
            }
            const wacCalc = calculateWeightedAverageCost({
                currentQty,
                currentWAC,
                purchaseQty: variance,
                purchaseUnitCost: effectiveUnitCost
            });
            newQty = wacCalc.totalQty;
            newWAC = wacCalc.newWAC;
            wacAfter = newWAC;
            movementValue = Math.abs(variance) * effectiveUnitCost;
        } else if (variance < 0) {
            // Stock lost/decreased
            newQty = adjustedQty;
            movementValue = Math.abs(variance) * currentWAC;
            effectiveUnitCost = currentWAC;
        } else {
            // No change
            return {
                success: true,
                item,
                message: 'No adjustment needed - quantity matches'
            };
        }

        movementQty = variance; // Can be negative
    }

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
        // 1. Create Journal Entry (if required)
        let journalId = null;

        if (reasonConfig?.requiresJournal) {
            const journal = await createStockMovementJournal({
                tx,
                tenantId,
                userId,
                item,
                type,
                reason,
                reasonConfig,
                quantity: Math.abs(movementQty),
                unitCost: effectiveUnitCost,
                totalValue: Math.abs(movementValue),
                reference,
                date
            });
            journalId = journal?.id || null;
        }

        // 2. Create Stock Movement Record
        const movement = await tx.stockMovement.create({
            data: {
                tenantId,
                itemId: parseInt(itemId),
                type,
                reason: reason || null,
                quantity: movementQty, // Signed: positive for IN, negative for OUT
                unitCost: effectiveUnitCost,
                totalValue: movementValue,
                wacBefore,
                wacAfter: newWAC,
                qtyBefore: currentQty,
                qtyAfter: newQty,
                reference,
                sourceType,
                sourceId: sourceId ? parseInt(sourceId) : null,
                date: new Date(date),
                notes,
                journalId,
                createdById: userId || null
            }
        });

        // 3. Record Valuation History
        await tx.inventoryValuation.create({
            data: {
                itemId: parseInt(itemId),
                date: new Date(date),
                qtyBefore: currentQty,
                qtyAfter: newQty,
                costBefore: currentWAC,
                costAfter: newWAC,
                transactionType: sourceType || type,
                reference: reference || movement.id.toString(),
                notes: `${type}: ${Math.abs(movementQty)} units @ ${effectiveUnitCost}`
            }
        });

        // 4. Update Inventory Item
        const updatedItem = await tx.inventoryItem.update({
            where: { id: parseInt(itemId) },
            data: {
                quantity: newQty,
                weightedAvgCost: newWAC,
                costPrice: type === 'IN' && reason === 'PURCHASE' ? effectiveUnitCost : item.costPrice
            }
        });

        return { movement, updatedItem };
    });

    console.log(`[InventoryService] Stock ${type}: ${item.name} | Qty: ${currentQty} -> ${newQty} | WAC: ${wacBefore} -> ${newWAC}`);

    return {
        success: true,
        movement: {
            ...result.movement,
            quantity: Number(result.movement.quantity),
            unitCost: Number(result.movement.unitCost),
            totalValue: Number(result.movement.totalValue)
        },
        item: {
            ...result.updatedItem,
            quantity: Number(result.updatedItem.quantity),
            weightedAvgCost: Number(result.updatedItem.weightedAvgCost),
            costPrice: Number(result.updatedItem.costPrice)
        },
        summary: {
            previousQty: currentQty,
            newQty,
            previousWAC: wacBefore,
            newWAC,
            movementValue
        }
    };
}

// ============================================
// AUTOMATED JOURNALING SERVICE
// ============================================

/**
 * Create journal entry for stock movement
 * This handles all the accounting implications of stock movements
 * 
 * Journal Entry Patterns:
 * 
 * 1. PURCHASE (Stock In from Supplier):
 *    DR: Inventory Asset (1200)
 *    CR: Accounts Payable (2000) or Cash/Bank (1xxx)
 * 
 * 2. SALE (Stock Out to Customer):
 *    DR: Cost of Goods Sold (5001)
 *    CR: Inventory Asset (1200)
 *    (Revenue side handled by invoice)
 * 
 * 3. CUSTOMER_RETURN (Stock In from returned sale):
 *    DR: Inventory Asset (1200)
 *    CR: Cost of Goods Sold (5001)
 * 
 * 4. SUPPLIER_RETURN:
 *    DR: Accounts Payable (2000)
 *    CR: Inventory Asset (1200)
 * 
 * 5. WRITE_OFF (Damaged, Expired, Theft, Lost):
 *    DR: Inventory Write-Off Expense (5199 or specific expense)
 *    CR: Inventory Asset (1200)
 * 
 * 6. GAIN (Found stock):
 *    DR: Inventory Asset (1200)
 *    CR: Other Income (4290)
 * 
 * 7. ADJUSTMENT (Physical count):
 *    If positive: DR Inventory, CR Inventory Adjustment
 *    If negative: DR Inventory Adjustment, CR Inventory
 * 
 * 8. OPENING_STOCK:
 *    DR: Inventory Asset (1200)
 *    CR: Owner's Capital (3001) or Opening Balance Equity
 * 
 * @param {Object} params - Journal parameters
 * @returns {Promise<Object>} Created journal entry
 */
async function createStockMovementJournal({
    tx,
    tenantId,
    userId,
    item,
    type,
    reason,
    reasonConfig,
    quantity,
    unitCost,
    totalValue,
    reference,
    date
}) {
    try {
        // Get account codes
        const inventoryAssetCode = '1201'; // Merchandise Inventory
        const cogsCode = '5001';           // Cost of Sales - Inventory
        const writeOffCode = '5199';       // Uncategorized Expense (can be specific)
        const adjustmentCode = '5002';     // Purchase Price Variance / Adjustment
        const otherIncomeCode = '4290';    // Miscellaneous Income
        const ownerCapitalCode = '3001';   // Owner's Capital
        const apCode = '2000';             // Accounts Payable

        // Find accounts
        const [inventoryAccount, cogsAccount, writeOffAccount, adjustmentAccount, otherIncomeAccount, capitalAccount, apAccount] = await Promise.all([
            tx.account.findFirst({ where: { tenantId, code: inventoryAssetCode } }),
            tx.account.findFirst({ where: { tenantId, code: cogsCode } }),
            tx.account.findFirst({ where: { tenantId, code: writeOffCode } }),
            tx.account.findFirst({ where: { tenantId, code: adjustmentCode } }),
            tx.account.findFirst({ where: { tenantId, code: otherIncomeCode } }),
            tx.account.findFirst({ where: { tenantId, code: ownerCapitalCode } }),
            tx.account.findFirst({ where: { tenantId, code: apCode } })
        ]);

        // Use item's accounts if available
        const assetAccountId = item.assetAccountId || inventoryAccount?.id;
        const cogsAccountId = item.cogsAccountId || cogsAccount?.id;

        if (!assetAccountId) {
            console.warn(`[InventoryService] No inventory asset account found for item ${item.id}`);
            return null;
        }

        // Build journal lines based on movement type
        let journalLines = [];
        let description = `Stock ${type}: ${item.name}`;

        switch (reasonConfig?.journalType) {
            case 'ASSET_INCREASE':
                // Purchase: DR Inventory, CR AP
                journalLines = [
                    { accountId: assetAccountId, debit: totalValue, credit: 0, description: `Inventory In: ${item.name}` },
                    { accountId: apAccount?.id || assetAccountId, debit: 0, credit: totalValue, description: `Purchase: ${item.name}` }
                ];
                description = `Purchase: ${quantity} × ${item.name} @ ${unitCost}`;
                break;

            case 'COGS':
                // Sale: DR COGS, CR Inventory
                if (!cogsAccountId) {
                    console.warn(`[InventoryService] No COGS account found for item ${item.id}`);
                    return null;
                }
                journalLines = [
                    { accountId: cogsAccountId, debit: totalValue, credit: 0, description: `COGS: ${item.name}` },
                    { accountId: assetAccountId, debit: 0, credit: totalValue, description: `Inventory Out: ${item.name}` }
                ];
                description = `Sale COGS: ${quantity} × ${item.name} @ ${unitCost}`;
                break;

            case 'COGS_REVERSAL':
                // Customer Return: DR Inventory, CR COGS
                if (!cogsAccountId) return null;
                journalLines = [
                    { accountId: assetAccountId, debit: totalValue, credit: 0, description: `Return In: ${item.name}` },
                    { accountId: cogsAccountId, debit: 0, credit: totalValue, description: `COGS Reversal: ${item.name}` }
                ];
                description = `Customer Return: ${quantity} × ${item.name}`;
                break;

            case 'ASSET_DECREASE':
                // Supplier Return: DR AP, CR Inventory
                journalLines = [
                    { accountId: apAccount?.id || assetAccountId, debit: totalValue, credit: 0, description: `Supplier Return: ${item.name}` },
                    { accountId: assetAccountId, debit: 0, credit: totalValue, description: `Inventory Out: ${item.name}` }
                ];
                description = `Supplier Return: ${quantity} × ${item.name}`;
                break;

            case 'WRITE_OFF':
                // Damaged/Expired/Theft/Lost: DR Expense, CR Inventory
                const expenseAccountId = writeOffAccount?.id || cogsAccountId;
                if (!expenseAccountId) return null;
                journalLines = [
                    { accountId: expenseAccountId, debit: totalValue, credit: 0, description: `Write-off: ${item.name} (${reason})` },
                    { accountId: assetAccountId, debit: 0, credit: totalValue, description: `Inventory Write-off: ${item.name}` }
                ];
                description = `Stock Write-off (${reason}): ${quantity} × ${item.name}`;
                break;

            case 'GAIN':
                // Found stock: DR Inventory, CR Other Income
                const incomeAccountId = otherIncomeAccount?.id;
                if (!incomeAccountId) return null;
                journalLines = [
                    { accountId: assetAccountId, debit: totalValue, credit: 0, description: `Found Stock: ${item.name}` },
                    { accountId: incomeAccountId, debit: 0, credit: totalValue, description: `Stock Gain: ${item.name}` }
                ];
                description = `Stock Found: ${quantity} × ${item.name}`;
                break;

            case 'ADJUSTMENT':
                // Physical count adjustment
                const adjAccountId = adjustmentAccount?.id || writeOffAccount?.id || cogsAccountId;
                if (!adjAccountId) return null;

                if (quantity > 0) {
                    // Positive adjustment (found more than expected)
                    journalLines = [
                        { accountId: assetAccountId, debit: totalValue, credit: 0, description: `Inventory Adjustment (+): ${item.name}` },
                        { accountId: adjAccountId, debit: 0, credit: totalValue, description: `Count Adjustment: ${item.name}` }
                    ];
                } else {
                    // Negative adjustment (found less than expected)
                    journalLines = [
                        { accountId: adjAccountId, debit: totalValue, credit: 0, description: `Count Adjustment: ${item.name}` },
                        { accountId: assetAccountId, debit: 0, credit: totalValue, description: `Inventory Adjustment (-): ${item.name}` }
                    ];
                }
                description = `Physical Count Adjustment: ${item.name} (${quantity > 0 ? '+' : ''}${quantity})`;
                break;

            case 'OPENING':
                // Opening stock: DR Inventory, CR Capital
                const capAccountId = capitalAccount?.id;
                if (!capAccountId) return null;
                journalLines = [
                    { accountId: assetAccountId, debit: totalValue, credit: 0, description: `Opening Stock: ${item.name}` },
                    { accountId: capAccountId, debit: 0, credit: totalValue, description: `Opening Balance: ${item.name}` }
                ];
                description = `Opening Stock: ${quantity} × ${item.name} @ ${unitCost}`;
                break;

            case 'MARKETING_EXPENSE':
                // Sample given: DR Marketing Expense, CR Inventory
                const marketingAccount = await tx.account.findFirst({ where: { tenantId, code: '6304' } }); // Branding & Design
                const mktAccountId = marketingAccount?.id || writeOffAccount?.id || cogsAccountId;
                if (!mktAccountId) return null;
                journalLines = [
                    { accountId: mktAccountId, debit: totalValue, credit: 0, description: `Sample Given: ${item.name}` },
                    { accountId: assetAccountId, debit: 0, credit: totalValue, description: `Inventory Out (Sample): ${item.name}` }
                ];
                description = `Sample Given: ${quantity} × ${item.name}`;
                break;

            case 'WIP':
                // Production use: DR WIP, CR Inventory
                const wipAccount = await tx.account.findFirst({ where: { tenantId, code: '1203' } }); // Work in Progress
                const wipAccountId = wipAccount?.id || cogsAccountId;
                if (!wipAccountId) return null;
                journalLines = [
                    { accountId: wipAccountId, debit: totalValue, credit: 0, description: `Production Use: ${item.name}` },
                    { accountId: assetAccountId, debit: 0, credit: totalValue, description: `Inventory to Production: ${item.name}` }
                ];
                description = `Used in Production: ${quantity} × ${item.name}`;
                break;

            default:
                // Default: No journal entry for unknown types
                console.log(`[InventoryService] No journal pattern for: ${reasonConfig?.journalType}`);
                return null;
        }

        // Filter out any lines with null account IDs
        journalLines = journalLines.filter(line => line.accountId);

        if (journalLines.length < 2) {
            console.warn(`[InventoryService] Insufficient journal lines for ${reason || type}`);
            return null;
        }

        // Create the journal
        const journal = await tx.journal.create({
            data: {
                tenantId,
                reference: reference || `STK-${Date.now()}`,
                date: new Date(date),
                description,
                status: 'POSTED',
                createdById: userId || null,
                lines: {
                    create: journalLines
                }
            },
            include: {
                lines: {
                    include: {
                        account: { select: { id: true, code: true, name: true } }
                    }
                }
            }
        });

        console.log(`[InventoryService] Created journal ${journal.id} for ${reason || type}: ${description}`);

        return journal;

    } catch (error) {
        console.error('[InventoryService] Error creating stock movement journal:', error);
        // Don't throw - we want the stock movement to succeed even if journaling fails
        return null;
    }
}

// ============================================
// PURCHASE INTEGRATION
// ============================================

/**
 * Process inventory items from a purchase
 * Updates stock levels and WAC for all items in the purchase
 * 
 * @param {Object} params - Purchase parameters
 * @param {number} params.tenantId - Tenant ID
 * @param {number} params.userId - User ID
 * @param {number} params.purchaseId - Purchase ID
 * @param {Array} params.items - Array of { itemId, quantity, unitCost }
 * @returns {Promise<Array>} Array of stock movement results
 */
export async function processInventoryPurchase({
    tenantId,
    userId,
    purchaseId,
    items
}) {
    const results = [];

    for (const item of items) {
        if (!item.itemId || !item.quantity || item.quantity <= 0) continue;

        try {
            const result = await adjustStock({
                tenantId,
                userId,
                itemId: item.itemId,
                type: 'IN',
                reason: 'PURCHASE',
                quantity: item.quantity,
                unitCost: item.unitCost,
                reference: `PO-${purchaseId}`,
                sourceType: 'PURCHASE',
                sourceId: purchaseId,
                notes: `From Purchase #${purchaseId}`
            });

            results.push({
                itemId: item.itemId,
                success: true,
                movement: result.movement,
                summary: result.summary
            });

        } catch (error) {
            results.push({
                itemId: item.itemId,
                success: false,
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Process inventory items from an invoice (sale)
 * Decreases stock and records COGS
 * 
 * @param {Object} params - Invoice parameters
 * @returns {Promise<Array>} Array of stock movement results
 */
export async function processInventorySale({
    tenantId,
    userId,
    invoiceId,
    items
}) {
    const results = [];

    for (const item of items) {
        if (!item.itemId || !item.quantity || item.quantity <= 0) continue;

        try {
            const result = await adjustStock({
                tenantId,
                userId,
                itemId: item.itemId,
                type: 'OUT',
                reason: 'SALE',
                quantity: item.quantity,
                reference: `INV-${invoiceId}`,
                sourceType: 'INVOICE',
                sourceId: invoiceId,
                notes: `From Invoice #${invoiceId}`
            });

            results.push({
                itemId: item.itemId,
                success: true,
                movement: result.movement,
                summary: result.summary,
                cogs: result.summary.movementValue
            });

        } catch (error) {
            results.push({
                itemId: item.itemId,
                success: false,
                error: error.message
            });
        }
    }

    return results;
}

// ============================================
// EXPORTS
// ============================================

export default {
    // SKU Generation
    generateSKU,
    validateBarcode,

    // WAC Calculation
    calculateWeightedAverageCost,
    calculateCOGS,

    // Core Services
    createProduct,
    adjustStock,

    // Purchase/Sale Integration
    processInventoryPurchase,
    processInventorySale,

    // Constants
    MOVEMENT_REASONS
};
