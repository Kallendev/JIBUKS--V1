import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// Apply JWT verification to all routes
router.use(verifyJWT);

// ============================================
// GET ALL CUSTOMERS
// ============================================
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { active, search, businessType, limit = 50, offset = 0 } = req.query;

        const where = { tenantId };

        // Filter by active status
        if (active !== undefined) {
            where.isActive = active === 'true';
        }

        // Search functionality
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { taxNumber: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Filter by business type
        if (businessType) {
            where.businessType = businessType;
        }

        const take = parseInt(limit) || 50;
        const skip = parseInt(offset) || 0;

        const customers = await prisma.customer.findMany({
            where,
            orderBy: [
                { lastSaleDate: 'desc' },
                { name: 'asc' }
            ],
            take,
            skip,
            include: {
                invoices: {
                    select: {
                        id: true,
                        total: true,
                        amountPaid: true,
                        status: true,
                        invoiceDate: true,
                        dueDate: true, // Make sure this is selected
                    },
                },
            },
        });

        // Calculate customer statistics and aging
        const customersWithStats = customers.map(customer => {
            const invoices = customer.invoices || [];
            const currentDate = new Date();

            // Calculate total balance
            const balance = invoices.reduce((sum, inv) =>
                sum + (Number(inv.total || 0) - Number(inv.amountPaid || 0)), 0
            );

            // Calculate aging buckets
            const aging = {
                current: 0,    // 0-30 days
                thirtyDays: 0, // 31-60 days  
                sixtyDays: 0,  // 61-90 days
                ninetyDays: 0, // 90+ days
            };

            invoices.forEach(inv => {
                if (!inv.dueDate) return;

                const dueDate = new Date(inv.dueDate);
                const daysOverdue = Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24));
                const outstandingAmount = Number(inv.total || 0) - Number(inv.amountPaid || 0);

                if (outstandingAmount > 0) {
                    if (daysOverdue <= 30) {
                        aging.current += outstandingAmount;
                    } else if (daysOverdue <= 60) {
                        aging.thirtyDays += outstandingAmount;
                    } else if (daysOverdue <= 90) {
                        aging.sixtyDays += outstandingAmount;
                    } else {
                        aging.ninetyDays += outstandingAmount;
                    }
                }
            });

            // Calculate stats
            const totalInvoices = invoices.length;
            const paidInvoices = invoices.filter(inv => inv.status === 'PAID').length;
            const overdue = invoices.filter(inv => {
                if (!inv.dueDate) return false;
                const dueDate = new Date(inv.dueDate);
                return dueDate < currentDate && inv.status !== 'PAID';
            }).length;

            return {
                ...customer,
                balance,
                aging,
                stats: {
                    totalInvoices,
                    paidInvoices,
                    overdueInvoices: overdue,
                    avgDaysToPayment: null,
                },
                invoices: undefined, // Remove detailed invoices from list response
            };
        });

        // Get total count for pagination
        const totalCount = await prisma.customer.count({ where });

        res.json({
            customers: customersWithStats,
            pagination: {
                total: totalCount,
                limit: take,
                offset: skip,
                hasMore: skip + take < totalCount,
            }
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch customers' });
    }
});

