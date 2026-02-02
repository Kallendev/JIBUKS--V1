import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyJWT } from '../middleware/auth.js';
import {
    getAccountsReceivableAccountId,
    getDefaultRevenueAccountId,
    getDefaultPaymentAccountId,
} from '../services/accountingService.js';

const router = express.Router();

// Apply JWT verification to all routes
router.use(verifyJWT);

// ============================================
// GET ALL INVOICES
// ============================================
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { status, customerId } = req.query;

        const where = { tenantId };
        if (status) where.status = status;
        if (customerId) where.customerId = parseInt(customerId);

        const invoices = await prisma.invoice.findMany({
            where,
            orderBy: { invoiceDate: 'desc' },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                items: true,
            },
        });

        // Calculate balance for each invoice
        const invoicesWithBalance = invoices.map(inv => ({
            ...inv,
            balance: Number(inv.total) - Number(inv.amountPaid),
        }));

        res.json(invoicesWithBalance);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

// ============================================
// GET SINGLE INVOICE
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const invoiceId = parseInt(req.params.id);

        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, tenantId },
            include: {
                customer: true,
                items: {
                    include: {
                        account: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                        inventoryItem: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                            },
                        },
                    },
                },
                payments: {
                    orderBy: { paymentDate: 'desc' },
                },
            },
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const balance = Number(invoice.total) - Number(invoice.amountPaid);
        res.json({ ...invoice, balance });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
});

