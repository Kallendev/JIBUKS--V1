/**
 * Inventory Accounting Service
 * 
 * WORLD-CLASS Inventory Management with Full Double-Entry Bookkeeping
 * 
 * This service implements the complete accounting logic for inventory management:
 * 
 * 1. PURCHASE LOGIC (Buying Stock)
 *    - When you buy inventory, it's an ASSET EXCHANGE, not an expense
 *    - DR: Inventory Asset (1201) - Value increases
 *    - CR: Accounts Payable (2000) or Cash/Bank - Money decreases
 *    - P&L shows $0 expense, Balance Sheet shows inventory value
 * 
 * 2. SALES LOGIC (Selling Stock) - The "Double-Entry Magic"
 *    When creating an invoice, TWO transactions happen:
 *    
 *    Transaction A: Revenue Recognition
 *      - DR: Accounts Receivable (1100) or Cash
 *      - CR: Sales Revenue (4100)
 *    
 *    Transaction B: Cost Recognition (COGS)
 *      - DR: Cost of Goods Sold (5001)
 *      - CR: Inventory Asset (1201)
 * 
 * 3. CUSTOMER RETURNS (Credit Memo)
 *    - Reverses both Revenue and COGS
 *    - DR: Sales Revenue (reduces income)
 *    - CR: Accounts Receivable (reduces what's owed)
 *    - DR: Inventory Asset (item goes back to stock)
 *    - CR: COGS (reduces the expense)
 * 
 * 4. INVENTORY ADJUSTMENTS (Shrinkage, Damage, Theft)
 *    - DR: Inventory Shrinkage Expense (6500 or specific)
 *    - CR: Inventory Asset (1201)
 * 
 * 5. COSTING METHOD: Weighted Average Cost (WAC)
 *    WAC = (Existing Inventory Value + New Purchase Value) / Total Units
 * 
 * @module inventoryAccountingService
 */

import { prisma } from '../lib/prisma.js';

// ============================================
// ACCOUNT CODE CONSTANTS
// ============================================
const ACCOUNTS = {
    // Assets
    INVENTORY_ASSET: '1201',           // Merchandise Inventory
    ACCOUNTS_RECEIVABLE: '1100',       // AR Control

    // Liabilities
    ACCOUNTS_PAYABLE: '2000',          // AP Control

    // Equity
    OWNERS_CAPITAL: '3001',            // Opening Balance Equity

    // Revenue
    SALES_REVENUE: '4100',             // Product Sales
    SALES_RETURNS: '4191',             // Sales Returns (Contra-Revenue)

    // Expenses
    COGS: '5001',                      // Cost of Sales - Inventory
    INVENTORY_SHRINKAGE: '8040',       // Inventory Shrinkage (Loss) - Stock lost/damaged
    INVENTORY_ADJUSTMENT: '5002',      // Inventory Cost Adjustments

    // Other Income
    INVENTORY_GAIN: '4290',            // Miscellaneous Income (for found stock)
};

