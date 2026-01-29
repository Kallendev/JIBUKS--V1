/**
 * Accounting Service
 * Core business logic for double-entry bookkeeping
 * 
 * This service handles:
 * - Chart of Accounts (CoA) management
 * - Journal entry creation (double-entry posting)
 * - Account balance calculations
 * - Financial reports (P&L, Trial Balance, Cash Flow)
 */

import { prisma } from '../lib/prisma.js';

// ============================================
// FAMILY CHART OF ACCOUNTS TEMPLATE
// ============================================

/**
 * Enhanced Professional Chart of Accounts
 * Supports business accounting with inventory, fixed assets, VAT, and payroll
 * Following accounting best practices with proper account numbering:
 * - 1000s: Assets
 * - 2000s: Liabilities
 * - 3000s: Equity
 * - 4000s: Income/Revenue
 * - 5000s: Expenses
 */
export const FAMILY_COA_TEMPLATE = [
    // ============================================
    // ASSETS (1000-1999)
    // ============================================

    // ----------------------------------------
    // 1. CURRENT ASSETS - Cash & Banks (1000-1099)
    // Used in: Transfer, Expense, Pay Bill, Income screens
    // ----------------------------------------

    // Cash Accounts (1001-1009)
    { code: '1001', name: 'Cash on Hand (Wallet)', type: 'ASSET', description: 'Physical cash carried daily', isSystem: true, isContra: false, isPaymentEligible: true, subtype: 'cash', systemTag: 'CASH' },
    { code: '1002', name: 'Petty Cash (Home Safe)', type: 'ASSET', description: 'Emergency cash kept at home', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'cash' },

    // Mobile Money - M-PESA Family (1010-1019)
    { code: '1010', name: 'M-PESA (Personal)', type: 'ASSET', description: 'Main wallet for daily spending', isSystem: true, isContra: false, isPaymentEligible: true, subtype: 'mobile_money', systemTag: 'MPESA' },
    { code: '1011', name: 'M-PESA (Business/Till)', type: 'ASSET', description: 'Side-hustle Till number', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'mobile_money' },
    { code: '1012', name: 'M-Shwari (Savings)', type: 'ASSET', description: 'Locked savings on SIM card', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'mobile_money' },
    { code: '1013', name: 'KCB M-PESA', type: 'ASSET', description: 'Loan/Savings account linked to SIM', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'mobile_money' },
    { code: '1014', name: 'Airtel Money', type: 'ASSET', description: 'Alternative mobile wallet', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'mobile_money' },
    { code: '1015', name: 'T-Kash (Telkom)', type: 'ASSET', description: 'Alternative mobile wallet', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'mobile_money' },

    // Commercial Banks - Tier 1 (1020-1029)
    { code: '1020', name: 'Equity Bank', type: 'ASSET', description: 'Tier 1 Bank', isSystem: true, isContra: false, isPaymentEligible: true, subtype: 'bank', systemTag: 'BANK' },
    { code: '1021', name: 'KCB Bank', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank' },
    { code: '1022', name: 'Co-operative Bank', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank' },
    { code: '1023', name: 'NCBA Bank', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank' },
    { code: '1024', name: 'Standard Chartered', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank' },
    { code: '1025', name: 'Absa Bank', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank' },
    { code: '1026', name: 'I&M Bank', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank' },
    { code: '1027', name: 'DTB (Diamond Trust)', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank' },
    { code: '1028', name: 'Stanbic Bank', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank' },

    // Commercial Banks - Tier 2 (1029-1039)
    { code: '1029', name: 'Family Bank', type: 'ASSET', description: 'Tier 2 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank' },
    { code: '1030', name: 'Kingdom Bank', type: 'ASSET', description: 'Tier 2 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank' },
    { code: '1031', name: 'Postbank', type: 'ASSET', description: 'Tier 2 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank' },
    { code: '1032', name: 'Credit Bank', type: 'ASSET', description: 'Tier 2 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank' },

    // Saccos - FOSA (1040-1049)
    { code: '1040', name: 'Stima Sacco (FOSA)', type: 'ASSET', description: 'Withdrawable Sacco Savings', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'sacco' },
    { code: '1041', name: 'Police Sacco (FOSA)', type: 'ASSET', description: 'Withdrawable Sacco Savings', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'sacco' },
    { code: '1042', name: 'Mwalimu National (FOSA)', type: 'ASSET', description: 'Withdrawable Sacco Savings', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'sacco' },
    { code: '1043', name: 'Harambee Sacco (FOSA)', type: 'ASSET', description: 'Withdrawable Sacco Savings', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'sacco' },
    { code: '1044', name: 'Hazina Sacco (FOSA)', type: 'ASSET', description: 'Withdrawable Sacco Savings', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'sacco' },

    // Online Wallets & Crypto (1050-1059)
    { code: '1050', name: 'PayPal', type: 'ASSET', description: 'For online work/freelancing', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'online_wallet' },
    { code: '1051', name: 'Wise (TransferWise)', type: 'ASSET', description: 'For international transfers', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'online_wallet' },
    { code: '1052', name: 'Binance Wallet (USDT)', type: 'ASSET', description: 'For holding stablecoins', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'crypto' },

    // Special Accounts (1060-1099)
    { code: '1060', name: 'Undeposited Funds', type: 'ASSET', description: 'Cash received not yet deposited', isSystem: true, isContra: false, subtype: 'cash' },
    { code: '1070', name: 'Clearing Account', type: 'ASSET', description: 'Temporary clearing account', isSystem: true, isContra: false, subtype: 'other_asset' },

    // ----------------------------------------
    // 2. RECEIVABLES - Money Owed TO Family (1200-1299)
    // Used in: Lending Manager module
    // ----------------------------------------
    { code: '1200', name: 'Loans to Friends/Family', type: 'ASSET', description: 'Money lent to cousins/friends', isSystem: true, isContra: false, subtype: 'receivable' },
    { code: '1210', name: 'Salary Arrears', type: 'ASSET', description: 'Work done but not paid yet', isSystem: false, isContra: false, subtype: 'receivable' },
    { code: '1220', name: 'Rent Security Deposits', type: 'ASSET', description: 'Refundable deposit held by Landlord', isSystem: false, isContra: false, subtype: 'receivable' },
    { code: '1230', name: 'Utility Deposits', type: 'ASSET', description: 'Deposit held by Kenya Power/Water', isSystem: false, isContra: false, subtype: 'receivable' },
    { code: '1240', name: 'Prepaid Expenses', type: 'ASSET', description: 'Services paid for but not used yet', isSystem: false, isContra: false, subtype: 'receivable' },
    { code: '1250', name: 'Accounts Receivable', type: 'ASSET', description: 'Money owed by customers', isSystem: true, isContra: false, subtype: 'ar' },

    // ----------------------------------------
    // 3. FIXED ASSETS - Physical Wealth (1500-1599)
    // Used in: Assets module (Net Worth tracking)
    // ----------------------------------------

    // Vehicles (1510-1519)
    { code: '1510', name: 'Motor Vehicles', type: 'ASSET', description: 'Cars - Depreciable', isSystem: false, isContra: false, subtype: 'fixed_asset' },
    { code: '1511', name: 'Motorbikes / Boda', type: 'ASSET', description: 'Motorcycles - Depreciable', isSystem: false, isContra: false, subtype: 'fixed_asset' },

    // Real Estate (1520-1529)
    { code: '1520', name: 'Land (Freehold)', type: 'ASSET', description: 'Land - Appreciates', isSystem: false, isContra: false, subtype: 'fixed_asset' },
    { code: '1521', name: 'Residential Buildings', type: 'ASSET', description: 'House structure - Depreciable', isSystem: false, isContra: false, subtype: 'fixed_asset' },
    { code: '1522', name: 'Rental Properties', type: 'ASSET', description: 'Apartments owned - Depreciable', isSystem: false, isContra: false, subtype: 'fixed_asset' },
    { code: '1523', name: 'Project / Construction WIP', type: 'ASSET', description: 'House under construction', isSystem: false, isContra: false, subtype: 'fixed_asset' },

    // Household Items (1530-1539)
    { code: '1530', name: 'Furniture & Fittings', type: 'ASSET', description: 'Sofas, Beds, Tables - Depreciable', isSystem: false, isContra: false, subtype: 'fixed_asset' },

    // Electronics (1540-1569)
    { code: '1540', name: 'Computer Equipment', type: 'ASSET', description: 'Laptops, Desktops - Depreciable', isSystem: false, isContra: false, subtype: 'fixed_asset' },
    { code: '1550', name: 'Mobile Phones & Tablets', type: 'ASSET', description: 'High-value phones - Depreciable', isSystem: false, isContra: false, subtype: 'fixed_asset' },
    { code: '1560', name: 'Home Appliances', type: 'ASSET', description: 'Fridges, Washing Machines - Depreciable', isSystem: false, isContra: false, subtype: 'fixed_asset' },

    // Other Fixed Assets (1570-1599)
    { code: '1570', name: 'Farm Machinery', type: 'ASSET', description: 'Tractors, water pumps - Depreciable', isSystem: false, isContra: false, subtype: 'fixed_asset' },
    { code: '1580', name: 'Jewelry & Art', type: 'ASSET', description: 'Gold/Art - Usually holds value', isSystem: false, isContra: false, subtype: 'fixed_asset' },
    { code: '1590', name: 'Livestock (Cows/Goats)', type: 'ASSET', description: 'Biological assets - Reproduce/grow', isSystem: false, isContra: false, subtype: 'biological' },

    // ----------------------------------------
    // 4. LONG-TERM INVESTMENTS (1600-1699)
    // Used in: Assets module (Growing Wealth)
    // ----------------------------------------
    { code: '1610', name: 'Sacco Shares (BOSA)', type: 'ASSET', description: 'Non-withdrawable capital shares', isSystem: false, isContra: false, subtype: 'investment' },
    { code: '1620', name: 'Money Market Fund (MMF)', type: 'ASSET', description: 'CIC, Britam, Etica, Sanlam, etc.', isSystem: false, isContra: false, subtype: 'investment' },
    { code: '1630', name: 'Treasury Bonds / Bills', type: 'ASSET', description: 'Government lending', isSystem: false, isContra: false, subtype: 'investment' },
    { code: '1640', name: 'NSE Stock Shares', type: 'ASSET', description: 'Safaricom, Equity shares, etc.', isSystem: false, isContra: false, subtype: 'investment' },
    { code: '1650', name: 'Offshore Stocks', type: 'ASSET', description: 'US Stocks (Apple, Tesla)', isSystem: false, isContra: false, subtype: 'investment' },
    { code: '1660', name: 'Cryptocurrency (Bitcoin/Eth)', type: 'ASSET', description: 'Volatile crypto assets', isSystem: false, isContra: false, subtype: 'investment' },
    { code: '1670', name: 'Pension Fund / RBA', type: 'ASSET', description: 'Private retirement savings', isSystem: false, isContra: false, subtype: 'investment' },
    { code: '1680', name: 'Life Insurance (Cash Value)', type: 'ASSET', description: 'Policies with surrender value', isSystem: false, isContra: false, subtype: 'investment' },

    // ----------------------------------------
    // 5. CONTRA-ASSETS - Accumulated Depreciation (1700-1799)
    // Used in: Background logic only - NOT shown in user dropdowns
    // ----------------------------------------
    { code: '1710', name: 'Accum. Depr - Vehicles', type: 'ASSET', description: 'Linked to 1510 & 1511', isSystem: true, isContra: true, subtype: 'contra_asset' },
    { code: '1721', name: 'Accum. Depr - Buildings', type: 'ASSET', description: 'Linked to 1521 & 1522', isSystem: true, isContra: true, subtype: 'contra_asset' },
    { code: '1730', name: 'Accum. Depr - Furniture', type: 'ASSET', description: 'Linked to 1530', isSystem: true, isContra: true, subtype: 'contra_asset' },
    { code: '1740', name: 'Accum. Depr - Electronics', type: 'ASSET', description: 'Linked to 1540, 1550, 1560', isSystem: true, isContra: true, subtype: 'contra_asset' },
    { code: '1770', name: 'Accum. Depr - Machinery', type: 'ASSET', description: 'Linked to 1570', isSystem: true, isContra: true, subtype: 'contra_asset' },

    // ============================================
    // LIABILITIES (2000-2999)
    // ============================================

    // Current Liabilities (2000-2099)
    { code: '2000', name: 'Credit Card', type: 'LIABILITY', description: 'Credit card balances', isSystem: true, isContra: false, isPaymentEligible: true, subtype: 'credit_card' },
    { code: '2010', name: 'Loans Payable', type: 'LIABILITY', description: 'Personal/business loans', isSystem: true, isContra: false, subtype: 'liabilities' },
    { code: '2020', name: 'Accounts Payable', type: 'LIABILITY', description: 'Money owed to suppliers', isSystem: true, isContra: false, subtype: 'ap' },
    { code: '2030', name: 'Mortgage', type: 'LIABILITY', description: 'Home/property loan', isSystem: false, isContra: false, subtype: 'liabilities' },
    { code: '2040', name: 'M-Shwari Loan', type: 'LIABILITY', description: 'M-Shwari mobile loan', isSystem: false, isContra: false, subtype: 'liabilities' },
    { code: '2050', name: 'Fuliza Overdraft', type: 'LIABILITY', description: 'M-PESA overdraft', isSystem: false, isContra: false, subtype: 'liabilities' },
    { code: '2060', name: 'Sacco Loan', type: 'LIABILITY', description: 'Loan from Sacco', isSystem: false, isContra: false, subtype: 'liabilities' },
    { code: '2070', name: 'Soft Loans (Friends/Family)', type: 'LIABILITY', description: 'Money owed to individuals', isSystem: true, isContra: false, subtype: 'liabilities' },

    // VAT (2500-2599)
    { code: '2500', name: 'VAT Payable (Output VAT)', type: 'LIABILITY', description: 'VAT collected on sales (16%)', isSystem: true, isContra: false, subtype: 'tax' },

    // Customer Deposits (2600-2699)
    { code: '2600', name: 'Customer Deposits', type: 'LIABILITY', description: 'Advance payments from customers', isSystem: true, isContra: false },
    { code: '2610', name: 'Unearned Revenue', type: 'LIABILITY', description: 'Revenue received in advance', isSystem: false, isContra: false },

    // Payroll Liabilities (2700-2799)
    { code: '2700', name: 'PAYE Payable', type: 'LIABILITY', description: 'Income tax withheld from employees', isSystem: true, isContra: false, subtype: 'liabilities' },
    { code: '2710', name: 'NSSF Payable', type: 'LIABILITY', description: 'National Social Security Fund', isSystem: true, isContra: false },
    { code: '2720', name: 'NHIF Payable', type: 'LIABILITY', description: 'National Hospital Insurance Fund', isSystem: true, isContra: false },
    { code: '2730', name: 'Housing Levy Payable', type: 'LIABILITY', description: 'Affordable Housing Levy', isSystem: true, isContra: false },

    // ============================================
    // EQUITY (3000-3999)
    // ============================================
    { code: '3000', name: 'Owner Equity', type: 'EQUITY', description: 'Owner capital / Opening balance', isSystem: true, isContra: false, subtype: 'equity' },
    { code: '3010', name: 'Retained Earnings', type: 'EQUITY', description: 'Accumulated profits/savings', isSystem: true, isContra: false, subtype: 'equity' },
    { code: '3020', name: 'Drawings', type: 'EQUITY', description: 'Owner withdrawals', isSystem: false, isContra: true, subtype: 'equity' },

    // ============================================
    // INCOME (4000-4999)
    // ============================================

    // Personal Income (4000-4099)
    { code: '4000', name: 'Salary Income', type: 'INCOME', description: 'Employment salary', isSystem: true, isContra: false, subtype: 'income' },
    { code: '4010', name: 'Business Income', type: 'INCOME', description: 'Side business / freelance', isSystem: true, isContra: false, subtype: 'income' },
    { code: '4020', name: 'Investment Income', type: 'INCOME', description: 'Dividends, interest', isSystem: true, isContra: false, subtype: 'income' },
    { code: '4030', name: 'Gift Income', type: 'INCOME', description: 'Monetary gifts received', isSystem: true, isContra: false, subtype: 'income' },
    { code: '4040', name: 'Rental Income', type: 'INCOME', description: 'Property rental income', isSystem: false, isContra: false, subtype: 'income' },
    { code: '4050', name: 'Other Income', type: 'INCOME', description: 'Miscellaneous income', isSystem: true, isContra: false, subtype: 'income' },

    // Sales Revenue (4100-4199)
    { code: '4100', name: 'Product Sales', type: 'INCOME', description: 'Revenue from product sales', isSystem: true, isContra: false },
    { code: '4110', name: 'Service Sales', type: 'INCOME', description: 'Revenue from service sales', isSystem: true, isContra: false },
    { code: '4120', name: 'Sales Returns', type: 'INCOME', description: 'Returns and refunds (contra-revenue)', isSystem: true, isContra: true },
    { code: '4130', name: 'Sales Discounts', type: 'INCOME', description: 'Discounts given (contra-revenue)', isSystem: true, isContra: true },

    // Other Revenue (4200-4299)
    { code: '4200', name: 'Interest Income', type: 'INCOME', description: 'Interest earned on deposits', isSystem: false, isContra: false },
    { code: '4210', name: 'Late Fee Income', type: 'INCOME', description: 'Late payment fees from customers', isSystem: false, isContra: false },

    // ============================================
    // EXPENSES (6000-6999)
    // ============================================

    // 6000 - Housing & Utilities
    { code: '6000', name: 'Housing & Utilities', type: 'EXPENSE', description: 'Parent Category: Housing', isSystem: true, subtype: 'operating_expense' },
    { code: '6010', name: 'Rent Expense', type: 'EXPENSE', description: 'Monthly rent', parentCode: '6000', subtype: 'operating_expense' },
    { code: '6020', name: 'Mortgage Interest', type: 'EXPENSE', description: 'Interest portion of mortgage', parentCode: '6000', subtype: 'operating_expense' },
    { code: '6030', name: 'Property Taxes', type: 'EXPENSE', description: 'Property tax payments', parentCode: '6000', subtype: 'operating_expense' },
    { code: '6040', name: 'Electricity / Power', type: 'EXPENSE', description: 'Electricity bills', parentCode: '6000', subtype: 'operating_expense' },
    { code: '6050', name: 'Water & Sewer', type: 'EXPENSE', description: 'Water bills', parentCode: '6000', subtype: 'operating_expense' },
    { code: '6060', name: 'Internet & Cable', type: 'EXPENSE', description: 'Internet and TV', parentCode: '6000', subtype: 'operating_expense' },
    { code: '6070', name: 'Home Repairs & Maintenance', type: 'EXPENSE', description: 'Fixes and upkeep', parentCode: '6000', subtype: 'operating_expense' },
    { code: '6080', name: 'House Cleaning Services', type: 'EXPENSE', description: 'Cleaning help', parentCode: '6000', subtype: 'operating_expense' },

    // 6100 - Food & Living
    { code: '6100', name: 'Food & Living', type: 'EXPENSE', description: 'Parent Category: Food', isSystem: true, subtype: 'operating_expense' },
    { code: '6110', name: 'Groceries', type: 'EXPENSE', description: 'Essential food', parentCode: '6100', subtype: 'operating_expense' },
    { code: '6120', name: 'Dining Out', type: 'EXPENSE', description: 'Restaurants & delivery', parentCode: '6100', subtype: 'operating_expense' },
    { code: '6130', name: 'Personal Care', type: 'EXPENSE', description: 'Haircuts, hygiene', parentCode: '6100', subtype: 'operating_expense' },
    { code: '6140', name: 'Clothing & Shoes', type: 'EXPENSE', description: 'Apparel', parentCode: '6100', subtype: 'operating_expense' },
    { code: '6150', name: 'Laundry & Dry Cleaning', type: 'EXPENSE', description: 'Cleaning clothes', parentCode: '6100', subtype: 'operating_expense' },

    // 6200 - Transportation
    { code: '6200', name: 'Transportation', type: 'EXPENSE', description: 'Parent Category: Transport', isSystem: true, subtype: 'operating_expense' },
    { code: '6210', name: 'Fuel / Gas', type: 'EXPENSE', description: 'Fuel for vehicles', parentCode: '6200', subtype: 'operating_expense' },
    { code: '6220', name: 'Auto Insurance', type: 'EXPENSE', description: 'Car insurance', parentCode: '6200', subtype: 'operating_expense' },
    { code: '6230', name: 'Car Repairs', type: 'EXPENSE', description: 'Vehicle maintenance', parentCode: '6200', subtype: 'operating_expense' },
    { code: '6240', name: 'Parking & Tolls', type: 'EXPENSE', description: 'Parking fees', parentCode: '6200', subtype: 'operating_expense' },
    { code: '6250', name: 'Public Transport / Uber', type: 'EXPENSE', description: 'Bus, taxi, rideshare', parentCode: '6200', subtype: 'operating_expense' },
    { code: '6260', name: 'Vehicle Registration', type: 'EXPENSE', description: 'Licenses and taxes', parentCode: '6200', subtype: 'operating_expense' },

    // 6300 - Health & Wellness
    { code: '6300', name: 'Health & Wellness', type: 'EXPENSE', description: 'Parent Category: Health', isSystem: true, subtype: 'operating_expense' },
    { code: '6310', name: 'Health Insurance', type: 'EXPENSE', description: 'Premiums', parentCode: '6300', subtype: 'operating_expense' },
    { code: '6320', name: 'Doctors & Dental', type: 'EXPENSE', description: 'Visits and checkups', parentCode: '6300', subtype: 'operating_expense' },
    { code: '6330', name: 'Pharmacy', type: 'EXPENSE', description: 'Medicine and drugs', parentCode: '6300', subtype: 'operating_expense' },
    { code: '6340', name: 'Gym & Fitness', type: 'EXPENSE', description: 'Memberships and gear', parentCode: '6300', subtype: 'operating_expense' },

    // 6400 - Education & Family
    { code: '6400', name: 'Education & Family', type: 'EXPENSE', description: 'Parent Category: Family', isSystem: true, subtype: 'operating_expense' },
    { code: '6410', name: 'School Tuition', type: 'EXPENSE', description: 'Classes and fees', parentCode: '6400', subtype: 'operating_expense' },
    { code: '6420', name: 'School Supplies', type: 'EXPENSE', description: 'Books and stationery', parentCode: '6400', subtype: 'operating_expense' },
    { code: '6430', name: 'Childcare / Nanny', type: 'EXPENSE', description: 'Babysitting and help', parentCode: '6400', subtype: 'operating_expense' },
    { code: '6440', name: 'Activities', type: 'EXPENSE', description: 'Sports, music, hobbies', parentCode: '6400', subtype: 'operating_expense' },
    { code: '6450', name: 'Pet Care', type: 'EXPENSE', description: 'Vet, food, grooming', parentCode: '6400', subtype: 'operating_expense' },

    // 6500 - Entertainment
    { code: '6500', name: 'Entertainment', type: 'EXPENSE', description: 'Parent Category: Fun', isSystem: true, subtype: 'operating_expense' },
    { code: '6510', name: 'Subscriptions', type: 'EXPENSE', description: 'Netflix, Spotify, App services', parentCode: '6500', subtype: 'operating_expense' },
    { code: '6520', name: 'Movies & Events', type: 'EXPENSE', description: 'Outings and tickets', parentCode: '6500', subtype: 'operating_expense' },
    { code: '6530', name: 'Hobbies', type: 'EXPENSE', description: 'Personal interests', parentCode: '6500', subtype: 'operating_expense' },
    { code: '6540', name: 'Travel & Vacation', type: 'EXPENSE', description: 'Trips and holidays', parentCode: '6500', subtype: 'operating_expense' },

    // 6600 - Financial Fees
    { code: '6600', name: 'Financial Fees', type: 'EXPENSE', description: 'Parent Category: Fees', isSystem: true, subtype: 'operating_expense' },
    { code: '6610', name: 'Bank Charges', type: 'EXPENSE', description: 'Service fees', parentCode: '6600', subtype: 'operating_expense' },
    { code: '6620', name: 'Credit Card Interest', type: 'EXPENSE', description: 'Interest paid', parentCode: '6600', subtype: 'operating_expense' },
    { code: '6630', name: 'Late Fees', type: 'EXPENSE', description: 'Penalties', parentCode: '6600', subtype: 'operating_expense' },
    { code: '6640', name: 'M-PESA Charges', type: 'EXPENSE', description: 'Mobile money fees', parentCode: '6600', subtype: 'operating_expense' },
    { code: '6650', name: 'Bad Debt / Forgiven Loans', type: 'EXPENSE', description: 'Money lent that will not be paid back', parentCode: '6600', subtype: 'operating_expense' },

    // 6700 - Gifts & Donations
    { code: '6700', name: 'Gifts & Donations', type: 'EXPENSE', description: 'Parent Category: Giving', isSystem: true, subtype: 'operating_expense' },
    { code: '6710', name: 'Charitable Donations', type: 'EXPENSE', description: 'Church, charity', parentCode: '6700', subtype: 'operating_expense' },
    { code: '6720', name: 'Family Contributions', type: 'EXPENSE', description: 'Harambees, family support', parentCode: '6700', subtype: 'operating_expense' },
    { code: '6730', name: 'Gifts Given', type: 'EXPENSE', description: 'Birthday, wedding gifts', parentCode: '6700', subtype: 'operating_expense' },

    // 6900 - Depreciation Expenses (For Assets Module)
    { code: '6900', name: 'Depreciation Expense', type: 'EXPENSE', description: 'Parent Category: Depreciation', isSystem: true, subtype: 'depreciation' },
    { code: '6910', name: 'Depreciation - Vehicles', type: 'EXPENSE', description: 'Vehicle depreciation', parentCode: '6900', subtype: 'depreciation' },
    { code: '6920', name: 'Depreciation - Buildings', type: 'EXPENSE', description: 'Building depreciation', parentCode: '6900', subtype: 'depreciation' },
    { code: '6930', name: 'Depreciation - Furniture', type: 'EXPENSE', description: 'Furniture depreciation', parentCode: '6900', subtype: 'depreciation' },
    { code: '6940', name: 'Depreciation - Electronics', type: 'EXPENSE', description: 'Electronics depreciation', parentCode: '6900', subtype: 'depreciation' },
    { code: '6970', name: 'Depreciation - Machinery', type: 'EXPENSE', description: 'Farm machinery depreciation', parentCode: '6900', subtype: 'depreciation' },

    // 4300 - Gain/Loss on Asset Disposal (For Assets Module)
    { code: '4300', name: 'Gain on Asset Disposal', type: 'INCOME', description: 'Profit from selling assets', isSystem: true, subtype: 'other_income' },
    { code: '6800', name: 'Loss on Asset Disposal', type: 'EXPENSE', description: 'Loss from selling assets', isSystem: true, subtype: 'other_expense' },

    // Other Standard Business (5000 series for COGS)
    { code: '5199', name: 'Uncategorized Expense', type: 'EXPENSE', description: 'To be sorted', isSystem: true, subtype: 'operating_expense' },
    { code: '5200', name: 'Cost of Goods Sold', type: 'EXPENSE', description: 'Direct business costs', isSystem: false, subtype: 'cogs' },
    { code: '5400', name: 'Salaries & Wages', type: 'EXPENSE', description: 'Employee salaries', isSystem: false, subtype: 'operating_expense' },
];

// ============================================
// CATEGORY TO ACCOUNT MAPPING
// ============================================

/**
 * Maps frontend category names to account codes
 * This allows transactions to be recorded with user-friendly category names
 * while automatically posting to the correct accounting accounts
 */
export const CATEGORY_ACCOUNT_MAP = {
    // Income Categories
    'Salary': { incomeAccount: '4000', defaultAssetAccount: '1020' },  // Equity Bank
    'Business': { incomeAccount: '4010', defaultAssetAccount: '1010' }, // M-PESA
    'Investment': { incomeAccount: '4020', defaultAssetAccount: '1020' }, // Equity Bank
    'Gift': { incomeAccount: '4030', defaultAssetAccount: '1001' }, // Cash
    'Rental': { incomeAccount: '4040', defaultAssetAccount: '1020' }, // Equity Bank
    'Other Income': { incomeAccount: '4050', defaultAssetAccount: '1001' }, // Cash

    // Sales Revenue
    'Product Sales': { incomeAccount: '4100', defaultAssetAccount: '1010' }, // M-PESA
    'Service Sales': { incomeAccount: '4110', defaultAssetAccount: '1010' }, // M-PESA

    // Expense Categories (Aligned to new 6000 series)
    'Food': { expenseAccount: '6100', defaultAssetAccount: '1001' }, // Cash
    'Groceries': { expenseAccount: '6110', defaultAssetAccount: '1001' }, // Cash
    'Transport': { expenseAccount: '6200', defaultAssetAccount: '1001' }, // Cash
    'Housing': { expenseAccount: '6000', defaultAssetAccount: '1020' }, // Equity Bank
    'Rent': { expenseAccount: '6010', defaultAssetAccount: '1020' }, // Equity Bank
    'Utilities': { expenseAccount: '6000', defaultAssetAccount: '1010' }, // M-PESA
    'Healthcare': { expenseAccount: '6300', defaultAssetAccount: '1001' }, // Cash
    'Education': { expenseAccount: '6400', defaultAssetAccount: '1020' }, // Equity Bank
    'Entertainment': { expenseAccount: '6500', defaultAssetAccount: '1001' }, // Cash
    'Shopping': { expenseAccount: '6140', defaultAssetAccount: '1001' }, // Cash
    'Communication': { expenseAccount: '6060', defaultAssetAccount: '1010' }, // M-PESA
    'Insurance': { expenseAccount: '6310', defaultAssetAccount: '1020' }, // Equity Bank
    'Donations': { expenseAccount: '5199', defaultAssetAccount: '1001' }, // Cash
    'Other Expenses': { expenseAccount: '5199', defaultAssetAccount: '1001' }, // Cash

    // Business Expense Categories
    'COGS': { expenseAccount: '5200', defaultAssetAccount: '1300' },
    'Bank Charges': { expenseAccount: '6610', defaultAssetAccount: '1020' }, // Equity Bank
    'Interest Expense': { expenseAccount: '6620', defaultAssetAccount: '1020' }, // Equity Bank
    'Depreciation': { expenseAccount: '5300', defaultAssetAccount: '1590' },
    'Salaries': { expenseAccount: '5400', defaultAssetAccount: '1020' }, // Equity Bank

    // Additional Standard Categories
    'Subscriptions': { expenseAccount: '6510', defaultAssetAccount: '1010' }, // M-PESA
    'Personal Care': { expenseAccount: '6130', defaultAssetAccount: '1001' }, // Cash
    'Pet Care': { expenseAccount: '6450', defaultAssetAccount: '1001' }, // Cash
    'Childcare': { expenseAccount: '6430', defaultAssetAccount: '1001' }, // Cash
    'Gym': { expenseAccount: '6340', defaultAssetAccount: '1010' }, // M-PESA
    'Fitness': { expenseAccount: '6340', defaultAssetAccount: '1010' }, // M-PESA
};

const KEYWORD_ACCOUNT_MAP = {
    // Transport
    'uber': '6250', 'bolt': '6250', 'lyft': '6250', 'taxify': '6250', 'taxi': '6250',
    'fuel': '6210', 'gas': '6210', 'petrol': '6210', 'diesel': '6210', 'shell': '6210', 'total': '6210',
    'parking': '6240', 'toll': '6240',
    'bus': '6250', 'matatu': '6250', 'fare': '6250',
    'auto': '6230', 'mechanic': '6230', 'repair': '6230', 'service': '6230',

    // Food
    'restaurant': '6120', 'cafe': '6120', 'coffee': '6120', 'java': '6120', 'artcaffe': '6120', 'kfc': '6120', 'burger': '6120', 'pizza': '6120', 'dinner': '6120', 'lunch': '6120', 'breakfast': '6120',
    'supermarket': '6110', 'grocy': '6110', 'naivas': '6110', 'carrefour': '6110', 'quickmart': '6110', 'chandarana': '6110',

    // Utilities
    'kplc': '6040', 'power': '6040', 'electricity': '6040', 'token': '6040',
    'water': '6050', 'sewer': '6050', 'nairobi water': '6050',
    'internet': '6060', 'wifi': '6060', 'zuku': '6060', 'safaricom home': '6060', 'jtl': '6060', 'starlink': '6060',
    'airtime': '6060', 'safaricom': '6060', 'airtel': '6060', 'telkom': '6060', 'data': '6060', 'bundle': '6060',

    // Housing
    'rent': '6010', 'landlord': '6010', 'housing': '6010',
    'clean': '6080', 'maid': '6080', 'househelp': '6080',

    // Subscriptions
    'netflix': '6510', 'spotify': '6510', 'youtube': '6510', 'prime': '6510', 'apple': '6510', 'showmax': '6510', 'dstv': '6060', 'gotv': '6060',

    // Shopping
    'cloth': '6140', 'shoe': '6140', 'wear': '6140', 'fashion': '6140', 'dress': '6140', 'shirt': '6140',
    'jumia': '5199', 'amazon': '5199',

    // Entertainment
    'movie': '6520', 'cinema': '6520', 'imax': '6520', 'ticket': '6520',
    'game': '6530', 'bet': '6530', 'sport': '6440',

    // Healthcare
    'drug': '6330', 'pharmacy': '6330', 'chemist': '6330', 'med': '6330',
    'doctor': '6320', 'hospital': '6320', 'clinic': '6320', 'consultation': '6320', 'dental': '6320', 'dentist': '6320',
    'insurance': '6310', 'nhif': '6310', 'premium': '6310',
    'gym': '6340', 'fitness': '6340', 'workout': '6340',

    // Education
    'school': '6410', 'tuition': '6410', 'fee': '6410', 'university': '6410', 'college': '6410',
    'book': '6420', 'course': '6410', 'class': '6410', 'stationery': '6420', 'uniform': '6420',

    // Family
    'nanny': '6430', 'baby': '6430', 'child': '6430', 'daycare': '6430',
    'pet': '6450', 'vet': '6450', 'dog': '6450', 'cat': '6450',
};

// ============================================
// ACCOUNT SEEDING SERVICE
// ============================================

/**
 * Seeds the Chart of Accounts for a new family tenant
 * Called automatically when a new family is created
 * 
 * @param {number} tenantId - The tenant ID to seed accounts for
 * @param {string} currency - Default currency (default: KES)
 */
export async function seedFamilyCoA(tenantId, currency = 'KES') {
    try {
        // Check if accounts already exist (just for logging)
        const existingAccounts = await prisma.account.count({
            where: { tenantId }
        });

        if (existingAccounts > 0) {
            console.log(`[AccountingService] Tenant ${tenantId} has ${existingAccounts} accounts. Proceeding to sync/seed new accounts...`);
        }

        // 1. First Pass: Create or Update all accounts (without parent links)
        // Using Loop + Upsert to ensure we can update existing tenants without duplicates
        for (const acc of FAMILY_COA_TEMPLATE) {
            await prisma.account.upsert({
                where: {
                    tenantId_code: { tenantId, code: acc.code }
                },
                update: {
                    name: acc.name,
                    description: acc.description,
                    subtype: acc.subtype,
                    // We don't update type/conra/system to avoid breaking things, unless necessary
                },
                create: {
                    tenantId,
                    code: acc.code,
                    name: acc.name,
                    type: acc.type,
                    subtype: acc.subtype,
                    description: acc.description || null,
                    isSystem: acc.isSystem || false,
                    isContra: acc.isContra || false,
                    isPaymentEligible: acc.isPaymentEligible || false,
                    isActive: true,
                    currency,
                }
            });
        }

        console.log(`[AccountingService] Synced base accounts using Upsert (Safe Update)`);

        // 2. Second Pass: Link Parents
        // We need to fetch the created accounts to get their IDs
        const createdAccounts = await prisma.account.findMany({
            where: { tenantId },
            select: { id: true, code: true }
        });

        // Create a map for quick lookup: code -> id
        const accountMap = {};
        createdAccounts.forEach(acc => {
            accountMap[acc.code] = acc.id;
        });

        // Loop through template and update parents where applicable
        let parentUpdates = 0;
        for (const templateAcc of FAMILY_COA_TEMPLATE) {
            if (templateAcc.parentCode) {
                const childId = accountMap[templateAcc.code];
                const parentId = accountMap[templateAcc.parentCode];

                if (childId && parentId) {
                    await prisma.account.update({
                        where: { id: childId },
                        data: { parentId }
                    });
                    parentUpdates++;
                }
            }
        }

        console.log(`[AccountingService] Linked ${parentUpdates} parent-child relationships`);

        return accountsToCreate.length;
    } catch (error) {
        console.error('[AccountingService] Error seeding CoA:', error);
        throw error;
    }
}

// ============================================
// CATEGORY TEMPLATE
// ============================================

/**
 * Standard Family Categories Template
 * These categories map to the Chart of Accounts
 */
const FAMILY_CATEGORIES_TEMPLATE = [
    // Income Categories
    { name: 'Salary', type: 'income', icon: '💼', color: '#10B981' },
    { name: 'Business', type: 'income', icon: '🏢', color: '#3B82F6' },
    { name: 'Investment', type: 'income', icon: '📈', color: '#8B5CF6' },
    { name: 'Gift', type: 'income', icon: '🎁', color: '#EC4899' },
    { name: 'Rental', type: 'income', icon: '🏠', color: '#F59E0B' },
    { name: 'Other Income', type: 'income', icon: '💰', color: '#6EE7B7' },

    // Expense Categories
    { name: 'Food', type: 'expense', icon: '🍔', color: '#EF4444' },
    { name: 'Transport', type: 'expense', icon: '🚗', color: '#F97316' },
    { name: 'Housing', type: 'expense', icon: '🏡', color: '#84CC16' },
    { name: 'Utilities', type: 'expense', icon: '💡', color: '#14B8A6' },
    { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#06B6D4' },
    { name: 'Education', type: 'expense', icon: '📚', color: '#3B82F6' },
    { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#8B5CF6' },
    { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#EC4899' },
    { name: 'Communication', type: 'expense', icon: '📱', color: '#F43F5E' },
    { name: 'Insurance', type: 'expense', icon: '🛡️', color: '#64748B' },
    { name: 'Donations', type: 'expense', icon: '🤝', color: '#10B981' },
    { name: 'Other Expenses', type: 'expense', icon: '📦', color: '#6B7280' },
];

/**
 * Seeds categories for a new family tenant
 * Called automatically when a new family is created
 * 
 * @param {number} tenantId - The tenant ID to seed categories for
 */
export async function seedFamilyCategories(tenantId) {
    try {
        // Create all categories from template, skipping duplicates if they exist
        const categoriesToCreate = FAMILY_CATEGORIES_TEMPLATE.map(cat => ({
            tenantId,
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            color: cat.color,
        }));

        await prisma.category.createMany({
            data: categoriesToCreate,
            skipDuplicates: true,
        });

        // Clean up duplicates if any somehow exist (simple name-based check)
        // Group by name/type and delete ids that are not the first one
        // Note: Prisma doesn't have a simple distinct-delete, so we do this manually if needed.
        // For now, createMany with skipDuplicates handles the "Preventing future creation" part.
        // To fix CURRENT duplicates, we can run a cleanup query.

        console.log(`[AccountingService] Synced/Seeded categories for tenant ${tenantId}`);

        return categoriesToCreate.length;
    } catch (error) {
        console.error('[AccountingService] Error seeding categories:', error);
        throw error;
    }
}

// ============================================
// PAYMENT METHODS TEMPLATE
// ============================================

/**
 * Standard Family Payment Methods Template
 */
const FAMILY_PAYMENT_METHODS_TEMPLATE = [
    { name: 'Cash', type: 'cash', details: { description: 'Physical cash payments' } },
    { name: 'M-Pesa', type: 'mobile_money', details: { provider: 'Safaricom' } },
    { name: 'Bank Transfer', type: 'bank', details: { description: 'Direct bank transfers' } },
    { name: 'Credit Card', type: 'card', details: { cardType: 'credit' } },
    { name: 'Debit Card', type: 'card', details: { cardType: 'debit' } },
];

/**
 * Seeds payment methods for a new family tenant
 * Called automatically when a new family is created
 * 
 * @param {number} tenantId - The tenant ID to seed payment methods for
 */
export async function seedFamilyPaymentMethods(tenantId) {
    try {
        // Check if payment methods already exist
        const existingPaymentMethods = await prisma.paymentMethod.count({
            where: { tenantId }
        });

        if (existingPaymentMethods > 0) {
            console.log(`[AccountingService] Tenant ${tenantId} already has ${existingPaymentMethods} payment methods, skipping seed`);
            return;
        }

        // Create all payment methods from template
        const paymentMethodsToCreate = FAMILY_PAYMENT_METHODS_TEMPLATE.map(pm => ({
            tenantId,
            name: pm.name,
            type: pm.type,
            details: pm.details,
            isActive: true,
        }));

        await prisma.paymentMethod.createMany({
            data: paymentMethodsToCreate,
        });

        console.log(`[AccountingService] Seeded ${paymentMethodsToCreate.length} payment methods for tenant ${tenantId}`);

        return paymentMethodsToCreate.length;
    } catch (error) {
        console.error('[AccountingService] Error seeding payment methods:', error);
        throw error;
    }
}

// ============================================
// ACCOUNT MAPPING SERVICE
// ============================================

/**
 * Gets the account mapping for a transaction category
 * Returns the appropriate debit and credit account codes
 * 
 * @param {string} category - Transaction category name
 * @param {string} type - Transaction type (INCOME or EXPENSE)
 * @returns {Object} Mapping with debitAccountCode and creditAccountCode
 */
export function getAccountMapping(category, type) {
    // 1. Exact or Alias Map Lookup
    let mapping = CATEGORY_ACCOUNT_MAP[category];

    // 2. Keyword Lookup (if no exact match and type is EXPENSE)
    if (!mapping && type === 'EXPENSE' && category) {
        const lowerCat = category.toLowerCase();
        for (const [keyword, code] of Object.entries(KEYWORD_ACCOUNT_MAP)) {
            if (lowerCat.includes(keyword)) {
                mapping = {
                    expenseAccount: code,
                    defaultAssetAccount: '1000'
                };
                break;
            }
        }
    }

    if (!mapping) {
        // Default fallback
        if (type === 'INCOME') {
            return {
                debitAccountCode: '1000',  // Cash
                creditAccountCode: '4050', // Other Income
            };
        } else {
            return {
                debitAccountCode: '5199', // Other Expenses
                creditAccountCode: '1000', // Cash
            };
        }
    }

    if (type === 'INCOME') {
        return {
            debitAccountCode: mapping.defaultAssetAccount,
            creditAccountCode: mapping.incomeAccount,
        };
    } else {
        return {
            debitAccountCode: mapping.expenseAccount,
            creditAccountCode: mapping.defaultAssetAccount,
        };
    }
}

/**
 * Resolves account codes to account IDs for a tenant
 * 
 * @param {number} tenantId 
 * @param {string} debitCode 
 * @param {string} creditCode 
 * @returns {Object} { debitAccountId, creditAccountId }
 */
export async function resolveAccountIds(tenantId, debitCode, creditCode) {
    const [debitAccount, creditAccount] = await Promise.all([
        prisma.account.findFirst({ where: { tenantId, code: debitCode } }),
        prisma.account.findFirst({ where: { tenantId, code: creditCode } }),
    ]);

    return {
        debitAccountId: debitAccount?.id || null,
        creditAccountId: creditAccount?.id || null,
    };
}

// ============================================
// JOURNAL POSTING SERVICE
// ============================================

/**
 * Creates a double-entry journal posting
 * This is the core accounting function that ensures every transaction
 * has balanced debits and credits
 * 
 * @param {Object} params
 * @param {number} params.tenantId - Tenant ID
 * @param {number} params.debitAccountId - Account to debit
 * @param {number} params.creditAccountId - Account to credit
 * @param {number} params.amount - Transaction amount
 * @param {string} params.description - Journal description
 * @param {Date} params.date - Transaction date
 * @param {number} params.createdById - User creating the entry
 * @returns {Object} Created journal with lines
 */
export async function createJournalEntry({
    tenantId,
    debitAccountId,
    creditAccountId,
    lines, // Optional: Array of { accountId, debit, credit, description }
    amount,
    description,
    date = new Date(),
    createdById = null,
}) {
    let journalLines = [];

    // Scenario 1: Legacy (Debit/Credit pair provided)
    if (!lines) {
        // Validate: Both accounts must exist
        if (!debitAccountId || !creditAccountId) {
            throw new Error('Both debit and credit accounts are required');
        }

        // Validate: Amount must be positive
        if (!amount || amount <= 0) {
            throw new Error('Amount must be greater than zero');
        }

        journalLines = [
            {
                accountId: debitAccountId,
                debit: amount,
                credit: 0,
                description: `Debit: ${description}`,
            },
            {
                accountId: creditAccountId,
                debit: 0,
                credit: amount,
                description: `Credit: ${description}`,
            }
        ];
    }
    // Scenario 2: Explicit Lines (Split Transaction)
    else {
        if (!Array.isArray(lines) || lines.length < 2) {
            throw new Error('Journal must have at least 2 lines');
        }

        // Calculate totals to ensure balance
        const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
        const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

        // Allow strictly equal or very close (floating point tolerance)
        if (Math.abs(totalDebit - totalCredit) > 0.05) {
            throw new Error(`Journal Entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`);
        }

        journalLines = lines;
    }

    // Create journal entry with lines in a transaction
    const journal = await prisma.$transaction(async (tx) => {
        // 1. Create journal header
        const journalEntry = await tx.journal.create({
            data: {
                tenantId,
                description,
                date,
                status: 'POSTED',
                createdById,
                reference: `JE-${Date.now()}`,
            },
        });

        // 2. Create lines
        for (const line of journalLines) {
            await tx.journalLine.create({
                data: {
                    journalId: journalEntry.id,
                    accountId: line.accountId,
                    debit: Number(line.debit || 0),
                    credit: Number(line.credit || 0),
                    description: line.description || description,
                },
            });
        }

        // Return journal with lines
        return tx.journal.findUnique({
            where: { id: journalEntry.id },
            include: {
                lines: {
                    include: {
                        account: { select: { id: true, code: true, name: true, type: true } },
                    },
                },
            },
        });
    });

    console.log(`[AccountingService] Created journal ${journal.id} with ${journal.lines.length} lines`);

    return journal;
}

/**
 * Voids a journal entry (reverses the transaction)
 * 
 * @param {number} journalId 
 */
export async function voidJournalEntry(journalId) {
    const journal = await prisma.journal.findUnique({
        where: { id: journalId },
        include: { lines: true },
    });

    if (!journal) {
        throw new Error('Journal entry not found');
    }

    if (journal.status === 'VOID') {
        throw new Error('Journal entry is already voided');
    }

    // Create reversing entry
    await prisma.$transaction(async (tx) => {
        // Mark original as void
        await tx.journal.update({
            where: { id: journalId },
            data: { status: 'VOID' },
        });

        // Create reversing journal
        const reversingJournal = await tx.journal.create({
            data: {
                tenantId: journal.tenantId,
                description: `REVERSAL: ${journal.description}`,
                date: new Date(),
                status: 'POSTED',
                reference: `REV-${journal.reference}`,
            },
        });

        // Create reversed lines (swap debit/credit)
        for (const line of journal.lines) {
            await tx.journalLine.create({
                data: {
                    journalId: reversingJournal.id,
                    accountId: line.accountId,
                    debit: line.credit,  // Swap
                    credit: line.debit,  // Swap
                    description: `Reversal of: ${line.description || ''}`,
                },
            });
        }
    });

    console.log(`[AccountingService] Voided journal ${journalId}`);
}

// ============================================
// ACCOUNT BALANCE SERVICE
// ============================================

/**
 * Calculates the current balance for an account
 * Uses the accounting equation:
 * - Assets/Expenses: Debit increases, Credit decreases (balance = debits - credits)
 * - Liabilities/Equity/Income: Credit increases, Debit decreases (balance = credits - debits)
 * 
 * @param {number} accountId 
 * @param {Date} asOfDate - Optional: Calculate balance as of this date
 * @returns {number} Current balance
 */
export async function getAccountBalance(accountId, asOfDate = new Date()) {
    const account = await prisma.account.findUnique({
        where: { id: accountId },
    });

    if (!account) {
        throw new Error('Account not found');
    }

    // Aggregate debits and credits
    const totals = await prisma.journalLine.aggregate({
        where: {
            accountId,
            journal: {
                status: 'POSTED',
                date: { lte: asOfDate } // Respect the cutoff date!
            },
        },
        _sum: {
            debit: true,
            credit: true,
        },
    });

    const totalDebits = Number(totals._sum.debit || 0);
    const totalCredits = Number(totals._sum.credit || 0);

    // Calculate balance based on account type
    let balance;
    if (['ASSET', 'EXPENSE'].includes(account.type)) {
        // Normal debit balance accounts
        balance = totalDebits - totalCredits;
    } else {
        // Normal credit balance accounts (LIABILITY, EQUITY, INCOME)
        balance = totalCredits - totalDebits;
    }

    return balance;
}

/**
 * Gets all account balances for a tenant
 * 
 * @param {number} tenantId 
 * @param {Date} asOfDate - Optional: Return balances as of this date
 * @returns {Array} Accounts with calculated balances
 */
export async function getAllAccountBalances(tenantId, asOfDate = new Date()) {
    const accounts = await prisma.account.findMany({
        where: { tenantId, isActive: true },
        orderBy: { code: 'asc' },
    });

    const accountsWithBalances = await Promise.all(
        accounts.map(async (account) => {
            const balance = await getAccountBalance(account.id, asOfDate);
            return { ...account, balance };
        })
    );

    return accountsWithBalances;
}

// ============================================
// FINANCIAL REPORTS
// ============================================

/**
 * Generates Trial Balance report
 * Lists all accounts with their debit/credit balances
 * Total debits should equal total credits
 * 
 * @param {number} tenantId 
 * @param {Date} asOfDate 
 */
export async function getTrialBalance(tenantId, asOfDate = new Date()) {
    const accounts = await prisma.account.findMany({
        where: { tenantId, isActive: true },
        orderBy: { code: 'asc' },
    });

    const trialBalanceLines = await Promise.all(
        accounts.map(async (account) => {
            const totals = await prisma.journalLine.aggregate({
                where: {
                    accountId: account.id,
                    journal: {
                        status: 'POSTED',
                        date: { lte: asOfDate },
                    },
                },
                _sum: {
                    debit: true,
                    credit: true,
                },
            });

            const totalDebits = Number(totals._sum.debit || 0);
            const totalCredits = Number(totals._sum.credit || 0);

            let debitBalance = 0;
            let creditBalance = 0;

            if (['ASSET', 'EXPENSE'].includes(account.type)) {
                const netBalance = totalDebits - totalCredits;
                if (netBalance >= 0) {
                    debitBalance = netBalance;
                } else {
                    creditBalance = Math.abs(netBalance);
                }
            } else {
                const netBalance = totalCredits - totalDebits;
                if (netBalance >= 0) {
                    creditBalance = netBalance;
                } else {
                    debitBalance = Math.abs(netBalance);
                }
            }

            return {
                accountId: account.id,
                code: account.code,
                name: account.name,
                type: account.type,
                debitBalance,
                creditBalance,
            };
        })
    );

    // Filter out zero-balance accounts for cleaner report
    const activeLines = trialBalanceLines.filter(
        line => line.debitBalance !== 0 || line.creditBalance !== 0
    );

    const totalDebits = activeLines.reduce((sum, line) => sum + line.debitBalance, 0);
    const totalCredits = activeLines.reduce((sum, line) => sum + line.creditBalance, 0);

    return {
        asOfDate,
        lines: activeLines,
        totals: {
            debits: totalDebits,
            credits: totalCredits,
            isBalanced: Math.abs(totalDebits - totalCredits) < 0.01, // Allow for floating point errors
        },
    };
}

/**
 * Generates Profit & Loss (Income Statement) report
 * Shows income vs expenses for a period
 * 
 * @param {number} tenantId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 */
export async function getProfitAndLoss(tenantId, startDate, endDate) {
    // Get all income accounts
    const incomeAccounts = await prisma.account.findMany({
        where: { tenantId, type: 'INCOME', isActive: true },
        orderBy: { code: 'asc' },
    });

    // Get all expense accounts
    const expenseAccounts = await prisma.account.findMany({
        where: { tenantId, type: 'EXPENSE', isActive: true },
        orderBy: { code: 'asc' },
    });

    // Calculate income totals
    const incomeLines = await Promise.all(
        incomeAccounts.map(async (account) => {
            const totals = await prisma.journalLine.aggregate({
                where: {
                    accountId: account.id,
                    journal: {
                        status: 'POSTED',
                        date: { gte: startDate, lte: endDate },
                    },
                },
                _sum: { credit: true, debit: true },
            });

            // Income: credits increase, debits decrease
            const amount = Number(totals._sum.credit || 0) - Number(totals._sum.debit || 0);

            return {
                accountId: account.id,
                code: account.code,
                name: account.name,
                amount,
            };
        })
    );

    // Calculate expense totals
    const expenseLines = await Promise.all(
        expenseAccounts.map(async (account) => {
            const totals = await prisma.journalLine.aggregate({
                where: {
                    accountId: account.id,
                    journal: {
                        status: 'POSTED',
                        date: { gte: startDate, lte: endDate },
                    },
                },
                _sum: { debit: true, credit: true },
            });

            // Expenses: debits increase, credits decrease
            const amount = Number(totals._sum.debit || 0) - Number(totals._sum.credit || 0);

            return {
                accountId: account.id,
                code: account.code,
                name: account.name,
                amount,
            };
        })
    );

    // Filter out zero amounts
    const activeIncome = incomeLines.filter(line => line.amount !== 0);
    const activeExpenses = expenseLines.filter(line => line.amount !== 0);

    const totalIncome = activeIncome.reduce((sum, line) => sum + line.amount, 0);
    const totalExpenses = activeExpenses.reduce((sum, line) => sum + line.amount, 0);
    const netIncome = totalIncome - totalExpenses;

    return {
        period: { startDate, endDate },
        income: {
            lines: activeIncome,
            total: totalIncome,
        },
        expenses: {
            lines: activeExpenses,
            total: totalExpenses,
        },
        netIncome,
        savingsRate: totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0,
    };
}

/**
 * Generates Cash Flow report
 * Shows changes in asset accounts over time
 * 
 * @param {number} tenantId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 */
export async function getCashFlow(tenantId, startDate, endDate) {
    // Get all asset accounts (cash/bank)
    const assetAccounts = await prisma.account.findMany({
        where: {
            tenantId,
            type: 'ASSET',
            isActive: true,
            code: { in: ['1000', '1010', '1020', '1030', '1040', '1050'] }, // Cash & bank accounts
        },
        orderBy: { code: 'asc' },
    });

    const cashFlowLines = await Promise.all(
        assetAccounts.map(async (account) => {
            // Opening balance (before start date)
            const openingTotals = await prisma.journalLine.aggregate({
                where: {
                    accountId: account.id,
                    journal: {
                        status: 'POSTED',
                        date: { lt: startDate },
                    },
                },
                _sum: { debit: true, credit: true },
            });

            const openingBalance = Number(openingTotals._sum.debit || 0) - Number(openingTotals._sum.credit || 0);

            // Period activity
            const periodTotals = await prisma.journalLine.aggregate({
                where: {
                    accountId: account.id,
                    journal: {
                        status: 'POSTED',
                        date: { gte: startDate, lte: endDate },
                    },
                },
                _sum: { debit: true, credit: true },
            });

            const inflows = Number(periodTotals._sum.debit || 0);
            const outflows = Number(periodTotals._sum.credit || 0);
            const netChange = inflows - outflows;
            const closingBalance = openingBalance + netChange;

            return {
                accountId: account.id,
                code: account.code,
                name: account.name,
                openingBalance,
                inflows,
                outflows,
                netChange,
                closingBalance,
            };
        })
    );

    const totals = cashFlowLines.reduce(
        (acc, line) => ({
            openingBalance: acc.openingBalance + line.openingBalance,
            inflows: acc.inflows + line.inflows,
            outflows: acc.outflows + line.outflows,
            netChange: acc.netChange + line.netChange,
            closingBalance: acc.closingBalance + line.closingBalance,
        }),
        { openingBalance: 0, inflows: 0, outflows: 0, netChange: 0, closingBalance: 0 }
    );

    return {
        period: { startDate, endDate },
        accounts: cashFlowLines,
        totals,
    };
}

/**
 * Generate Balance Sheet Report - PROFESSIONAL GRADE
 * THE PERFECT BALANCE SHEET with Advanced Accounting Logic
 * 
 * FEATURES:
 * ✅ Contra-Account Handling (Depreciation matching)
 * ✅ Intelligent Asset Grouping by Liquidity
 * ✅ Date Cutoff Support (As Of Date)
 * ✅ Health Metrics & AI Insights
 * ✅ Zero-Balance Filtering
 * 
 * ASSETS:
 * 1. Liquid Cash & Banks (1000-1099) - Immediate liquidity
 * 2. Investments (1600-1699) - Growth assets
 * 3. Fixed Assets (1500-1599) - Physical wealth with depreciation (1700-1799)
 * 
 * LIABILITIES:
 * 1. Current Liabilities (2000-2499) - Due within 1 year
 * 2. Long Term Liabilities (2500-2999) - Multi-year obligations
 * 
 * @param {number} tenantId 
 * @param {Date} asOfDate 
 */
/**
 * Generate Balance Sheet Report - STANDARD ACCOUNTING FORMAT
 * Matches User Request: Assets (Current/Non-Current), Liabilities (Current/Non-Current), Equity
 * 
 * FEATURES:
 * ✅ Strict "Zero Balance" Filtering
 * ✅ Dynamic Retained Earnings Calculation (Lifetime Income - Lifetime Expenses)
 * ✅ Contra-Asset Handling (Accumulated Depreciation shown as negative asset)
 * ✅ Structured exactly like the reference image
 * 
 * @param {number} tenantId 
 * @param {Date} asOfDate 
 */
export async function getBalanceSheet(tenantId, asOfDate = new Date()) {
    // ==================== STEP 1: FETCH RAW DATA ====================
    const rawAccounts = await getAllAccountBalances(tenantId, asOfDate);

    // Calculate Lifetime Retained Earnings (Income - Expenses)
    // This is crucial for the Balance Sheet to balance (Assets = Liabilities + Equity)
    const retainedEarningsData = await getProfitAndLoss(tenantId, new Date('2000-01-01'), asOfDate);
    const retainedEarningsAmount = retainedEarningsData.netIncome;

    // Filter only accounts with real balances
    const hasRealBalance = (amount) => {
        return Math.abs(Number(amount)) > 0.00; // Strict > 0 check
    };

    // Initialize the report structure
    const structure = {
        assets: {
            current: { total: 0, accounts: [] },     // Cash, Bank, Receivables, Inventory, Prepaid (1000-1499)
            nonCurrent: { total: 0, accounts: [] },  // Fixed Assets, Investments (1500-1999)
            total: 0
        },
        liabilities: {
            current: { total: 0, accounts: [] },     // Accounts Payable, Short-term debt (2000-2499)
            nonCurrent: { total: 0, accounts: [] },  // Loans, Long-term debt (2500-2999)
            total: 0
        },
        equity: {
            total: 0,
            accounts: [] // Capital, Retained Earnings (3000-3999)
        }
    };

    // ==================== STEP 2: SORT INTO BUCKETS ====================
    rawAccounts.forEach(account => {
        let balance = Number(account.balance);
        const code = parseInt(account.code);

        // Strict Zero Filter
        if (!hasRealBalance(balance)) return;

        // Skip Income (4xxx) and Expense (5xxx) items - they are rolled into Retained Earnings
        if (account.type === 'INCOME' || account.type === 'EXPENSE') return;

        // Formatting Helper
        const formatItem = () => ({
            code: account.code,
            name: account.name,
            amount: balance
        });

        // --- ASSETS (1000-1999) ---
        if (code >= 1000 && code <= 1999) {
            // Determine Current vs Non-Current
            // Current: 1000-1499 (Cash, Bank, AR, Inventory)
            // Non-Current: 1500-1999 (Fixed Assets, Investments, Contra-Assets)

            // Special handling for Accumulated Depreciation (Contra-Asset)
            // Ideally, it should be negative balance if it's a credit balance account.
            // getAccountBalance returns 'debits - credits' for ASSET type.
            // If accumulated depreciation is an ASSET type but normally credit, it will come as negative.

            if (code >= 1000 && code <= 1499) {
                // Current Assets
                structure.assets.current.accounts.push(formatItem());
                structure.assets.current.total += balance;
            } else {
                // Non-Current Assets
                structure.assets.nonCurrent.accounts.push(formatItem());
                structure.assets.nonCurrent.total += balance;
            }
        }

        // --- LIABILITIES (2000-2999) ---
        else if (code >= 2000 && code <= 2999) {
            // Determine Current vs Non-Current
            // Current: 2000-2499 (AP, Credit Cards, Short-term)
            // Non-Current: 2500-2999 (Loans)

            if (code >= 2000 && code <= 2499) {
                structure.liabilities.current.accounts.push(formatItem());
                structure.liabilities.current.total += balance;
            } else {
                structure.liabilities.nonCurrent.accounts.push(formatItem());
                structure.liabilities.nonCurrent.total += balance;
            }
        }

        // --- EQUITY (3000-3999) ---
        else if (code >= 3000 && code <= 3999) {
            structure.equity.accounts.push(formatItem());
            structure.equity.total += balance;
        }
    });

    // ==================== STEP 3: ADD RETAINED EARNINGS ====================
    // Only add if non-zero
    if (Math.abs(retainedEarningsAmount) > 0.00) {
        structure.equity.accounts.push({
            code: '3999', // Virtual code
            name: 'Retained Earnings', // Or "Net Income for Period"
            amount: retainedEarningsAmount
        });
        structure.equity.total += retainedEarningsAmount;
    }

    // ==================== STEP 4: CALCULATE GRAND TOTALS ====================
    structure.assets.total = structure.assets.current.total + structure.assets.nonCurrent.total;
    structure.liabilities.total = structure.liabilities.current.total + structure.liabilities.nonCurrent.total;

    const totalLiabilitiesAndEquity = structure.liabilities.total + structure.equity.total;

    // ==================== STEP 5: PREPARE FINAL JSON RESPONSE ====================
    return {
        meta: {
            asOfDate: asOfDate.toISOString(),
            currency: 'KES',
            isBalanced: Math.abs(structure.assets.total - totalLiabilitiesAndEquity) < 1.0 // Allow small float variance
        },
        assets: {
            currentAssets: {
                label: "Current Assets",
                items: structure.assets.current.accounts,
                total: structure.assets.current.total
            },
            nonCurrentAssets: {
                label: "Non-Current Assets",
                items: structure.assets.nonCurrent.accounts,
                total: structure.assets.nonCurrent.total // Should include negative depreciation
            },
            totalAssets: structure.assets.total
        },
        liabilitiesAndEquity: {
            liabilities: {
                currentLiabilities: {
                    label: "Current Liabilities",
                    items: structure.liabilities.current.accounts,
                    total: structure.liabilities.current.total
                },
                nonCurrentLiabilities: {
                    label: "Non-Current Liabilities", // e.g., Long-term Debt (loan)
                    items: structure.liabilities.nonCurrent.accounts,
                    total: structure.liabilities.nonCurrent.total
                },
                totalLiabilities: structure.liabilities.total
            },
            equity: {
                label: "Equity",
                items: structure.equity.accounts,
                total: structure.equity.total
            },
            totalLiabilitiesAndEquity: totalLiabilitiesAndEquity
        }
    };
}


// Named exports for constants

// ============================================
// FIXED ASSETS MANAGEMENT
// ============================================

/**
 * Creates a new Fixed Asset and records the purchase journal entry
 */
/**
 * Creates a new Fixed Asset and records the purchase journal entry
 */
export async function createFixedAsset(tenantId, userId, assetData) {
    const {
        name,
        category,
        assetAccountId,
        serialNumber,
        familyOwnerId,
        purchaseDate,
        purchasePrice,
        quantity,      // NEW
        unitCost,      // NEW
        paidFromAccountId,
        financeAccountId,
        financePortion,
        vendor,
        trackWarranty,
        warrantyExpiry,
        isDepreciating,
        lifespanYears,
        salvageValue,
        notes,
        photoUrl
    } = assetData;

    const price = Number(purchasePrice);
    const financeAmt = Number(financePortion || 0);
    // cashAmt is implicitly price - financeAmt if we trust the frontend, or calculate it:
    const cashAmt = price - financeAmt;

    // 1. Create the Journal Entry for Purchase
    const journalLines = [];

    // [DEBIT] Asset Account (Increase Assets) - Full Value
    journalLines.push({
        accountId: assetAccountId,
        debit: price,
        credit: 0,
        description: `Purchase Asset: ${name}`
    });

    // [CREDIT] Payment Account (Decrease Cash)
    if (cashAmt > 0 && paidFromAccountId) {
        journalLines.push({
            accountId: paidFromAccountId,
            debit: 0,
            credit: cashAmt,
            description: `Payment for ${name}`
        });
    }

    // [CREDIT] Liability Account (Increase Debt)
    if (financeAmt > 0 && financeAccountId) {
        journalLines.push({
            accountId: financeAccountId,
            debit: 0,
            credit: financeAmt,
            description: `Loan for ${name}`
        });
    }

    // Create the Journal
    const journal = await prisma.journal.create({
        data: {
            tenantId,
            date: new Date(purchaseDate),
            description: `Asset Purchase: ${name}`,
            status: 'POSTED',
            createdById: userId,
            lines: {
                create: journalLines
            }
        }
    });

    // 2. Create the Fixed Asset Record
    const fixedAsset = await prisma.fixedAsset.create({
        data: {
            tenantId,
            name,
            category,
            assetAccountId,
            serialNumber,
            familyOwnerId,
            purchaseDate: new Date(purchaseDate),
            purchasePrice: price,
            quantity: quantity ? Number(quantity) : 1,
            unitCost: unitCost ? Number(unitCost) : price,
            currentValue: price, // Initially equals purchase price
            paidFromAccountId,
            financeAccountId,
            cashPortion: cashAmt,
            financePortion: financeAmt,
            vendor,
            trackWarranty: !!trackWarranty,
            warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
            isDepreciating: !!isDepreciating,
            lifespanYears: lifespanYears ? Number(lifespanYears) : null,
            salvageValue: salvageValue ? Number(salvageValue) : 0,
            notes,
            photoUrl,
            status: 'ACTIVE',
            createdById: userId,
            purchaseJournalId: journal.id
        }
    });

    return fixedAsset;
}

/**
 * Updates the value of an asset (Depreciation)
 */
export async function depreciateAsset(tenantId, userId, assetId, newValue) {
    const asset = await prisma.fixedAsset.findUnique({
        where: { id: assetId },
        include: { assetAccount: true }
    });

    if (!asset) throw new Error("Asset not found");

    const currentValue = Number(asset.currentValue);
    const updatedValue = Number(newValue);
    const depreciationAmount = currentValue - updatedValue;

    if (depreciationAmount <= 0) {
        // If value increased (Appreciation) or stayed same - different logic?
        // For now, strict depreciation or market adjustment
        if (asset.assetAccount.code.startsWith('16')) {
            // MARKET VALUE ADJUSTMENT (Investments)
            // We can allow "Negative Depreciation" (Gain)
        } else {
            throw new Error("New value must be lower than current value for depreciation");
        }
    }

    // 1. Determine Accounts using THE BRAIN (ASSET_LOGIC_CONFIG)
    const assetCode = asset.assetAccount.code;
    // Fallback if specific code not in config, check range or default
    const config = ASSET_LOGIC_CONFIG[assetCode] ||
        Object.values(ASSET_LOGIC_CONFIG).find(c => assetCode.startsWith(Object.keys(c)[0]?.substring(0, 2))) || // fuzzy
        { contraAccount: '1799', expenseAccount: '6900' };

    let expenseCode = config.expenseAccount || '6900';
    let contraCode = config.contraAccount || '1799'; // 1799 is catch-all accum dep

    // Find the actual Account IDs
    const expenseAccount = await prisma.account.findFirst({
        where: { tenantId, code: expenseCode }
    });

    const accumDepAccount = await prisma.account.findFirst({
        where: { tenantId, code: contraCode }
    });

    // Check if we found them
    if (!expenseAccount || !accumDepAccount) {
        console.warn(`[Depreciation] Missing accounts for code ${assetCode}. Looking for Exp: ${expenseCode}, Contra: ${contraCode}`);
        // throw new Error(`Depreciation accounts missing. Need ${expenseCode} and ${contraCode}`);
    }

    // 2. Create Depreciation Journal Entry
    // Note: If depreciationAmount is negative (Gain), we swap keys or use different accounts?
    // For simpler MVP, we treat this as pure Depreciation (Expense/Contra)
    const lines = [];

    if (depreciationAmount > 0) {
        // Normal Depreciation
        lines.push({
            accountId: expenseAccount.id,
            debit: depreciationAmount,
            credit: 0,
            description: `Depreciation Expense for ${asset.name}`
        });
        lines.push({
            accountId: accumDepAccount.id,
            debit: 0,
            credit: depreciationAmount,
            description: `Accum. Depr for ${asset.name}`
        });
    } else {
        // Appreciation (Gain) - e.g. for Investments
        const gainAmount = Math.abs(depreciationAmount);
        const gainAccount = await prisma.account.findFirst({ where: { tenantId, code: '4200' } }); // Unrealized Gain

        if (gainAccount) {
            lines.push({
                accountId: asset.assetAccountId, // Increase Asset value directly for investments (or use contra?)
                debit: gainAmount,
                credit: 0,
                description: `Market Value Increase: ${asset.name}`
            });
            lines.push({
                accountId: gainAccount.id,
                credit: gainAmount,
                debit: 0,
                description: `Unrealized Gain: ${asset.name}`
            });
        }
    }

    const journal = await prisma.journal.create({
        data: {
            tenantId,
            date: new Date(),
            description: `Value Adjustment: ${asset.name}`,
            status: 'POSTED',
            createdById: userId,
            lines: { create: lines }
        }
    });

    // 3. Update Asset Record
    const updatedAsset = await prisma.fixedAsset.update({
        where: { id: assetId },
        data: {
            currentValue: updatedValue,
            totalDepreciation: { increment: depreciationAmount }, // Net change
            accumDepAccountId: accumDepAccount?.id,
            depreciationExpAccId: expenseAccount?.id
        }
    });

    // 4. Record History
    await prisma.assetDepreciation.create({
        data: {
            fixedAssetId: assetId,
            date: new Date(),
            previousValue: currentValue,
            newValue: updatedValue,
            depreciationAmt: depreciationAmount,
            journalId: journal.id,
            notes: `Manual value update via Master Logic`
        }
    });

    return updatedAsset;
}

/**
 * Disposes an asset (Sell or Write-off)
 */
export async function disposeAsset(tenantId, userId, assetId, disposalData) {
    const { disposalPrice, disposalAccountId, date } = disposalData;

    const asset = await prisma.fixedAsset.findUnique({
        where: { id: assetId }
    });

    if (!asset) throw new Error("Asset not found");

    const salePrice = Number(disposalPrice || 0);
    const currentValue = Number(asset.currentValue);
    const originalCost = Number(asset.purchasePrice);
    const accumulatedDep = Number(asset.totalDepreciation);

    const profitOrLoss = salePrice - currentValue;
    const isProfit = profitOrLoss >= 0;
    const gainLossAmount = Math.abs(profitOrLoss);

    // Find Gain/Loss Accounts
    const gainAccount = await prisma.account.findFirst({ where: { tenantId, code: '4300' } }); // Gain on Disposal (Income)
    const lossAccount = await prisma.account.findFirst({ where: { tenantId, code: '6800' } }); // Loss on Disposal (Expense)

    // Find Accum Dep Account
    let accumDepAccountId = asset.accumDepAccountId;
    if (!accumDepAccountId) {
        // Fallback if not set (re-calculate or find default)
        const assetAccount = await prisma.account.findUnique({ where: { id: asset.assetAccountId } });
        let accumDepCode = '1799';
        if (assetAccount) {
            if (assetAccount.code.startsWith('151')) accumDepCode = '1710';
            else if (assetAccount.code.startsWith('152')) accumDepCode = '1721';
            else if (assetAccount.code.startsWith('153')) accumDepCode = '1730';
            else if (assetAccount.code.startsWith('154') || assetAccount.code.startsWith('155')) accumDepCode = '1740';
            else if (assetAccount.code.startsWith('157')) accumDepCode = '1770';
        }
        const found = await prisma.account.findFirst({ where: { tenantId, code: accumDepCode } });
        if (found) accumDepAccountId = found.id;
    }

    const journalLines = [];

    // 1. [DEBIT] Cash/Bank (Money In)
    if (salePrice > 0 && disposalAccountId) {
        journalLines.push({
            accountId: disposalAccountId,
            debit: salePrice,
            credit: 0,
            description: `Sale proceeds: ${asset.name}`
        });
    }

    // 2. [DEBIT] Accumulated Depreciation (Remove from Contra Asset to clear it)
    if (accumulatedDep > 0 && accumDepAccountId) {
        journalLines.push({
            accountId: accumDepAccountId,
            debit: accumulatedDep,
            credit: 0,
            description: `Clear Accum. Depr: ${asset.name}`
        });
    }

    // 3. [CREDIT] Fixed Asset Account (Remove Original Cost)
    journalLines.push({
        accountId: asset.assetAccountId,
        debit: 0,
        credit: originalCost,
        description: `Remove Asset Cost: ${asset.name}`
    });

    // 4. Record Gain or Loss (Balancing figure)
    if (isProfit && gainLossAmount > 0 && gainAccount) {
        // [CREDIT] Gain (Income)
        journalLines.push({
            accountId: gainAccount.id,
            debit: 0,
            credit: gainLossAmount,
            description: `Gain on Disposal: ${asset.name}`
        });
    } else if (!isProfit && gainLossAmount > 0 && lossAccount) {
        // [DEBIT] Loss (Expense)
        journalLines.push({
            accountId: lossAccount.id,
            debit: gainLossAmount,
            credit: 0,
            description: `Loss on Disposal: ${asset.name}`
        });
    }

    // Determine disposal type (Sold if price > 0, Written off/Given away if 0)
    const disposalType = salePrice > 0 ? 'SOLD' : 'WRITTEN_OFF';

    const journal = await prisma.journal.create({
        data: {
            tenantId,
            date: new Date(date),
            description: `Asset Disposal: ${asset.name} (${disposalType})`,
            status: 'POSTED',
            createdById: userId,
            lines: { create: journalLines }
        }
    });

    const updatedAsset = await prisma.fixedAsset.update({
        where: { id: assetId },
        data: {
            status: disposalType,
            disposalDate: new Date(date),
            disposalPrice: salePrice,
            disposalAccountId: disposalAccountId,
            currentValue: 0 // Value is now 0 to the family
        }
    });

    return updatedAsset;
}



// ============================================
// MASTER ASSET LOGIC (THE BRAIN)
// ============================================
const ASSET_LOGIC_CONFIG = {
    // TYPE A: VEHICLES (1510, 1511)
    "1510": { label: "Number Plate", showSerial: true, showWarranty: true, depreciation: "YES", contraAccount: "1710", expenseAccount: "6910" },
    "1511": { label: "Number Plate", showSerial: true, showWarranty: true, depreciation: "YES", contraAccount: "1710", expenseAccount: "6910" },

    // TYPE B: LAND & REAL ESTATE (1520, 1523)
    "1520": { label: "Title Deed / LR No", showSerial: true, showWarranty: false, depreciation: "NO", contraAccount: null },
    "1523": { label: "Project Name", showSerial: false, showWarranty: false, depreciation: "NO", contraAccount: null },

    // TYPE C: BUILDINGS (1521, 1522)
    "1521": { label: "Title Deed / LR No", showSerial: true, showWarranty: false, depreciation: "YES", contraAccount: "1721", expenseAccount: "6920" },
    "1522": { label: "Title Deed / LR No", showSerial: true, showWarranty: false, depreciation: "YES", contraAccount: "1721", expenseAccount: "6920" },

    // TYPE D: ELECTRONICS & FURNITURE (1530-1560)
    "1530": { label: "Tag / ID Number", showSerial: true, showWarranty: true, depreciation: "YES", contraAccount: "1730", expenseAccount: "6930" }, // Furniture
    "1540": { label: "Serial Number", showSerial: true, showWarranty: true, depreciation: "YES", contraAccount: "1740", expenseAccount: "6940" }, // Computers
    "1550": { label: "IMEI / Serial", showSerial: true, showWarranty: true, depreciation: "YES", contraAccount: "1740", expenseAccount: "6940" }, // Phones
    "1560": { label: "Serial Number", showSerial: true, showWarranty: true, depreciation: "YES", contraAccount: "1740", expenseAccount: "6940" }, // Equipment

    // TYPE E: INVESTMENTS & CRYPTO (1610 - 1699)
    "1610": { label: "Member Number", showQty: true, showSerial: true, depreciation: "MARKET", contraAccount: null },
    "1620": { label: "Policy / Account No", showQty: false, showSerial: true, depreciation: "MARKET", contraAccount: null },
    "1640": { label: "CDSC Account No", showQty: true, showSerial: true, depreciation: "MARKET", contraAccount: null },
    "1660": { label: "Wallet Address", showQty: true, showSerial: true, depreciation: "MARKET", contraAccount: null }, // Crypto
    "1699": { label: "Identifier", showQty: false, showSerial: true, depreciation: "NO", contraAccount: null }
};

export default {
    seedFamilyCoA,
    seedFamilyCategories,
    seedFamilyPaymentMethods,
    getAccountMapping,
    resolveAccountIds,
    createJournalEntry,
    voidJournalEntry,
    getAccountBalance,
    getAllAccountBalances,
    getTrialBalance,
    getProfitAndLoss,
    getCashFlow,
    getBalanceSheet,
    createFixedAsset,
    depreciateAsset,
    disposeAsset,
    ASSET_LOGIC_CONFIG
};