// ============================================
// GET SINGLE CUSTOMER WITH INVOICE HISTORY
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const customerId = parseInt(req.params.id);

        const customer = await prisma.customer.findFirst({
            where: { id: customerId, tenantId },
            include: {
                invoices: {
                    orderBy: { invoiceDate: 'desc' },
                    include: {
                        items: true,
                        payments: true,
                    },
                },
            },
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Calculate balance
        const balance = customer.invoices.reduce((sum, inv) =>
            sum + (Number(inv.total) - Number(inv.amountPaid)), 0
        );

        res.json({ ...customer, balance });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// ============================================
// CREATE NEW CUSTOMER
// ============================================
router.post('/', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const {
            name,
            companyName,
            email,
            phone,
            alternatePhone,
            address,
            city,
            state,
            zipCode,
            country,
            paymentTerms,
            creditLimit,
            taxNumber,
            taxId,
            website,
            contactPerson,
            position,
            businessType,
            industry,
            notes,
        } = req.body;

        // Validation
        if (!name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }

        // Check for duplicate email if provided
        if (email) {
            const existingCustomer = await prisma.customer.findFirst({
                where: { tenantId, email, isActive: true },
            });
            if (existingCustomer) {
                return res.status(400).json({ error: 'A customer with this email already exists' });
            }
        }

        const customer = await prisma.customer.create({
            data: {
                tenantId,
                name,
                companyName,
                email,
                phone,
                alternatePhone,
                address,
                city,
                state,
                zipCode,
                country: country || 'Kenya',
                paymentTerms: paymentTerms || 'Net 30',
                creditLimit: creditLimit ? parseFloat(creditLimit) : null,
                taxNumber,
                taxId,
                website,
                contactPerson,
                position,
                businessType,
                industry,
                notes,
                balance: 0,
                totalSales: 0,
                isActive: true,
            },
        });

        res.status(201).json(customer);
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// ============================================
// UPDATE CUSTOMER
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const customerId = parseInt(req.params.id);
        const {
            name,
            companyName,
            email,
            phone,
            alternatePhone,
            address,
            city,
            state,
            zipCode,
            country,
            paymentTerms,
            creditLimit,
            taxNumber,
            taxId,
            website,
            contactPerson,
            position,
            businessType,
            industry,
            notes,
            isActive,
        } = req.body;

        const customer = await prisma.customer.findFirst({
            where: { id: customerId, tenantId },
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const updated = await prisma.customer.update({
            where: { id: customerId },
            data: {
                name,
                companyName,
                email,
                phone,
                alternatePhone,
                address,
                city,
                state,
                zipCode,
                country,
                paymentTerms,
                creditLimit: creditLimit ? parseFloat(creditLimit) : null,
                taxNumber,
                taxId,
                website,
                contactPerson,
                position,
                businessType,
                industry,
                notes,
                isActive,
            },
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// ============================================
// DELETE CUSTOMER
// ============================================
router.delete('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const customerId = parseInt(req.params.id);

        const customer = await prisma.customer.findFirst({
            where: { id: customerId, tenantId },
            include: { invoices: true },
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Don't allow deletion if customer has invoices
        if (customer.invoices.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete customer with existing invoices. Deactivate instead.',
            });
        }

        await prisma.customer.delete({
            where: { id: customerId },
        });

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

// ============================================
// GET CUSTOMER STATEMENT
// ============================================
router.get('/:id/statement', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const customerId = parseInt(req.params.id);
        const { startDate, endDate } = req.query;

        const customer = await prisma.customer.findFirst({
            where: { id: customerId, tenantId },
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const where = {
            customerId,
            tenantId,
        };

        if (startDate && endDate) {
            where.invoiceDate = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const invoices = await prisma.invoice.findMany({
            where,
            orderBy: { invoiceDate: 'asc' },
            include: {
                payments: {
                    orderBy: { paymentDate: 'asc' },
                },
            },
        });

        // Build statement with running balance
        let runningBalance = 0;
        const transactions = [];

        for (const invoice of invoices) {
            // Add invoice
            runningBalance += Number(invoice.total);
            transactions.push({
                date: invoice.invoiceDate,
                type: 'Invoice',
                reference: invoice.invoiceNumber,
                debit: Number(invoice.total),
                credit: 0,
                balance: runningBalance,
            });

            // Add payments
            for (const payment of invoice.payments) {
                runningBalance -= Number(payment.amount);
                transactions.push({
                    date: payment.paymentDate,
                    type: 'Payment',
                    reference: payment.paymentMethod,
                    debit: 0,
                    credit: Number(payment.amount),
                    balance: runningBalance,
                });
            }
        }

        res.json({
            customer,
            transactions,
            currentBalance: runningBalance,
        });
    } catch (error) {
        console.error('Error generating customer statement:', error);
        res.status(500).json({ error: 'Failed to generate statement' });
    }
});

// ============================================
// GET CUSTOMER BALANCE WITH AGING
// ============================================
router.get('/:id/balance', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const customerId = parseInt(req.params.id);

        const customer = await prisma.customer.findFirst({
            where: { id: customerId, tenantId },
            include: {
                invoices: {
                    where: { status: { not: 'CANCELLED' } },
                    select: {
                        id: true,
                        total: true,
                        amountPaid: true,
                        invoiceDate: true,
                        dueDate: true,
                        status: true,
                    },
                },
            },
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const currentDate = new Date();

        // Calculate aging buckets
        const aging = {
            current: 0,    // 0-30 days
            thirtyDays: 0, // 31-60 days  
            sixtyDays: 0,  // 61-90 days
            ninetyDays: 0, // 90+ days
        };

        let totalBalance = 0;

        customer.invoices.forEach(inv => {
            const outstandingAmount = Number(inv.total) - Number(inv.amountPaid);
            if (outstandingAmount > 0) {
                totalBalance += outstandingAmount;

                const dueDate = new Date(inv.dueDate);
                const daysOverdue = Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24));

                if (daysOverdue <= 30) {
                    aging.current += outstandingAmount;
                } else if (daysOverdue <= 60) {
                    aging.thirtyDays += outstandingAmount;
                } else if (daysOverdue <= 90) {
                    aging.sixtyDays += outstandingAmount;
                } else {
                    aging.ninetyDays += outstandingAmount;
                }
            }
        });

        res.json({
            customerId,
            customerName: customer.name,
            totalBalance,
            aging,
            creditLimit: customer.creditLimit,
            availableCredit: customer.creditLimit ? Number(customer.creditLimit) - totalBalance : null,
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error fetching customer balance:', error);
        res.status(500).json({ error: 'Failed to fetch customer balance' });
    }
});

// ============================================
// GET CUSTOMER TRANSACTION HISTORY
// ============================================
router.get('/:id/transactions', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const customerId = parseInt(req.params.id);
        const { limit = 50, offset = 0, type } = req.query;

        const customer = await prisma.customer.findFirst({
            where: { id: customerId, tenantId },
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Get invoices and payments
        const invoices = await prisma.invoice.findMany({
            where: {
                customerId,
                tenantId,
                ...(type === 'invoices' ? {} : {})
            },
            orderBy: { invoiceDate: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
            include: {
                payments: {
                    orderBy: { paymentDate: 'desc' },
                },
            },
        });

        // Format transactions
        const transactions = [];

        invoices.forEach(invoice => {
            // Add invoice transaction
            if (!type || type === 'invoices') {
                transactions.push({
                    id: `invoice-${invoice.id}`,
                    date: invoice.invoiceDate,
                    type: 'Invoice',
                    description: `Invoice #${invoice.invoiceNumber || invoice.id}`,
                    amount: Number(invoice.total),
                    balance: null, // Will be calculated client-side if needed
                    status: invoice.status,
                    reference: invoice.invoiceNumber,
                });
            }

            // Add payment transactions
            if (!type || type === 'payments') {
                invoice.payments.forEach(payment => {
                    transactions.push({
                        id: `payment-${payment.id}`,
                        date: payment.paymentDate,
                        type: 'Payment',
                        description: `Payment - ${payment.paymentMethod}`,
                        amount: -Number(payment.amount),
                        balance: null,
                        status: 'PAID',
                        reference: payment.paymentMethod,
                        invoiceId: invoice.id,
                    });
                });
            }
        });

        // Sort by date descending
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate running balance
        let runningBalance = customer.balance;
        transactions.reverse().forEach(transaction => {
            runningBalance -= transaction.amount;
            transaction.balance = runningBalance;
        });
        transactions.reverse();

        const totalCount = await prisma.invoice.count({
            where: { customerId, tenantId }
        });

        res.json({
            customer: {
                id: customer.id,
                name: customer.name,
                companyName: customer.companyName,
                currentBalance: customer.balance,
            },
            transactions,
            pagination: {
                total: totalCount,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < totalCount,
            }
        });
    } catch (error) {
        console.error('Error fetching customer transactions:', error);
        res.status(500).json({ error: 'Failed to fetch customer transactions' });
    }
});

// ============================================
// GET CUSTOMER ANALYTICS
// ============================================
router.get('/:id/analytics', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const customerId = parseInt(req.params.id);
        const { period = '12months' } = req.query;

        const customer = await prisma.customer.findFirst({
            where: { id: customerId, tenantId },
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Calculate date range based on period
        const endDate = new Date();
        let startDate = new Date();

        switch (period) {
            case '3months':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case '6months':
                startDate.setMonth(startDate.getMonth() - 6);
                break;
            case '12months':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case 'ytd':
                startDate = new Date(startDate.getFullYear(), 0, 1);
                break;
            default:
                startDate.setFullYear(startDate.getFullYear() - 1);
        }

        const invoices = await prisma.invoice.findMany({
            where: {
                customerId,
                tenantId,
                invoiceDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                payments: true,
            },
        });

        // Calculate analytics
        const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
        const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);
        const totalInvoices = invoices.length;
        const paidInvoices = invoices.filter(inv => inv.status === 'PAID').length;

        // Monthly breakdown
        const monthlyData = {};
        invoices.forEach(invoice => {
            const month = invoice.invoiceDate.toISOString().substring(0, 7); // YYYY-MM format
            if (!monthlyData[month]) {
                monthlyData[month] = { sales: 0, payments: 0, invoices: 0 };
            }
            monthlyData[month].sales += Number(invoice.total);
            monthlyData[month].payments += Number(invoice.amountPaid);
            monthlyData[month].invoices += 1;
        });

        // Payment performance
        const overdueInvoices = invoices.filter(inv => {
            const dueDate = new Date(inv.dueDate);
            return dueDate < new Date() && inv.status !== 'PAID';
        }).length;

        res.json({
            customerId,
            period,
            summary: {
                totalSales,
                totalPaid,
                outstanding: totalSales - totalPaid,
                totalInvoices,
                paidInvoices,
                overdueInvoices,
                paymentRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
                avgInvoiceValue: totalInvoices > 0 ? totalSales / totalInvoices : 0,
            },
            monthlyData: Object.entries(monthlyData)
                .map(([month, data]) => ({ month, ...data }))
                .sort((a, b) => a.month.localeCompare(b.month)),
            creditUtilization: customer.creditLimit ?
                Math.min((customer.balance / Number(customer.creditLimit)) * 100, 100) : null,
        });
    } catch (error) {
        console.error('Error fetching customer analytics:', error);
        res.status(500).json({ error: 'Failed to fetch customer analytics' });
    }
});

export default router;