// ============================================
// CREATE NEW INVOICE
// ============================================
router.post('/', async (req, res) => {
    try {
        const { tenantId, userId } = req.user;
        const {
            customerId,
            invoiceNumber,
            invoiceDate,
            dueDate,
            items,
            tax,
            discount,
            notes,
            status,
        } = req.body;

        // Validation
        if (!customerId) {
            return res.status(400).json({ error: 'Customer is required' });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'At least one item is required' });
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => {
            return sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice));
        }, 0);

        const taxAmount = parseFloat(tax) || 0;
        const discountAmount = parseFloat(discount) || 0;
        const total = subtotal + taxAmount - discountAmount;

        // Resolve CoA accounts for double-entry posting
        const arAccountId = await getAccountsReceivableAccountId(tenantId);
        const defaultRevenueAccountId = await getDefaultRevenueAccountId(tenantId);
        if (!arAccountId) {
            return res.status(500).json({
                error: 'Accounts Receivable (1250) not found. Please seed Chart of Accounts for this tenant.',
            });
        }

        // Use Prisma transaction for data integrity
        const result = await prisma.$transaction(async (tx) => {
            // Create invoice
            const invoice = await tx.invoice.create({
                data: {
                    tenantId,
                    customerId: parseInt(customerId),
                    invoiceNumber,
                    invoiceDate: new Date(invoiceDate),
                    dueDate: dueDate ? new Date(dueDate) : null,
                    subtotal,
                    tax: taxAmount,
                    discount: discountAmount,
                    total,
                    amountPaid: 0,
                    status: status || 'UNPAID',
                    notes,
                    items: {
                        create: items.map(item => ({
                            description: item.description,
                            quantity: parseFloat(item.quantity),
                            unitPrice: parseFloat(item.unitPrice),
                            amount: parseFloat(item.quantity) * parseFloat(item.unitPrice),
                            accountId: item.accountId ? parseInt(item.accountId) : defaultRevenueAccountId,
                            inventoryItemId: item.inventoryItemId ? parseInt(item.inventoryItemId) : null,
                        })),
                    },
                },
                include: {
                    items: true,
                    customer: true,
                },
            });

            // Build journal lines (double-entry: DR AR, CR Revenue)
            const journalLines = [];
            // Debit: Accounts Receivable
            journalLines.push({
                accountId: arAccountId,
                debit: total,
                credit: 0,
                description: `Invoice ${invoiceNumber} - ${invoice.customer.name}`,
            });
            // Credit: Sales Revenue (per line item or single line)
            for (const item of items) {
                const revenueAccountId = item.accountId ? parseInt(item.accountId) : defaultRevenueAccountId;
                const lineAmount = parseFloat(item.quantity) * parseFloat(item.unitPrice);
                if (revenueAccountId && lineAmount > 0) {
                    journalLines.push({
                        accountId: revenueAccountId,
                        debit: 0,
                        credit: lineAmount,
                        description: `Invoice ${invoiceNumber} - ${item.description}`,
                    });
                }
            }
            // If no revenue lines (e.g. no accountId and no default), credit default revenue for full total
            const totalCredits = journalLines.reduce((s, l) => s + Number(l.credit || 0), 0);
            if (totalCredits < total && defaultRevenueAccountId) {
                journalLines.push({
                    accountId: defaultRevenueAccountId,
                    debit: 0,
                    credit: total - totalCredits,
                    description: `Invoice ${invoiceNumber} - Sales`,
                });
            }

            // Create journal with lines (correct relation name)
            await tx.journal.create({
                data: {
                    tenantId,
                    date: new Date(invoiceDate),
                    description: `Invoice ${invoiceNumber} - ${invoice.customer.name}`,
                    reference: invoiceNumber,
                    status: 'POSTED',
                    invoiceId: invoice.id,
                    lines: {
                        create: journalLines.map(l => ({
                            accountId: l.accountId,
                            debit: l.debit,
                            credit: l.credit,
                            description: l.description,
                        })),
                    },
                },
            });

            // Update customer balance
            await tx.customer.update({
                where: { id: parseInt(customerId) },
                data: {
                    balance: {
                        increment: total,
                    },
                },
            });

            // Update inventory if items are inventory items
            for (const item of items) {
                if (item.inventoryItemId) {
                    const inventoryItem = await tx.inventoryItem.findUnique({
                        where: { id: parseInt(item.inventoryItemId) },
                    });

                    if (inventoryItem) {
                        await tx.inventoryItem.update({
                            where: { id: parseInt(item.inventoryItemId) },
                            data: {
                                quantity: {
                                    decrement: parseFloat(item.quantity),
                                },
                            },
                        });

                        await tx.stockMovement.create({
                            data: {
                                tenantId,
                                inventoryItemId: parseInt(item.inventoryItemId),
                                type: 'OUT',
                                quantity: parseFloat(item.quantity),
                                unitCost: inventoryItem.costPrice,
                                totalCost: parseFloat(item.quantity) * inventoryItem.costPrice,
                                date: new Date(invoiceDate),
                                reference: `Invoice ${invoiceNumber}`,
                                notes: `Sold to ${invoice.customer.name}`,
                            },
                        });
                    }
                }
            }

            return invoice;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

// ============================================
// UPDATE INVOICE
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const invoiceId = parseInt(req.params.id);
        const { invoiceNumber, invoiceDate, dueDate, notes, status } = req.body;

        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, tenantId },
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Only allow updates if invoice is DRAFT or UNPAID
        if (invoice.status !== 'DRAFT' && invoice.status !== 'UNPAID') {
            return res.status(400).json({
                error: 'Cannot update invoice that is already paid or cancelled',
            });
        }

        const updated = await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                invoiceNumber,
                invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                notes,
                status,
            },
            include: {
                customer: true,
                items: true,
            },
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({ error: 'Failed to update invoice' });
    }
});

// ============================================
// DELETE INVOICE (DRAFT ONLY)
// ============================================
router.delete('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const invoiceId = parseInt(req.params.id);

        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, tenantId },
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Only allow deletion of DRAFT invoices
        if (invoice.status !== 'DRAFT') {
            return res.status(400).json({
                error: 'Can only delete draft invoices. Cancel instead.',
            });
        }

        await prisma.invoice.delete({
            where: { id: invoiceId },
        });

        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ error: 'Failed to delete invoice' });
    }
});