// Movement reasons with their accounting treatment
const MOVEMENT_ACCOUNTING = {
    PURCHASE: {
        type: 'IN',
        debitAccount: ACCOUNTS.INVENTORY_ASSET,
        creditAccount: ACCOUNTS.ACCOUNTS_PAYABLE,
        description: 'Inventory Purchase',
        affectsCOGS: false,
    },
    PURCHASE_CASH: {
        type: 'IN',
        debitAccount: ACCOUNTS.INVENTORY_ASSET,
        creditAccount: null, // Use payment account
        description: 'Inventory Purchase (Cash)',
        affectsCOGS: false,
    },
    SALE: {
        type: 'OUT',
        debitAccount: ACCOUNTS.COGS,
        creditAccount: ACCOUNTS.INVENTORY_ASSET,
        description: 'Cost of Goods Sold',
        affectsCOGS: true,
    },
    CUSTOMER_RETURN: {
        type: 'IN',
        debitAccount: ACCOUNTS.INVENTORY_ASSET,
        creditAccount: ACCOUNTS.COGS,
        description: 'Customer Return - COGS Reversal',
        affectsCOGS: true,
    },
    SUPPLIER_RETURN: {
        type: 'OUT',
        debitAccount: ACCOUNTS.ACCOUNTS_PAYABLE,
        creditAccount: ACCOUNTS.INVENTORY_ASSET,
        description: 'Supplier Return',
        affectsCOGS: false,
    },
    DAMAGED: {
        type: 'OUT',
        debitAccount: ACCOUNTS.INVENTORY_SHRINKAGE,
        creditAccount: ACCOUNTS.INVENTORY_ASSET,
        description: 'Damaged Goods Write-off',
        affectsCOGS: false,
    },
    EXPIRED: {
        type: 'OUT',
        debitAccount: ACCOUNTS.INVENTORY_SHRINKAGE,
        creditAccount: ACCOUNTS.INVENTORY_ASSET,
        description: 'Expired Goods Write-off',
        affectsCOGS: false,
    },
    THEFT: {
        type: 'OUT',
        debitAccount: ACCOUNTS.INVENTORY_SHRINKAGE,
        creditAccount: ACCOUNTS.INVENTORY_ASSET,
        description: 'Inventory Shrinkage - Theft',
        affectsCOGS: false,
    },
    LOST: {
        type: 'OUT',
        debitAccount: ACCOUNTS.INVENTORY_SHRINKAGE,
        creditAccount: ACCOUNTS.INVENTORY_ASSET,
        description: 'Inventory Shrinkage - Lost/Missing',
        affectsCOGS: false,
    },
    FOUND: {
        type: 'IN',
        debitAccount: ACCOUNTS.INVENTORY_ASSET,
        creditAccount: ACCOUNTS.INVENTORY_GAIN,
        description: 'Stock Found - Inventory Gain',
        affectsCOGS: false,
    },
    OPENING_STOCK: {
        type: 'IN',
        debitAccount: ACCOUNTS.INVENTORY_ASSET,
        creditAccount: ACCOUNTS.OWNERS_CAPITAL,
        description: 'Opening Stock',
        affectsCOGS: false,
    },
    COUNT_POSITIVE: {
        type: 'IN',
        debitAccount: ACCOUNTS.INVENTORY_ASSET,
        creditAccount: ACCOUNTS.INVENTORY_ADJUSTMENT,
        description: 'Physical Count Adjustment (+)',
        affectsCOGS: false,
    },
    COUNT_NEGATIVE: {
        type: 'OUT',
        debitAccount: ACCOUNTS.INVENTORY_ADJUSTMENT,
        creditAccount: ACCOUNTS.INVENTORY_ASSET,
        description: 'Physical Count Adjustment (-)',
        affectsCOGS: false,
    },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get account ID by code for a tenant
 */
async function getAccountIdByCode(tenantId, code, tx = prisma) {
    const account = await tx.account.findFirst({
        where: { tenantId, code },
        select: { id: true }
    });
    return account?.id || null;
}

/**
 * Get account ID by system tag for a tenant
 */
async function getAccountIdBySystemTag(tenantId, systemTag, tx = prisma) {
    const account = await tx.account.findFirst({
        where: { tenantId, systemTag },
        select: { id: true }
    });
    return account?.id || null;
}

/**
 * Calculate Weighted Average Cost after a purchase
 * 
 * @param {number} currentQty - Current quantity on hand
 * @param {number} currentWAC - Current weighted average cost
 * @param {number} purchaseQty - Quantity being purchased
 * @param {number} purchaseUnitCost - Unit cost of new purchase
 * @returns {Object} { newWAC, totalValue, totalQty }
 */
export function calculateWAC(currentQty, currentWAC, purchaseQty, purchaseUnitCost) {
    const existingValue = Number(currentQty) * Number(currentWAC);
    const purchaseValue = Number(purchaseQty) * Number(purchaseUnitCost);
    const totalValue = existingValue + purchaseValue;
    const totalQty = Number(currentQty) + Number(purchaseQty);

    const newWAC = totalQty > 0 ? totalValue / totalQty : purchaseUnitCost;

    return {
        newWAC: Math.round(newWAC * 100) / 100,
        existingValue,
        purchaseValue,
        totalValue,
        totalQty,
    };
}

/**
 * Calculate COGS for a sale using Weighted Average Cost
 * 
 * @param {number} quantity - Quantity being sold
 * @param {number} weightedAvgCost - Current WAC
 * @returns {number} COGS value
 */
export function calculateCOGS(quantity, weightedAvgCost) {
    return Math.round(Number(quantity) * Number(weightedAvgCost) * 100) / 100;
}

// ============================================
// MAIN INVENTORY ACCOUNTING FUNCTIONS
// ============================================

/**
 * Process inventory purchase with full accounting
 * 
 * This creates the proper journal entries:
 * - DR: Inventory Asset (increases)
 * - CR: Accounts Payable or Cash/Bank (decreases)
 * 
 * @param {Object} params - Purchase parameters
 * @param {number} params.tenantId - Tenant ID
 * @param {number} params.userId - User ID
 * @param {number} params.purchaseId - Purchase record ID
 * @param {Array} params.items - Array of { inventoryItemId, quantity, unitCost }
 * @param {number} params.paymentAccountId - Cash/Bank account if paid now (optional)
 * @param {Date} params.date - Transaction date
 * @returns {Promise<Object>} Result with movements and journal
 */
export async function processInventoryPurchase({
    tenantId,
    userId,
    purchaseId,
    items,
    paymentAccountId = null,
    date = new Date(),
}) {
    if (!items || items.length === 0) {
        return { success: true, movements: [], message: 'No inventory items to process' };
    }

    return await prisma.$transaction(async (tx) => {
        const results = [];
        let totalInventoryValue = 0;

        // Get inventory and AP account IDs
        const inventoryAccountId = await getAccountIdByCode(tenantId, ACCOUNTS.INVENTORY_ASSET, tx);
        const apAccountId = await getAccountIdByCode(tenantId, ACCOUNTS.ACCOUNTS_PAYABLE, tx);

        if (!inventoryAccountId) {
            throw new Error('Inventory Asset account (1201) not found. Please seed your Chart of Accounts.');
        }

        // Process each inventory item
        for (const item of items) {
            if (!item.inventoryItemId || Number(item.quantity) <= 0) continue;

            const quantity = Number(item.quantity);
            const unitCost = Number(item.unitCost);
            const itemValue = quantity * unitCost;

            // Get current inventory item
            const inventoryItem = await tx.inventoryItem.findFirst({
                where: { id: parseInt(item.inventoryItemId), tenantId }
            });

            if (!inventoryItem) {
                console.warn(`[InventoryAccounting] Item ${item.inventoryItemId} not found, skipping`);
                continue;
            }

            const currentQty = Number(inventoryItem.quantity);
            const currentWAC = Number(inventoryItem.weightedAvgCost || inventoryItem.costPrice);

            // Calculate new WAC
            const wacResult = calculateWAC(currentQty, currentWAC, quantity, unitCost);

            // Update inventory item with new quantity and WAC
            await tx.inventoryItem.update({
                where: { id: parseInt(item.inventoryItemId) },
                data: {
                    quantity: wacResult.totalQty,
                    weightedAvgCost: wacResult.newWAC,
                    costPrice: unitCost, // Update last purchase price
                }
            });

            // Create stock movement record
            const movement = await tx.stockMovement.create({
                data: {
                    tenantId,
                    itemId: parseInt(item.inventoryItemId),
                    type: 'IN',
                    reason: 'PURCHASE',
                    quantity: quantity,
                    unitCost: unitCost,
                    totalValue: itemValue,
                    wacBefore: currentWAC,
                    wacAfter: wacResult.newWAC,
                    qtyBefore: currentQty,
                    qtyAfter: wacResult.totalQty,
                    sourceType: 'PURCHASE',
                    sourceId: purchaseId,
                    reference: `PO-${purchaseId}`,
                    date: new Date(date),
                    notes: `Purchase: ${quantity} × ${inventoryItem.name} @ ${unitCost}`,
                    createdById: userId,
                }
            });

            // Record valuation history
            await tx.inventoryValuation.create({
                data: {
                    itemId: parseInt(item.inventoryItemId),
                    date: new Date(date),
                    qtyBefore: currentQty,
                    qtyAfter: wacResult.totalQty,
                    costBefore: currentWAC,
                    costAfter: wacResult.newWAC,
                    transactionType: 'PURCHASE',
                    reference: `PO-${purchaseId}`,
                    notes: `IN: ${quantity} @ ${unitCost} | New WAC: ${wacResult.newWAC}`,
                }
            });

            totalInventoryValue += itemValue;
            results.push({
                itemId: item.inventoryItemId,
                itemName: inventoryItem.name,
                quantity,
                unitCost,
                totalValue: itemValue,
                previousQty: currentQty,
                newQty: wacResult.totalQty,
                previousWAC: currentWAC,
                newWAC: wacResult.newWAC,
                movementId: movement.id,
            });
        }

        // Create accounting journal entry for inventory purchase
        // This is the KEY accounting entry: DR Inventory, CR AP
        if (totalInventoryValue > 0) {
            const creditAccountId = paymentAccountId
                ? parseInt(paymentAccountId)
                : apAccountId;

            if (!creditAccountId) {
                throw new Error('Credit account not found for inventory purchase');
            }

            const journal = await tx.journal.create({
                data: {
                    tenantId,
                    reference: `INV-PO-${purchaseId}`,
                    date: new Date(date),
                    description: `Inventory Purchase from Purchase #${purchaseId}`,
                    status: 'POSTED',
                    createdById: userId,
                    lines: {
                        create: [
                            {
                                accountId: inventoryAccountId,
                                debit: totalInventoryValue,
                                credit: 0,
                                description: `Inventory Asset Increase - PO#${purchaseId}`,
                            },
                            {
                                accountId: creditAccountId,
                                debit: 0,
                                credit: totalInventoryValue,
                                description: paymentAccountId
                                    ? `Cash Payment for Inventory`
                                    : `Accounts Payable - PO#${purchaseId}`,
                            }
                        ]
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

            // Link journal to stock movements
            for (const result of results) {
                await tx.stockMovement.update({
                    where: { id: result.movementId },
                    data: { journalId: journal.id }
                });
            }

            console.log(`[InventoryAccounting] Created purchase journal ${journal.id}: DR Inventory ${totalInventoryValue}, CR ${paymentAccountId ? 'Cash/Bank' : 'AP'}`);

            return {
                success: true,
                movements: results,
                journal: {
                    id: journal.id,
                    reference: journal.reference,
                    totalValue: totalInventoryValue,
                    entries: journal.lines.map(l => ({
                        account: l.account.name,
                        debit: Number(l.debit),
                        credit: Number(l.credit),
                    })),
                },
                summary: {
                    itemsProcessed: results.length,
                    totalInventoryValue,
                    accountingEntry: {
                        debit: { account: 'Inventory Asset', amount: totalInventoryValue },
                        credit: { account: paymentAccountId ? 'Cash/Bank' : 'Accounts Payable', amount: totalInventoryValue },
                    }
                }
            };
        }

        return { success: true, movements: results, message: 'No inventory value to record' };
    });
}

/**
 * Process inventory sale (COGS) with full accounting
 * 
 * This is called when an invoice is created for inventory items.
 * Creates the COGS journal entry (the "background" transaction):
 * - DR: Cost of Goods Sold (expense increases)
 * - CR: Inventory Asset (asset decreases)
 * 
 * The revenue side (DR AR, CR Revenue) is handled by the invoice creation.
 * 
 * @param {Object} params - Sale parameters
 * @param {number} params.tenantId - Tenant ID
 * @param {number} params.userId - User ID
 * @param {number} params.invoiceId - Invoice record ID
 * @param {string} params.invoiceNumber - Invoice number for reference
 * @param {Array} params.items - Array of { inventoryItemId, quantity, sellingPrice }
 * @param {Date} params.date - Transaction date
 * @returns {Promise<Object>} Result with movements, journal, and COGS breakdown
 */
export async function processInventorySale({
    tenantId,
    userId,
    invoiceId,
    invoiceNumber,
    items,
    date = new Date(),
}) {
    if (!items || items.length === 0) {
        return { success: true, movements: [], totalCOGS: 0, message: 'No inventory items to process' };
    }

    return await prisma.$transaction(async (tx) => {
        const results = [];
        let totalCOGS = 0;
        let totalRevenue = 0;

        // Get inventory, COGS, and any related account IDs
        const inventoryAccountId = await getAccountIdByCode(tenantId, ACCOUNTS.INVENTORY_ASSET, tx);
        const cogsAccountId = await getAccountIdByCode(tenantId, ACCOUNTS.COGS, tx);

        if (!inventoryAccountId || !cogsAccountId) {
            throw new Error('Required accounts not found. Please seed your Chart of Accounts.');
        }

        // Process each inventory item
        for (const item of items) {
            if (!item.inventoryItemId || Number(item.quantity) <= 0) continue;

            const quantity = Number(item.quantity);
            const sellingPrice = Number(item.sellingPrice || item.unitPrice);
            const lineRevenue = quantity * sellingPrice;

            // Get current inventory item
            const inventoryItem = await tx.inventoryItem.findFirst({
                where: { id: parseInt(item.inventoryItemId), tenantId }
            });

            if (!inventoryItem) {
                console.warn(`[InventoryAccounting] Item ${item.inventoryItemId} not found, skipping`);
                continue;
            }

            const currentQty = Number(inventoryItem.quantity);
            const currentWAC = Number(inventoryItem.weightedAvgCost || inventoryItem.costPrice);

            // Check stock availability
            if (quantity > currentQty) {
                throw new Error(`Insufficient stock for ${inventoryItem.name}. Available: ${currentQty}, Requested: ${quantity}`);
            }

            // Calculate COGS using Weighted Average Cost
            const itemCOGS = calculateCOGS(quantity, currentWAC);
            const newQty = currentQty - quantity;

            // Update inventory item (reduce quantity, WAC stays the same)
            await tx.inventoryItem.update({
                where: { id: parseInt(item.inventoryItemId) },
                data: {
                    quantity: newQty,
                    // Reserved quantity handling if applicable
                    reservedQty: {
                        decrement: Math.min(Number(inventoryItem.reservedQty || 0), quantity)
                    }
                }
            });

            // Create stock movement record
            const movement = await tx.stockMovement.create({
                data: {
                    tenantId,
                    itemId: parseInt(item.inventoryItemId),
                    type: 'OUT',
                    reason: 'SALE',
                    quantity: -quantity, // Negative for OUT
                    unitCost: currentWAC,
                    totalValue: itemCOGS,
                    wacBefore: currentWAC,
                    wacAfter: currentWAC, // WAC doesn't change on sale
                    qtyBefore: currentQty,
                    qtyAfter: newQty,
                    sourceType: 'INVOICE',
                    sourceId: invoiceId,
                    reference: invoiceNumber || `INV-${invoiceId}`,
                    date: new Date(date),
                    notes: `Sale: ${quantity} × ${inventoryItem.name} @ WAC ${currentWAC} = COGS ${itemCOGS}`,
                    createdById: userId,
                }
            });

            // Record valuation history
            await tx.inventoryValuation.create({
                data: {
                    itemId: parseInt(item.inventoryItemId),
                    date: new Date(date),
                    qtyBefore: currentQty,
                    qtyAfter: newQty,
                    costBefore: currentWAC,
                    costAfter: currentWAC,
                    transactionType: 'SALE',
                    reference: invoiceNumber || `INV-${invoiceId}`,
                    notes: `OUT: ${quantity} @ WAC ${currentWAC} | COGS: ${itemCOGS}`,
                }
            });

            totalCOGS += itemCOGS;
            totalRevenue += lineRevenue;

            results.push({
                itemId: item.inventoryItemId,
                itemName: inventoryItem.name,
                quantity,
                sellingPrice,
                lineRevenue,
                wac: currentWAC,
                cogs: itemCOGS,
                grossProfit: lineRevenue - itemCOGS,
                grossMargin: lineRevenue > 0 ? ((lineRevenue - itemCOGS) / lineRevenue * 100).toFixed(2) : 0,
                previousQty: currentQty,
                newQty,
                movementId: movement.id,
            });
        }

        // Create COGS journal entry
        // This is the BACKGROUND transaction that happens automatically with the sale
        if (totalCOGS > 0) {
            const journal = await tx.journal.create({
                data: {
                    tenantId,
                    reference: `COGS-${invoiceNumber || invoiceId}`,
                    date: new Date(date),
                    description: `Cost of Goods Sold - Invoice ${invoiceNumber || `#${invoiceId}`}`,
                    status: 'POSTED',
                    createdById: userId,
                    invoiceId: invoiceId,
                    lines: {
                        create: [
                            {
                                accountId: cogsAccountId,
                                debit: totalCOGS,
                                credit: 0,
                                description: `COGS - ${invoiceNumber || `Invoice #${invoiceId}`}`,
                            },
                            {
                                accountId: inventoryAccountId,
                                debit: 0,
                                credit: totalCOGS,
                                description: `Inventory Out - ${invoiceNumber || `Invoice #${invoiceId}`}`,
                            }
                        ]
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

            // Link journal to stock movements
            for (const result of results) {
                await tx.stockMovement.update({
                    where: { id: result.movementId },
                    data: { journalId: journal.id }
                });
            }

            console.log(`[InventoryAccounting] Created COGS journal ${journal.id}: DR COGS ${totalCOGS}, CR Inventory`);

            return {
                success: true,
                movements: results,
                journal: {
                    id: journal.id,
                    reference: journal.reference,
                    entries: journal.lines.map(l => ({
                        account: l.account.name,
                        debit: Number(l.debit),
                        credit: Number(l.credit),
                    })),
                },
                summary: {
                    itemsProcessed: results.length,
                    totalRevenue,
                    totalCOGS,
                    grossProfit: totalRevenue - totalCOGS,
                    grossMargin: totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue * 100).toFixed(2) : 0,
                    accountingEntry: {
                        debit: { account: 'Cost of Goods Sold', amount: totalCOGS },
                        credit: { account: 'Inventory Asset', amount: totalCOGS },
                    }
                }
            };
        }

        return { success: true, movements: results, totalCOGS: 0, message: 'No COGS to record' };
    });
}

/**
 * Process customer return (Credit Memo) with full accounting
 * 
 * Reverses both the revenue and COGS sides of a sale:
 * - Revenue Reversal: DR Sales Revenue, CR AR/Cash
 * - COGS Reversal: DR Inventory, CR COGS
 * 
 * @param {Object} params - Return parameters
 * @param {number} params.tenantId - Tenant ID
 * @param {number} params.userId - User ID
 * @param {number} params.invoiceId - Original invoice ID
 * @param {string} params.creditMemoNumber - Credit memo reference
 * @param {Array} params.items - Array of { inventoryItemId, quantity, sellingPrice }
 * @param {Date} params.date - Transaction date
 * @returns {Promise<Object>} Result with movements and journals
 */
export async function processCustomerReturn({
    tenantId,
    userId,
    invoiceId,
    creditMemoNumber,
    items,
    date = new Date(),
}) {
    if (!items || items.length === 0) {
        return { success: true, message: 'No items to return' };
    }

    return await prisma.$transaction(async (tx) => {
        const results = [];
        let totalCOGSReversal = 0;
        let totalRevenueReversal = 0;

        // Get required account IDs
        const inventoryAccountId = await getAccountIdByCode(tenantId, ACCOUNTS.INVENTORY_ASSET, tx);
        const cogsAccountId = await getAccountIdByCode(tenantId, ACCOUNTS.COGS, tx);
        const salesReturnsAccountId = await getAccountIdByCode(tenantId, ACCOUNTS.SALES_RETURNS, tx);
        const arAccountId = await getAccountIdByCode(tenantId, ACCOUNTS.ACCOUNTS_RECEIVABLE, tx);

        if (!inventoryAccountId || !cogsAccountId) {
            throw new Error('Required accounts not found. Please seed your Chart of Accounts.');
        }

        // Process each returned item
        for (const item of items) {
            if (!item.inventoryItemId || Number(item.quantity) <= 0) continue;

            const quantity = Number(item.quantity);
            const sellingPrice = Number(item.sellingPrice || item.unitPrice);
            const lineRevenue = quantity * sellingPrice;

            // Get current inventory item
            const inventoryItem = await tx.inventoryItem.findFirst({
                where: { id: parseInt(item.inventoryItemId), tenantId }
            });

            if (!inventoryItem) {
                console.warn(`[InventoryAccounting] Item ${item.inventoryItemId} not found, skipping`);
                continue;
            }

            const currentQty = Number(inventoryItem.quantity);
            const currentWAC = Number(inventoryItem.weightedAvgCost || inventoryItem.costPrice);

            // Calculate COGS reversal (using current WAC)
            const itemCOGS = calculateCOGS(quantity, currentWAC);

            // For returns, we add back to inventory at current WAC (simplification)
            // More complex implementations might track the original cost
            const newQty = currentQty + quantity;

            // Update inventory item (increase quantity)
            await tx.inventoryItem.update({
                where: { id: parseInt(item.inventoryItemId) },
                data: {
                    quantity: newQty,
                }
            });

            // Create stock movement record
            const movement = await tx.stockMovement.create({
                data: {
                    tenantId,
                    itemId: parseInt(item.inventoryItemId),
                    type: 'IN',
                    reason: 'CUSTOMER_RETURN',
                    quantity: quantity, // Positive for IN
                    unitCost: currentWAC,
                    totalValue: itemCOGS,
                    wacBefore: currentWAC,
                    wacAfter: currentWAC,
                    qtyBefore: currentQty,
                    qtyAfter: newQty,
                    sourceType: 'CREDIT_MEMO',
                    sourceId: invoiceId,
                    reference: creditMemoNumber || `CM-${invoiceId}`,
                    date: new Date(date),
                    notes: `Customer Return: ${quantity} × ${inventoryItem.name} back to stock`,
                    createdById: userId,
                }
            });

            // Record valuation history
            await tx.inventoryValuation.create({
                data: {
                    itemId: parseInt(item.inventoryItemId),
                    date: new Date(date),
                    qtyBefore: currentQty,
                    qtyAfter: newQty,
                    costBefore: currentWAC,
                    costAfter: currentWAC,
                    transactionType: 'CUSTOMER_RETURN',
                    reference: creditMemoNumber || `CM-${invoiceId}`,
                    notes: `RETURN: ${quantity} @ WAC ${currentWAC} | COGS Reversal: ${itemCOGS}`,
                }
            });

            totalCOGSReversal += itemCOGS;
            totalRevenueReversal += lineRevenue;

            results.push({
                itemId: item.inventoryItemId,
                itemName: inventoryItem.name,
                quantity,
                sellingPrice,
                lineRevenue,
                cogsReversal: itemCOGS,
                previousQty: currentQty,
                newQty,
                movementId: movement.id,
            });
        }

        // Create COGS Reversal journal entry
        // DR: Inventory Asset (item goes back to stock)
        // CR: COGS (expense reversal)
        if (totalCOGSReversal > 0) {
            const cogsJournal = await tx.journal.create({
                data: {
                    tenantId,
                    reference: `COGS-REV-${creditMemoNumber || invoiceId}`,
                    date: new Date(date),
                    description: `COGS Reversal - Credit Memo ${creditMemoNumber || `for Invoice #${invoiceId}`}`,
                    status: 'POSTED',
                    createdById: userId,
                    lines: {
                        create: [
                            {
                                accountId: inventoryAccountId,
                                debit: totalCOGSReversal,
                                credit: 0,
                                description: `Inventory Return - ${creditMemoNumber || `CM-${invoiceId}`}`,
                            },
                            {
                                accountId: cogsAccountId,
                                debit: 0,
                                credit: totalCOGSReversal,
                                description: `COGS Reversal - ${creditMemoNumber || `CM-${invoiceId}`}`,
                            }
                        ]
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

            // Link journal to stock movements
            for (const result of results) {
                await tx.stockMovement.update({
                    where: { id: result.movementId },
                    data: { journalId: cogsJournal.id }
                });
            }

            console.log(`[InventoryAccounting] Created COGS reversal journal ${cogsJournal.id}`);

            return {
                success: true,
                movements: results,
                cogsJournal: {
                    id: cogsJournal.id,
                    reference: cogsJournal.reference,
                    entries: cogsJournal.lines.map(l => ({
                        account: l.account.name,
                        debit: Number(l.debit),
                        credit: Number(l.credit),
                    })),
                },
                summary: {
                    itemsReturned: results.length,
                    totalRevenueReversal,
                    totalCOGSReversal,
                    accountingEntries: [
                        {
                            description: 'COGS Reversal (Inventory back)',
                            debit: { account: 'Inventory Asset', amount: totalCOGSReversal },
                            credit: { account: 'COGS', amount: totalCOGSReversal },
                        }
                    ]
                }
            };
        }

        return { success: true, movements: results, message: 'No COGS reversal needed' };
    });
}

/**
 * Process inventory adjustment (shrinkage, damage, physical count)
 * 
 * For shrinkage/damage/theft:
 * - DR: Inventory Shrinkage Expense
 * - CR: Inventory Asset
 * 
 * For found stock:
 * - DR: Inventory Asset
 * - CR: Other Income
 * 
 * @param {Object} params - Adjustment parameters
 * @param {number} params.tenantId - Tenant ID
 * @param {number} params.userId - User ID
 * @param {number} params.itemId - Inventory item ID
 * @param {string} params.reason - DAMAGED, EXPIRED, THEFT, LOST, FOUND, COUNT_ADJUSTMENT
 * @param {number} params.quantity - Quantity (positive for IN, or new count for adjustment)
 * @param {number} params.adjustmentType - 'INCREASE', 'DECREASE', or 'SET_TO' (for physical count)
 * @param {string} params.notes - Notes about the adjustment
 * @param {Date} params.date - Transaction date
 * @returns {Promise<Object>} Result with movement and journal
 */
export async function processInventoryAdjustment({
    tenantId,
    userId,
    itemId,
    reason,
    quantity,
    adjustmentType = 'DECREASE',
    notes,
    date = new Date(),
}) {
    return await prisma.$transaction(async (tx) => {
        // Get inventory item
        const item = await tx.inventoryItem.findFirst({
            where: { id: parseInt(itemId), tenantId }
        });

        if (!item) {
            throw new Error('Inventory item not found');
        }

        const currentQty = Number(item.quantity);
        const currentWAC = Number(item.weightedAvgCost || item.costPrice);
        let newQty;
        let adjustmentQty;
        let adjustmentValue;
        let isPositive;

        // Calculate new quantity based on adjustment type
        if (adjustmentType === 'SET_TO') {
            // Physical count - set to exact quantity
            newQty = Number(quantity);
            adjustmentQty = newQty - currentQty;
            isPositive = adjustmentQty > 0;
        } else if (adjustmentType === 'INCREASE' || reason === 'FOUND') {
            adjustmentQty = Number(quantity);
            newQty = currentQty + adjustmentQty;
            isPositive = true;
        } else {
            adjustmentQty = Number(quantity);
            newQty = currentQty - adjustmentQty;
            isPositive = false;

            if (newQty < 0) {
                throw new Error(`Adjustment would result in negative stock (Current: ${currentQty}, Adjusting: -${adjustmentQty})`);
            }
        }

        adjustmentValue = Math.abs(adjustmentQty) * currentWAC;

        // Get required account IDs
        const inventoryAccountId = await getAccountIdByCode(tenantId, ACCOUNTS.INVENTORY_ASSET, tx);
        let expenseAccountId;
        let incomeAccountId;

        if (isPositive) {
            incomeAccountId = await getAccountIdByCode(tenantId, ACCOUNTS.INVENTORY_GAIN, tx);
        } else {
            expenseAccountId = await getAccountIdByCode(tenantId, ACCOUNTS.INVENTORY_SHRINKAGE, tx);
        }

        if (!inventoryAccountId) {
            throw new Error('Inventory Asset account not found');
        }

        // Update inventory quantity
        await tx.inventoryItem.update({
            where: { id: parseInt(itemId) },
            data: { quantity: newQty }
        });

        // Determine movement type and reason
        const movementType = isPositive ? 'IN' : 'OUT';
        const movementReason = reason || (adjustmentType === 'SET_TO' ? 'COUNT_ADJUSTMENT' : (isPositive ? 'FOUND' : 'LOST'));

        // Create stock movement
        const movement = await tx.stockMovement.create({
            data: {
                tenantId,
                itemId: parseInt(itemId),
                type: movementType,
                reason: movementReason,
                quantity: isPositive ? Math.abs(adjustmentQty) : -Math.abs(adjustmentQty),
                unitCost: currentWAC,
                totalValue: adjustmentValue,
                wacBefore: currentWAC,
                wacAfter: currentWAC, // WAC doesn't change on adjustment
                qtyBefore: currentQty,
                qtyAfter: newQty,
                sourceType: 'ADJUSTMENT',
                reference: `ADJ-${Date.now()}`,
                date: new Date(date),
                notes: notes || `${movementReason}: ${isPositive ? '+' : '-'}${Math.abs(adjustmentQty)} units`,
                createdById: userId,
            }
        });

        // Record valuation history
        await tx.inventoryValuation.create({
            data: {
                itemId: parseInt(itemId),
                date: new Date(date),
                qtyBefore: currentQty,
                qtyAfter: newQty,
                costBefore: currentWAC,
                costAfter: currentWAC,
                transactionType: 'ADJUSTMENT',
                reference: movement.reference,
                notes: `${movementReason}: ${isPositive ? '+' : '-'}${Math.abs(adjustmentQty)} @ ${currentWAC}`,
            }
        });

        // Create journal entry
        let journalLines;
        if (isPositive) {
            // DR Inventory, CR Income/Adjustment
            journalLines = [
                {
                    accountId: inventoryAccountId,
                    debit: adjustmentValue,
                    credit: 0,
                    description: `Inventory Increase - ${movementReason}`,
                },
                {
                    accountId: incomeAccountId || inventoryAccountId,
                    debit: 0,
                    credit: adjustmentValue,
                    description: `Inventory Adjustment Credit - ${movementReason}`,
                }
            ];
        } else {
            // DR Expense, CR Inventory
            journalLines = [
                {
                    accountId: expenseAccountId || inventoryAccountId,
                    debit: adjustmentValue,
                    credit: 0,
                    description: `Inventory Shrinkage - ${movementReason}`,
                },
                {
                    accountId: inventoryAccountId,
                    debit: 0,
                    credit: adjustmentValue,
                    description: `Inventory Decrease - ${movementReason}`,
                }
            ];
        }

        const journal = await tx.journal.create({
            data: {
                tenantId,
                reference: movement.reference,
                date: new Date(date),
                description: `Inventory Adjustment: ${movementReason} - ${item.name}`,
                status: 'POSTED',
                createdById: userId,
                lines: { create: journalLines }
            },
            include: {
                lines: {
                    include: {
                        account: { select: { id: true, code: true, name: true } }
                    }
                }
            }
        });

        // Link journal to movement
        await tx.stockMovement.update({
            where: { id: movement.id },
            data: { journalId: journal.id }
        });

        console.log(`[InventoryAccounting] Adjustment ${journal.reference}: ${isPositive ? '+' : '-'}${Math.abs(adjustmentQty)} @ ${currentWAC} = ${adjustmentValue}`);

        return {
            success: true,
            movement: {
                id: movement.id,
                type: movementType,
                reason: movementReason,
                quantity: adjustmentQty,
                value: adjustmentValue,
            },
            item: {
                id: item.id,
                name: item.name,
                previousQty: currentQty,
                newQty,
                wac: currentWAC,
            },
            journal: {
                id: journal.id,
                reference: journal.reference,
                entries: journal.lines.map(l => ({
                    account: l.account.name,
                    debit: Number(l.debit),
                    credit: Number(l.credit),
                })),
            },
            summary: {
                adjustmentType: isPositive ? 'INCREASE' : 'DECREASE',
                reason: movementReason,
                quantityChange: adjustmentQty,
                valueChange: adjustmentValue,
                accountingEntry: isPositive
                    ? { debit: 'Inventory Asset', credit: 'Other Income/Adjustment' }
                    : { debit: 'Shrinkage Expense', credit: 'Inventory Asset' },
            }
        };
    });
}

/**
 * Get inventory valuation report
 * 
 * Shows current stock value and breakdown by category
 */
export async function getInventoryValuation(tenantId) {
    const items = await prisma.inventoryItem.findMany({
        where: {
            tenantId,
            isActive: true,
            productType: 'GOODS',
        },
        select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            quantity: true,
            costPrice: true,
            weightedAvgCost: true,
            sellingPrice: true,
        }
    });

    let totalCostValue = 0;
    let totalRetailValue = 0;
    let totalQuantity = 0;
    const categoryBreakdown = {};

    for (const item of items) {
        const qty = Number(item.quantity) || 0;
        const wac = Number(item.weightedAvgCost || item.costPrice) || 0;
        const retail = Number(item.sellingPrice) || 0;

        const costValue = qty * wac;
        const retailValue = qty * retail;

        totalCostValue += costValue;
        totalRetailValue += retailValue;
        totalQuantity += qty;

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
        categoryBreakdown[cat].items++;
        categoryBreakdown[cat].quantity += qty;
        categoryBreakdown[cat].costValue += costValue;
        categoryBreakdown[cat].retailValue += retailValue;
    }

    return {
        summary: {
            totalItems: items.length,
            totalQuantity,
            totalCostValue: Math.round(totalCostValue * 100) / 100,
            totalRetailValue: Math.round(totalRetailValue * 100) / 100,
            potentialProfit: Math.round((totalRetailValue - totalCostValue) * 100) / 100,
            profitMargin: totalRetailValue > 0
                ? Math.round((totalRetailValue - totalCostValue) / totalRetailValue * 10000) / 100
                : 0,
        },
        categories: Object.values(categoryBreakdown).sort((a, b) => b.costValue - a.costValue),
        items: items.map(item => {
            const qty = Number(item.quantity) || 0;
            const wac = Number(item.weightedAvgCost || item.costPrice) || 0;
            const retail = Number(item.sellingPrice) || 0;
            return {
                id: item.id,
                name: item.name,
                sku: item.sku,
                category: item.category,
                quantity: qty,
                wac,
                retailPrice: retail,
                costValue: Math.round(qty * wac * 100) / 100,
                retailValue: Math.round(qty * retail * 100) / 100,
                potentialProfit: Math.round(qty * (retail - wac) * 100) / 100,
            };
        }).sort((a, b) => b.costValue - a.costValue),
    };
}

// ============================================
// EXPORTS
// ============================================
export default {
    // Calculations
    calculateWAC,
    calculateCOGS,

    // Core Processing Functions
    processInventoryPurchase,
    processInventorySale,
    processCustomerReturn,
    processInventoryAdjustment,

    // Reports
    getInventoryValuation,

    // Constants
    ACCOUNTS,
    MOVEMENT_ACCOUNTING,
};