// ============================================
// RECORD PAYMENT
// ============================================
router.post('/:id/payment', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const invoiceId = parseInt(req.params.id);
        const { amount, paymentDate, paymentMethod, bankAccountId, reference, notes } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid payment amount is required' });
        }

        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, tenantId },
            include: { customer: true },
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const balance = Number(invoice.total) - Number(invoice.amountPaid);
        const paymentAmount = parseFloat(amount);

        if (paymentAmount > balance) {
            return res.status(400).json({
                error: `Payment amount cannot exceed balance of ${balance}`,
            });
        }

        // Resolve CoA accounts for double-entry posting
        const arAccountId = await getAccountsReceivableAccountId(tenantId);
        let bankAccountIdResolved = bankAccountId ? parseInt(bankAccountId) : null;
        if (!bankAccountIdResolved) {
            bankAccountIdResolved = await getDefaultPaymentAccountId(tenantId);
        }
        if (!arAccountId) {
            return res.status(500).json({
                error: 'Accounts Receivable (1250) not found. Please seed Chart of Accounts for this tenant.',
            });
        }
        if (!bankAccountIdResolved) {
            return res.status(500).json({
                error: 'No payment account (Cash/Bank) found. Please seed Chart of Accounts and ensure at least one payment-eligible account exists.',
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Create payment record
            const payment = await tx.invoicePayment.create({
                data: {
                    invoiceId,
                    amount: paymentAmount,
                    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                    paymentMethod: paymentMethod || 'Cash',
                    bankAccountId: bankAccountIdResolved,
                    reference,
                    notes,
                },
            });

            // Update invoice
            const newAmountPaid = Number(invoice.amountPaid) + paymentAmount;
            const newStatus = newAmountPaid >= Number(invoice.total) ? 'PAID' : 'PARTIAL';

            const updatedInvoice = await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    amountPaid: newAmountPaid,
                    status: newStatus,
                },
                include: {
                    customer: true,
                    items: true,
                    payments: true,
                },
            });

            // Create journal entry (double-entry: DR Bank/Cash, CR AR)
            await tx.journal.create({
                data: {
                    tenantId,
                    date: paymentDate ? new Date(paymentDate) : new Date(),
                    description: `Payment for Invoice ${invoice.invoiceNumber}`,
                    reference: reference || `Payment-${invoice.invoiceNumber}`,
                    status: 'POSTED',
                    invoicePaymentId: payment.id,
                    lines: {
                        create: [
                            {
                                accountId: bankAccountIdResolved,
                                debit: paymentAmount,
                                credit: 0,
                                description: `Payment from ${invoice.customer.name}`,
                            },
                            {
                                accountId: arAccountId,
                                debit: 0,
                                credit: paymentAmount,
                                description: `Payment for Invoice ${invoice.invoiceNumber}`,
                            },
                        ],
                    },
                },
            });

            // Update customer balance
            await tx.customer.update({
                where: { id: invoice.customerId },
                data: {
                    balance: {
                        decrement: paymentAmount,
                    },
                },
            });

            return updatedInvoice;
        });

        res.json(result);
    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({ error: 'Failed to record payment' });
    }
});

// ============================================
// GET UNPAID INVOICES
// ============================================
router.get('/status/unpaid', async (req, res) => {
    try {
        const { tenantId } = req.user;

        const invoices = await prisma.invoice.findMany({
            where: {
                tenantId,
                status: {
                    in: ['UNPAID', 'PARTIAL'],
                },
            },
            orderBy: { dueDate: 'asc' },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        const invoicesWithDetails = invoices.map(inv => {
            const balance = Number(inv.total) - Number(inv.amountPaid);
            const daysOverdue = inv.dueDate
                ? Math.floor((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))
                : 0;

            return {
                ...inv,
                balance,
                daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
                isOverdue: daysOverdue > 0,
            };
        });

        res.json(invoicesWithDetails);
    } catch (error) {
        console.error('Error fetching unpaid invoices:', error);
        res.status(500).json({ error: 'Failed to fetch unpaid invoices' });
    }
});

export default router;
