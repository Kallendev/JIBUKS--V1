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
    // Organized by:
    // - Current Assets (1000-1399) - Liquid within 1 year
    // - Fixed Assets (1400-1599) - Long-term tangible assets
    // - Investments (1600-1699) - Long-term financial assets
    // - Contra-Assets (1700-1799) - Accumulated depreciation
    //
    // SUBTYPES:
    // - cash: Physical cash
    // - bank: Bank accounts
    // - mobile_money: M-PESA, Airtel Money
    // - sacco: Sacco FOSA accounts
    // - online_wallet: PayPal, Wise
    // - accounts_receivable: Customer receivables
    // - other_receivable: Deposits, prepayments
    // - inventory: Stock for sale
    // - fixed_asset_vehicles: Cars, motorcycles
    // - fixed_asset_property: Land, buildings
    // - fixed_asset_equipment: Machinery, electronics
    // - fixed_asset_furniture: Office/home furniture
    // - investment: Stocks, bonds, funds
    // - contra_asset: Accumulated depreciation

    // ============================================
    // ASSETS (1000-1999)
    // ============================================

    // ----------------------------------------
    // 1. CURRENT ASSETS (1000-1399)
    // ----------------------------------------

    // ----------------------------------------
    // CASH & CASH EQUIVALENTS (1000-1099)
    // ----------------------------------------
    { code: '1000', name: 'Cash & Cash Equivalents', type: 'ASSET', description: 'Total physical cash and equivalents', isSystem: true, isContra: false, subtype: 'cash', isParent: true },

    // Physical Cash (1001-1009)
    { code: '1001', name: 'Cash on Hand (Wallet)', type: 'ASSET', description: 'Physical cash carried daily', isSystem: true, isContra: false, isPaymentEligible: true, subtype: 'cash', systemTag: 'CASH', parentCode: '1000' },
    { code: '1002', name: 'Petty Cash (Home Safe)', type: 'ASSET', description: 'Emergency cash kept at home', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'cash', parentCode: '1000' },
    { code: '1003', name: 'Petty Cash (Office)', type: 'ASSET', description: 'Small office expenses cash', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'cash', parentCode: '1000' },
    { code: '1004', name: 'Cash Register', type: 'ASSET', description: 'Shop/business till cash', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'cash', parentCode: '1000' },
    { code: '1005', name: 'Undeposited Funds', type: 'ASSET', description: 'Cash received not yet banked', isSystem: true, isContra: false, subtype: 'cash', parentCode: '1000' },

    // Bank Accounts (1010-1049)
    { code: '1010', name: 'Commercial Bank Accounts', type: 'ASSET', description: 'Total holdings in commercial banks', isSystem: true, isContra: false, subtype: 'bank', isParent: true },

    // Tier 1 Banks
    { code: '1011', name: 'Equity Bank', type: 'ASSET', description: 'Tier 1 Bank', isSystem: true, isContra: false, isPaymentEligible: true, subtype: 'bank', systemTag: 'BANK', parentCode: '1010' },
    { code: '1012', name: 'KCB Bank', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },
    { code: '1013', name: 'Co-operative Bank', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },
    { code: '1014', name: 'NCBA Bank', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },
    { code: '1015', name: 'Standard Chartered', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },
    { code: '1016', name: 'Absa Bank', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },
    { code: '1017', name: 'I&M Bank', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },
    { code: '1018', name: 'DTB (Diamond Trust)', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },
    { code: '1019', name: 'Stanbic Bank', type: 'ASSET', description: 'Tier 1 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },
    // Tier 2 Banks
    { code: '1020', name: 'Family Bank', type: 'ASSET', description: 'Tier 2 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },
    { code: '1021', name: 'Kingdom Bank', type: 'ASSET', description: 'Tier 2 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },
    { code: '1022', name: 'Postbank', type: 'ASSET', description: 'Tier 2 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },
    { code: '1023', name: 'Credit Bank', type: 'ASSET', description: 'Tier 2 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },
    { code: '1024', name: 'Bank of Africa', type: 'ASSET', description: 'Tier 2 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },
    { code: '1025', name: 'Prime Bank', type: 'ASSET', description: 'Tier 2 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },
    { code: '1026', name: 'HFC (Housing Finance)', type: 'ASSET', description: 'Tier 2 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },
    { code: '1027', name: 'Sidian Bank', type: 'ASSET', description: 'Tier 2 Bank', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'bank', parentCode: '1010' },

    // Mobile Money (1050-1069)
    { code: '1050', name: 'Mobile Money Wallets', type: 'ASSET', description: 'Total mobile money holdings', isSystem: true, isContra: false, subtype: 'mobile_money', isParent: true },
    { code: '1051', name: 'M-PESA (Personal)', type: 'ASSET', description: 'Main wallet for daily spending', isSystem: true, isContra: false, isPaymentEligible: true, subtype: 'mobile_money', systemTag: 'MPESA', parentCode: '1050' },
    { code: '1052', name: 'M-PESA (Business/Till)', type: 'ASSET', description: 'Side-hustle Till number', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'mobile_money', parentCode: '1050' },
    { code: '1053', name: 'M-Shwari (Savings)', type: 'ASSET', description: 'Locked savings on SIM card', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'mobile_money', parentCode: '1050' },
    { code: '1054', name: 'KCB M-PESA', type: 'ASSET', description: 'Loan/Savings linked to SIM', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'mobile_money', parentCode: '1050' },
    { code: '1055', name: 'Airtel Money', type: 'ASSET', description: 'Alternative mobile wallet', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'mobile_money', parentCode: '1050' },
    { code: '1056', name: 'T-Kash (Telkom)', type: 'ASSET', description: 'Alternative mobile wallet', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'mobile_money', parentCode: '1050' },
    { code: '1057', name: 'Equitel', type: 'ASSET', description: 'Equity Bank mobile money', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'mobile_money', parentCode: '1050' },

    // Sacco FOSA (1070-1089)
    { code: '1070', name: 'Sacco Savings (Withdrawable)', type: 'ASSET', description: 'Total withdrawable Sacco savings', isSystem: true, isContra: false, subtype: 'sacco', isParent: true },
    { code: '1071', name: 'Stima Sacco (FOSA)', type: 'ASSET', description: 'Withdrawable Sacco Savings', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'sacco', parentCode: '1070' },
    { code: '1072', name: 'Mwalimu National (FOSA)', type: 'ASSET', description: 'Teachers Sacco', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'sacco', parentCode: '1070' },
    { code: '1073', name: 'Kenya Police Sacco (FOSA)', type: 'ASSET', description: 'Police Sacco', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'sacco', parentCode: '1070' },
    { code: '1074', name: 'Harambee Sacco (FOSA)', type: 'ASSET', description: 'Government Sacco', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'sacco', parentCode: '1070' },
    { code: '1075', name: 'Hazina Sacco (FOSA)', type: 'ASSET', description: 'Hazina Sacco', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'sacco', parentCode: '1070' },
    { code: '1076', name: 'Unaitas Sacco (FOSA)', type: 'ASSET', description: 'Unaitas Sacco', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'sacco', parentCode: '1070' },
    { code: '1077', name: 'Kenya Bankers Sacco', type: 'ASSET', description: 'Bankers Sacco', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'sacco', parentCode: '1070' },

    // Online Wallets & Crypto (1090-1099)
    { code: '1090', name: 'Digital Wallets & Crypto', type: 'ASSET', description: 'Total digital assets and wallets', isSystem: true, isContra: false, subtype: 'online_wallet', isParent: true },
    { code: '1091', name: 'PayPal', type: 'ASSET', description: 'For online work/freelancing', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'online_wallet', parentCode: '1090' },
    { code: '1092', name: 'Wise (TransferWise)', type: 'ASSET', description: 'For international transfers', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'online_wallet', parentCode: '1090' },
    { code: '1093', name: 'Skrill', type: 'ASSET', description: 'Online payment wallet', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'online_wallet', parentCode: '1090' },
    { code: '1094', name: 'Payoneer', type: 'ASSET', description: 'Freelancer payments', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'online_wallet', parentCode: '1090' },
    { code: '1095', name: 'Binance Wallet', type: 'ASSET', description: 'Crypto exchange wallet', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'crypto', parentCode: '1090' },
    { code: '1096', name: 'USDT (Tether)', type: 'ASSET', description: 'Stablecoin holdings', isSystem: false, isContra: false, isPaymentEligible: false, subtype: 'crypto', parentCode: '1090' },

    // ----------------------------------------
    // ACCOUNTS RECEIVABLE (1100-1149)
    // ----------------------------------------
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET', description: 'Money owed by customers - Control', isSystem: true, isContra: false, subtype: 'accounts_receivable', isParent: true, systemTag: 'AR' },
    { code: '1101', name: 'Trade Receivables', type: 'ASSET', description: 'Customer invoices unpaid', isSystem: true, isContra: false, subtype: 'accounts_receivable', parentCode: '1100' },
    { code: '1102', name: 'Credit Sales Receivable', type: 'ASSET', description: 'Goods sold on credit', isSystem: false, isContra: false, subtype: 'accounts_receivable', parentCode: '1100' },
    { code: '1103', name: 'Service Receivables', type: 'ASSET', description: 'Services rendered, not paid', isSystem: false, isContra: false, subtype: 'accounts_receivable', parentCode: '1100' },
    { code: '1110', name: 'Allowance for Doubtful Debts', type: 'ASSET', description: 'Provision for bad debts', isSystem: true, isContra: true, subtype: 'contra_receivable', parentCode: '1100' },

    // ----------------------------------------
    // OTHER RECEIVABLES (1150-1199)
    // ----------------------------------------
    { code: '1150', name: 'Other Receivables', type: 'ASSET', description: 'Other amounts owed - Control', isSystem: true, isContra: false, subtype: 'other_receivable', isParent: true },
    { code: '1151', name: 'Loans to Friends/Family', type: 'ASSET', description: 'Money lent to individuals', isSystem: true, isContra: false, subtype: 'other_receivable', parentCode: '1150' },
    { code: '1152', name: 'Staff Loans & Advances', type: 'ASSET', description: 'Salary advances to employees', isSystem: false, isContra: false, subtype: 'other_receivable', parentCode: '1150' },
    { code: '1153', name: 'Salary Arrears', type: 'ASSET', description: 'Work done but not paid yet', isSystem: false, isContra: false, subtype: 'other_receivable', parentCode: '1150' },
    { code: '1154', name: 'Rent Security Deposits', type: 'ASSET', description: 'Refundable deposit with landlord', isSystem: false, isContra: false, subtype: 'other_receivable', parentCode: '1150' },
    { code: '1155', name: 'Utility Deposits', type: 'ASSET', description: 'Deposit with Kenya Power/Water', isSystem: false, isContra: false, subtype: 'other_receivable', parentCode: '1150' },
    { code: '1156', name: 'Insurance Deposits', type: 'ASSET', description: 'Refundable insurance deposits', isSystem: false, isContra: false, subtype: 'other_receivable', parentCode: '1150' },
    { code: '1157', name: 'VAT Receivable (Input VAT)', type: 'ASSET', description: 'VAT paid on purchases - 16%', isSystem: true, isContra: false, subtype: 'tax_receivable', parentCode: '1150' },
    { code: '1158', name: 'WHT Receivable', type: 'ASSET', description: 'Withholding tax to claim', isSystem: false, isContra: false, subtype: 'tax_receivable', parentCode: '1150' },
    { code: '1159', name: 'Prepaid Expenses', type: 'ASSET', description: 'Services paid in advance', isSystem: false, isContra: false, subtype: 'prepayment', parentCode: '1150' },
    { code: '1160', name: 'Prepaid Rent', type: 'ASSET', description: 'Rent paid in advance', isSystem: false, isContra: false, subtype: 'prepayment', parentCode: '1150' },
    { code: '1161', name: 'Prepaid Insurance', type: 'ASSET', description: 'Insurance paid in advance', isSystem: false, isContra: false, subtype: 'prepayment', parentCode: '1150' },

    // ----------------------------------------
    // INVENTORY (1200-1299)
    // ----------------------------------------
    { code: '1200', name: 'Inventory (Stock on Hand)', type: 'ASSET', description: 'Total value of all stock available for sale', isSystem: true, isContra: false, subtype: 'inventory', isParent: true },

    // Merchandise Inventory
    { code: '1201', name: 'Stock for Resale', type: 'ASSET', description: 'Goods purchased for resale - Main inventory account', isSystem: true, isContra: false, subtype: 'inventory', parentCode: '1200' },
    { code: '1202', name: 'Finished Goods (Ready to Sell)', type: 'ASSET', description: 'Manufactured products ready for sale', isSystem: false, isContra: false, subtype: 'inventory', parentCode: '1200' },
    { code: '1203', name: 'Work in Progress (WIP)', type: 'ASSET', description: 'Partially completed products being manufactured', isSystem: false, isContra: false, subtype: 'inventory_wip', parentCode: '1200' },
    { code: '1204', name: 'Raw Materials (Production)', type: 'ASSET', description: 'Materials for manufacturing', isSystem: false, isContra: false, subtype: 'inventory_raw', parentCode: '1200' },
    { code: '1205', name: 'Packaging Materials (Stock)', type: 'ASSET', description: 'Boxes, bags, labels for products', isSystem: false, isContra: false, subtype: 'inventory_supplies', parentCode: '1200' },
    { code: '1206', name: 'Office Supplies (Stock)', type: 'ASSET', description: 'Office/shop supplies inventory', isSystem: false, isContra: false, subtype: 'inventory_supplies', parentCode: '1200' },
    { code: '1207', name: 'Fuel Stock (Inventory)', type: 'ASSET', description: 'Fuel stock (petrol stations)', isSystem: false, isContra: false, subtype: 'inventory', parentCode: '1200' },
    { code: '1208', name: 'Spare Parts (Stock)', type: 'ASSET', description: 'Auto parts, machine parts inventory', isSystem: false, isContra: false, subtype: 'inventory', parentCode: '1200' },
    { code: '1209', name: 'Food & Beverage Stock', type: 'ASSET', description: 'Restaurant/bar stock inventory', isSystem: false, isContra: false, subtype: 'inventory', parentCode: '1200' },
    { code: '1210', name: 'Stock in Transit (Incoming)', type: 'ASSET', description: 'Goods shipped, not yet received', isSystem: false, isContra: false, subtype: 'inventory', parentCode: '1200' },
    { code: '1220', name: 'Inventory Reserve (Provision)', type: 'ASSET', description: 'Provision for obsolete or damaged stock', isSystem: true, isContra: true, subtype: 'contra_inventory', parentCode: '1200' },

    // ========================================
    // FIXED ASSETS (1300-1599)
    // ========================================

    // Property, Plant & Equipment Control
    { code: '1300', name: 'Fixed Assets', type: 'ASSET', description: 'Property, Plant & Equipment - Control', isSystem: true, isContra: false, subtype: 'fixed_asset', isParent: true },

    // ----------------------------------------
    // LAND & BUILDINGS (1310-1349)
    // ----------------------------------------
    { code: '1310', name: 'Land & Buildings', type: 'ASSET', description: 'Real estate assets - Control', isSystem: true, isContra: false, subtype: 'fixed_asset_property', isParent: true, parentCode: '1300' },
    { code: '1311', name: 'Land (Freehold)', type: 'ASSET', description: 'Land - Does not depreciate', isSystem: false, isContra: false, subtype: 'fixed_asset_property', parentCode: '1310' },
    { code: '1312', name: 'Land (Leasehold)', type: 'ASSET', description: 'Leased land - Amortizes', isSystem: false, isContra: false, subtype: 'fixed_asset_property', parentCode: '1310' },
    { code: '1313', name: 'Residential Buildings', type: 'ASSET', description: 'House/home structure', isSystem: false, isContra: false, subtype: 'fixed_asset_property', parentCode: '1310' },
    { code: '1314', name: 'Commercial Buildings', type: 'ASSET', description: 'Office/shop buildings', isSystem: false, isContra: false, subtype: 'fixed_asset_property', parentCode: '1310' },
    { code: '1315', name: 'Rental Properties', type: 'ASSET', description: 'Apartments for rent', isSystem: false, isContra: false, subtype: 'fixed_asset_property', parentCode: '1310' },
    { code: '1316', name: 'Farm/Agricultural Land', type: 'ASSET', description: 'Farming land', isSystem: false, isContra: false, subtype: 'fixed_asset_property', parentCode: '1310' },
    { code: '1317', name: 'Construction WIP', type: 'ASSET', description: 'Building under construction', isSystem: false, isContra: false, subtype: 'fixed_asset_wip', parentCode: '1310' },
    { code: '1318', name: 'Land Improvements', type: 'ASSET', description: 'Fencing, landscaping, paving', isSystem: false, isContra: false, subtype: 'fixed_asset_property', parentCode: '1310' },
    { code: '1319', name: 'Accum. Depr - Buildings', type: 'ASSET', description: 'Buildings depreciation', isSystem: true, isContra: true, subtype: 'contra_asset', parentCode: '1310' },

    // ----------------------------------------
    // VEHICLES & TRANSPORT (1350-1389)
    // ----------------------------------------
    { code: '1350', name: 'Vehicles & Transport', type: 'ASSET', description: 'Transport assets - Control', isSystem: true, isContra: false, subtype: 'fixed_asset_vehicles', isParent: true, parentCode: '1300' },
    { code: '1351', name: 'Motor Vehicles - Cars', type: 'ASSET', description: 'Personal/company cars', isSystem: false, isContra: false, subtype: 'fixed_asset_vehicles', parentCode: '1350' },
    { code: '1352', name: 'Motor Vehicles - SUVs', type: 'ASSET', description: 'SUVs, 4x4 vehicles', isSystem: false, isContra: false, subtype: 'fixed_asset_vehicles', parentCode: '1350' },
    { code: '1353', name: 'Trucks & Lorries', type: 'ASSET', description: 'Commercial trucks', isSystem: false, isContra: false, subtype: 'fixed_asset_vehicles', parentCode: '1350' },
    { code: '1354', name: 'Buses & Matatus', type: 'ASSET', description: 'PSV vehicles', isSystem: false, isContra: false, subtype: 'fixed_asset_vehicles', parentCode: '1350' },
    { code: '1355', name: 'Motorcycles / Boda', type: 'ASSET', description: 'Motorbikes, scooters', isSystem: false, isContra: false, subtype: 'fixed_asset_vehicles', parentCode: '1350' },
    { code: '1356', name: 'Trailers', type: 'ASSET', description: 'Cargo trailers', isSystem: false, isContra: false, subtype: 'fixed_asset_vehicles', parentCode: '1350' },
    { code: '1357', name: 'Boats & Water Vessels', type: 'ASSET', description: 'Boats, fishing vessels', isSystem: false, isContra: false, subtype: 'fixed_asset_vehicles', parentCode: '1350' },
    { code: '1359', name: 'Accum. Depr - Vehicles', type: 'ASSET', description: 'Vehicle depreciation', isSystem: true, isContra: true, subtype: 'contra_asset', parentCode: '1350' },

    // ----------------------------------------
    // FURNITURE & FIXTURES (1390-1419)
    // ----------------------------------------
    { code: '1390', name: 'Furniture & Fixtures', type: 'ASSET', description: 'Furniture assets - Control', isSystem: true, isContra: false, subtype: 'fixed_asset_furniture', isParent: true, parentCode: '1300' },
    { code: '1391', name: 'Office Furniture', type: 'ASSET', description: 'Desks, chairs, cabinets', isSystem: false, isContra: false, subtype: 'fixed_asset_furniture', parentCode: '1390' },
    { code: '1392', name: 'Home Furniture', type: 'ASSET', description: 'Sofas, beds, tables', isSystem: false, isContra: false, subtype: 'fixed_asset_furniture', parentCode: '1390' },
    { code: '1393', name: 'Shop Fittings', type: 'ASSET', description: 'Display units, shelving', isSystem: false, isContra: false, subtype: 'fixed_asset_furniture', parentCode: '1390' },
    { code: '1394', name: 'Restaurant Furniture', type: 'ASSET', description: 'Tables, chairs, counters', isSystem: false, isContra: false, subtype: 'fixed_asset_furniture', parentCode: '1390' },
    { code: '1399', name: 'Accum. Depr - Furniture', type: 'ASSET', description: 'Furniture depreciation', isSystem: true, isContra: true, subtype: 'contra_asset', parentCode: '1390' },

    // ----------------------------------------
    // EQUIPMENT & MACHINERY (1420-1469)
    // ----------------------------------------
    { code: '1420', name: 'Equipment & Machinery', type: 'ASSET', description: 'Equipment assets - Control', isSystem: true, isContra: false, subtype: 'fixed_asset_equipment', isParent: true, parentCode: '1300' },
    { code: '1421', name: 'Computer Equipment', type: 'ASSET', description: 'Laptops, desktops, servers', isSystem: false, isContra: false, subtype: 'fixed_asset_equipment', parentCode: '1420' },
    { code: '1422', name: 'Mobile Phones & Tablets', type: 'ASSET', description: 'High-value phones', isSystem: false, isContra: false, subtype: 'fixed_asset_equipment', parentCode: '1420' },
    { code: '1423', name: 'Printers & Copiers', type: 'ASSET', description: 'Office printing equipment', isSystem: false, isContra: false, subtype: 'fixed_asset_equipment', parentCode: '1420' },
    { code: '1424', name: 'Home Appliances', type: 'ASSET', description: 'Fridges, washing machines', isSystem: false, isContra: false, subtype: 'fixed_asset_equipment', parentCode: '1420' },
    { code: '1425', name: 'Kitchen Equipment', type: 'ASSET', description: 'Commercial kitchen equipment', isSystem: false, isContra: false, subtype: 'fixed_asset_equipment', parentCode: '1420' },
    { code: '1426', name: 'Farm Machinery', type: 'ASSET', description: 'Tractors, water pumps', isSystem: false, isContra: false, subtype: 'fixed_asset_equipment', parentCode: '1420' },
    { code: '1427', name: 'Manufacturing Equipment', type: 'ASSET', description: 'Factory machines', isSystem: false, isContra: false, subtype: 'fixed_asset_equipment', parentCode: '1420' },
    { code: '1428', name: 'Medical Equipment', type: 'ASSET', description: 'Clinic/hospital equipment', isSystem: false, isContra: false, subtype: 'fixed_asset_equipment', parentCode: '1420' },
    { code: '1429', name: 'Salon/Spa Equipment', type: 'ASSET', description: 'Beauty equipment', isSystem: false, isContra: false, subtype: 'fixed_asset_equipment', parentCode: '1420' },
    { code: '1430', name: 'Security Equipment', type: 'ASSET', description: 'CCTV, alarms, safes', isSystem: false, isContra: false, subtype: 'fixed_asset_equipment', parentCode: '1420' },
    { code: '1431', name: 'Audio/Visual Equipment', type: 'ASSET', description: 'Speakers, projectors, TVs', isSystem: false, isContra: false, subtype: 'fixed_asset_equipment', parentCode: '1420' },
    { code: '1432', name: 'Power Equipment', type: 'ASSET', description: 'Generators, solar panels', isSystem: false, isContra: false, subtype: 'fixed_asset_equipment', parentCode: '1420' },
    { code: '1439', name: 'Accum. Depr - Equipment', type: 'ASSET', description: 'Equipment depreciation', isSystem: true, isContra: true, subtype: 'contra_asset', parentCode: '1420' },

    // ----------------------------------------
    // OTHER FIXED ASSETS (1470-1499)
    // ----------------------------------------
    { code: '1470', name: 'Other Fixed Assets', type: 'ASSET', description: 'Miscellaneous assets - Control', isSystem: true, isContra: false, subtype: 'fixed_asset_other', isParent: true, parentCode: '1300' },
    { code: '1471', name: 'Jewelry & Precious Metals', type: 'ASSET', description: 'Gold, silver, diamonds', isSystem: false, isContra: false, subtype: 'fixed_asset_other', parentCode: '1470' },
    { code: '1472', name: 'Art & Collectibles', type: 'ASSET', description: 'Paintings, antiques', isSystem: false, isContra: false, subtype: 'fixed_asset_other', parentCode: '1470' },
    { code: '1473', name: 'Livestock', type: 'ASSET', description: 'Cows, goats, chickens', isSystem: false, isContra: false, subtype: 'biological_asset', parentCode: '1470' },
    { code: '1474', name: 'Trees & Plantations', type: 'ASSET', description: 'Timber, fruit trees', isSystem: false, isContra: false, subtype: 'biological_asset', parentCode: '1470' },
    { code: '1475', name: 'Intangible Assets', type: 'ASSET', description: 'Software, patents, licenses', isSystem: false, isContra: false, subtype: 'intangible', parentCode: '1470' },
    { code: '1476', name: 'Goodwill', type: 'ASSET', description: 'Business acquisition premium', isSystem: false, isContra: false, subtype: 'intangible', parentCode: '1470' },
    { code: '1479', name: 'Accum. Amort - Intangibles', type: 'ASSET', description: 'Intangible amortization', isSystem: true, isContra: true, subtype: 'contra_asset', parentCode: '1470' },

    // ========================================
    // INVESTMENTS (1500-1599)
    // ========================================
    { code: '1500', name: 'Long-Term Investments', type: 'ASSET', description: 'Investment assets - Control', isSystem: true, isContra: false, subtype: 'investment', isParent: true },
    { code: '1501', name: 'Sacco Shares (BOSA)', type: 'ASSET', description: 'Non-withdrawable shares', isSystem: false, isContra: false, subtype: 'investment', parentCode: '1500' },
    { code: '1502', name: 'Money Market Fund (MMF)', type: 'ASSET', description: 'CIC, Britam, Sanlam funds', isSystem: false, isContra: false, subtype: 'investment', parentCode: '1500' },
    { code: '1503', name: 'Treasury Bonds', type: 'ASSET', description: 'Government bonds', isSystem: false, isContra: false, subtype: 'investment', parentCode: '1500' },
    { code: '1504', name: 'Treasury Bills', type: 'ASSET', description: 'Short-term government securities', isSystem: false, isContra: false, subtype: 'investment', parentCode: '1500' },
    { code: '1505', name: 'NSE Stocks (Kenya)', type: 'ASSET', description: 'Safaricom, Equity shares', isSystem: false, isContra: false, subtype: 'investment', parentCode: '1500' },
    { code: '1506', name: 'Offshore Stocks (US/UK)', type: 'ASSET', description: 'Apple, Tesla, Amazon', isSystem: false, isContra: false, subtype: 'investment', parentCode: '1500' },
    { code: '1507', name: 'Cryptocurrency Holdings', type: 'ASSET', description: 'Bitcoin, Ethereum', isSystem: false, isContra: false, subtype: 'investment', parentCode: '1500' },
    { code: '1508', name: 'Pension Fund (RBA)', type: 'ASSET', description: 'Private retirement savings', isSystem: false, isContra: false, subtype: 'investment', parentCode: '1500' },
    { code: '1509', name: 'Life Insurance (Cash Value)', type: 'ASSET', description: 'Policies with surrender value', isSystem: false, isContra: false, subtype: 'investment', parentCode: '1500' },
    { code: '1510', name: 'Unit Trusts', type: 'ASSET', description: 'Mutual fund units', isSystem: false, isContra: false, subtype: 'investment', parentCode: '1500' },
    { code: '1511', name: 'Corporate Bonds', type: 'ASSET', description: 'Company bonds', isSystem: false, isContra: false, subtype: 'investment', parentCode: '1500' },
    { code: '1512', name: 'Real Estate Investment', type: 'ASSET', description: 'REITs, property funds', isSystem: false, isContra: false, subtype: 'investment', parentCode: '1500' },
    { code: '1513', name: 'Chama/Group Investments', type: 'ASSET', description: 'Investment group shares', isSystem: false, isContra: false, subtype: 'investment', parentCode: '1500' },
    { code: '1514', name: 'Business Investment', type: 'ASSET', description: 'Shares in other businesses', isSystem: false, isContra: false, subtype: 'investment', parentCode: '1500' },

    // Clearing Account
    { code: '1599', name: 'Clearing Account', type: 'ASSET', description: 'Temporary clearing account', isSystem: true, isContra: false, subtype: 'other_asset' },


    // ============================================
    // LIABILITIES (2000-2999)
    // ============================================
    // Organized by:
    // - Current Liabilities (2000-2499) - Due within 1 year
    // - Long-Term Liabilities (2500-2999) - Due after 1 year
    // 
    // SUBTYPES:
    // - accounts_payable: Trade payables to suppliers/vendors
    // - credit_card: Credit card balances
    // - taxes_payable: Government taxes (excluding VAT)
    // - vat_payable: Special VAT/Sales Tax account with unique attributes
    // - payroll_liability: Employee-related payables
    // - loans_current: Short-term loans due within 1 year
    // - deferred_revenue: Unearned income/customer deposits
    // - accrued_expense: Expenses incurred but not yet paid
    // - loans_long_term: Long-term debt obligations
    // - other_liability: Miscellaneous liabilities

    // ----------------------------------------
    // ACCOUNTS PAYABLE (2000-2049)
    // Amounts owed to suppliers and vendors
    // ----------------------------------------
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', description: 'Trade payables - Main control account', isSystem: true, isContra: false, subtype: 'accounts_payable', isParent: true },
    { code: '2001', name: 'Supplier - General', type: 'LIABILITY', description: 'General supplier payables', isSystem: false, isContra: false, subtype: 'accounts_payable', parentCode: '2000' },
    { code: '2002', name: 'Supplier - Inventory', type: 'LIABILITY', description: 'Payables for inventory purchases', isSystem: false, isContra: false, subtype: 'accounts_payable', parentCode: '2000' },
    { code: '2003', name: 'Supplier - Services', type: 'LIABILITY', description: 'Payables for services received', isSystem: false, isContra: false, subtype: 'accounts_payable', parentCode: '2000' },
    { code: '2004', name: 'Supplier - Utilities', type: 'LIABILITY', description: 'Utility bills payable (Kenya Power, Water)', isSystem: false, isContra: false, subtype: 'accounts_payable', parentCode: '2000' },
    { code: '2005', name: 'Supplier - Rent', type: 'LIABILITY', description: 'Rent payable to landlord', isSystem: false, isContra: false, subtype: 'accounts_payable', parentCode: '2000' },
    { code: '2006', name: 'Supplier - Professional Services', type: 'LIABILITY', description: 'Payables to lawyers, accountants, consultants', isSystem: false, isContra: false, subtype: 'accounts_payable', parentCode: '2000' },
    { code: '2007', name: 'Supplier - Insurance', type: 'LIABILITY', description: 'Insurance premiums payable', isSystem: false, isContra: false, subtype: 'accounts_payable', parentCode: '2000' },
    { code: '2008', name: 'Supplier - Maintenance & Repairs', type: 'LIABILITY', description: 'Payables for maintenance services', isSystem: false, isContra: false, subtype: 'accounts_payable', parentCode: '2000' },
    { code: '2009', name: 'Supplier - Marketing & Advertising', type: 'LIABILITY', description: 'Marketing costs payable', isSystem: false, isContra: false, subtype: 'accounts_payable', parentCode: '2000' },
    { code: '2010', name: 'Supplier - Fuel & Transport', type: 'LIABILITY', description: 'Fuel and transportation payables', isSystem: false, isContra: false, subtype: 'accounts_payable', parentCode: '2000' },
    { code: '2011', name: 'Supplier - Subscriptions', type: 'LIABILITY', description: 'Software, media subscriptions payable', isSystem: false, isContra: false, subtype: 'accounts_payable', parentCode: '2000' },
    { code: '2012', name: 'Supplier - Medical', type: 'LIABILITY', description: 'Medical and healthcare payables', isSystem: false, isContra: false, subtype: 'accounts_payable', parentCode: '2000' },

    // ----------------------------------------
    // CREDIT CARDS (2050-2099)
    // Credit card balances and borrowings
    // ----------------------------------------
    { code: '2050', name: 'Credit Cards', type: 'LIABILITY', description: 'Credit card liabilities - Control', isSystem: true, isContra: false, isPaymentEligible: true, subtype: 'credit_card', isParent: true },
    { code: '2051', name: 'Visa Credit Card', type: 'LIABILITY', description: 'Visa card balance', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'credit_card', parentCode: '2050' },
    { code: '2052', name: 'Mastercard', type: 'LIABILITY', description: 'Mastercard balance', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'credit_card', parentCode: '2050' },
    { code: '2053', name: 'American Express', type: 'LIABILITY', description: 'Amex card balance', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'credit_card', parentCode: '2050' },
    { code: '2054', name: 'Store Credit Card', type: 'LIABILITY', description: 'Retail store credit cards', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'credit_card', parentCode: '2050' },
    { code: '2055', name: 'Business Credit Card', type: 'LIABILITY', description: 'Corporate/business credit card', isSystem: false, isContra: false, isPaymentEligible: true, subtype: 'credit_card', parentCode: '2050' },

    // ----------------------------------------
    // TAXES PAYABLE (2100-2199)
    // Government taxes excluding VAT
    // ----------------------------------------
    { code: '2100', name: 'Taxes Payable', type: 'LIABILITY', description: 'Tax liabilities - Control account', isSystem: true, isContra: false, subtype: 'taxes_payable', isParent: true },

    // ==> VAT PAYABLE - SPECIAL ACCOUNT <==
    // This is a UNIQUE account with special attributes for VAT/Sales Tax tracking
    // It has automatic calculation features and is separate from other taxes
    { code: '2110', name: 'VAT Payable (Output VAT)', type: 'LIABILITY', description: 'VAT collected on sales - Standard Rate 16%', isSystem: true, isContra: false, subtype: 'vat_payable', isVatAccount: true, vatRate: 16.0, vatType: 'OUTPUT', parentCode: '2100' },
    { code: '2111', name: 'VAT Payable - Zero Rated', type: 'LIABILITY', description: 'VAT on zero-rated supplies (0%)', isSystem: true, isContra: false, subtype: 'vat_payable', isVatAccount: true, vatRate: 0.0, vatType: 'OUTPUT_ZERO', parentCode: '2100' },
    { code: '2112', name: 'VAT Payable - Exempt', type: 'LIABILITY', description: 'VAT exempt supplies tracking', isSystem: true, isContra: false, subtype: 'vat_payable', isVatAccount: true, vatRate: 0.0, vatType: 'EXEMPT', parentCode: '2100' },

    // Other Tax Payables
    { code: '2120', name: 'Income Tax Payable', type: 'LIABILITY', description: 'Corporate/Business income tax', isSystem: true, isContra: false, subtype: 'taxes_payable', parentCode: '2100' },
    { code: '2121', name: 'Withholding Tax Payable', type: 'LIABILITY', description: 'WHT on payments to suppliers (5%)', isSystem: true, isContra: false, subtype: 'taxes_payable', parentCode: '2100' },
    { code: '2122', name: 'Turnover Tax Payable', type: 'LIABILITY', description: 'TOT for small businesses (1%)', isSystem: true, isContra: false, subtype: 'taxes_payable', parentCode: '2100' },
    { code: '2123', name: 'Excise Duty Payable', type: 'LIABILITY', description: 'Excise tax on specific goods', isSystem: false, isContra: false, subtype: 'taxes_payable', parentCode: '2100' },
    { code: '2124', name: 'Import Duty Payable', type: 'LIABILITY', description: 'Customs duty on imports', isSystem: false, isContra: false, subtype: 'taxes_payable', parentCode: '2100' },
    { code: '2125', name: 'Property Rates Payable', type: 'LIABILITY', description: 'County/municipal property rates', isSystem: false, isContra: false, subtype: 'taxes_payable', parentCode: '2100' },
    { code: '2126', name: 'Digital Service Tax Payable', type: 'LIABILITY', description: 'DST on digital services (1.5%)', isSystem: false, isContra: false, subtype: 'taxes_payable', parentCode: '2100' },
    { code: '2127', name: 'Minimum Tax Payable', type: 'LIABILITY', description: 'Minimum tax on gross turnover', isSystem: false, isContra: false, subtype: 'taxes_payable', parentCode: '2100' },
    { code: '2128', name: 'Capital Gains Tax Payable', type: 'LIABILITY', description: 'CGT on sale of assets (5%)', isSystem: false, isContra: false, subtype: 'taxes_payable', parentCode: '2100' },
    { code: '2129', name: 'Stamp Duty Payable', type: 'LIABILITY', description: 'Stamp duty on documents/transfers', isSystem: false, isContra: false, subtype: 'taxes_payable', parentCode: '2100' },
    { code: '2130', name: 'Presumptive Tax Payable', type: 'LIABILITY', description: 'Tax for matatu/PSV operators', isSystem: false, isContra: false, subtype: 'taxes_payable', parentCode: '2100' },
    { code: '2131', name: 'Rental Income Tax Payable', type: 'LIABILITY', description: 'Tax on rental income (10%)', isSystem: false, isContra: false, subtype: 'taxes_payable', parentCode: '2100' },

    // ----------------------------------------
    // PAYROLL LIABILITIES (2200-2299)
    // Employee-related payables
    // ----------------------------------------
    { code: '2200', name: 'Payroll Liabilities', type: 'LIABILITY', description: 'Employee-related payables - Control', isSystem: true, isContra: false, subtype: 'payroll_liability', isParent: true },
    { code: '2201', name: 'Salaries & Wages Payable', type: 'LIABILITY', description: 'Net salaries owed to employees', isSystem: true, isContra: false, subtype: 'payroll_liability', parentCode: '2200' },
    { code: '2202', name: 'PAYE Payable', type: 'LIABILITY', description: 'Pay As You Earn tax withheld', isSystem: true, isContra: false, subtype: 'payroll_liability', parentCode: '2200' },
    { code: '2203', name: 'NSSF Payable', type: 'LIABILITY', description: 'National Social Security Fund contributions', isSystem: true, isContra: false, subtype: 'payroll_liability', parentCode: '2200' },
    { code: '2204', name: 'NHIF Payable', type: 'LIABILITY', description: 'National Hospital Insurance Fund', isSystem: true, isContra: false, subtype: 'payroll_liability', parentCode: '2200' },
    { code: '2205', name: 'Housing Levy Payable', type: 'LIABILITY', description: 'Affordable Housing Levy (1.5%)', isSystem: true, isContra: false, subtype: 'payroll_liability', parentCode: '2200' },
    { code: '2206', name: 'NITA Levy Payable', type: 'LIABILITY', description: 'National Industrial Training Authority levy', isSystem: true, isContra: false, subtype: 'payroll_liability', parentCode: '2200' },
    { code: '2207', name: 'Pension Fund Contributions Payable', type: 'LIABILITY', description: 'Private pension scheme deductions', isSystem: false, isContra: false, subtype: 'payroll_liability', parentCode: '2200' },
    { code: '2208', name: 'Sacco Deductions Payable', type: 'LIABILITY', description: 'Employee Sacco contributions', isSystem: false, isContra: false, subtype: 'payroll_liability', parentCode: '2200' },
    { code: '2209', name: 'Union Dues Payable', type: 'LIABILITY', description: 'Trade union deductions', isSystem: false, isContra: false, subtype: 'payroll_liability', parentCode: '2200' },
    { code: '2210', name: 'Staff Loans Deductions Payable', type: 'LIABILITY', description: 'Deductions for staff loan repayments', isSystem: false, isContra: false, subtype: 'payroll_liability', parentCode: '2200' },
    { code: '2211', name: 'Bonus & Commissions Payable', type: 'LIABILITY', description: 'Accrued bonuses and commissions', isSystem: false, isContra: false, subtype: 'payroll_liability', parentCode: '2200' },
    { code: '2212', name: 'Leave Accrual Payable', type: 'LIABILITY', description: 'Accrued annual leave liability', isSystem: false, isContra: false, subtype: 'payroll_liability', parentCode: '2200' },
    { code: '2213', name: 'Gratuity Payable', type: 'LIABILITY', description: 'End of contract gratuity accrual', isSystem: false, isContra: false, subtype: 'payroll_liability', parentCode: '2200' },
    { code: '2214', name: 'Severance Payable', type: 'LIABILITY', description: 'Redundancy/severance pay liability', isSystem: false, isContra: false, subtype: 'payroll_liability', parentCode: '2200' },

    // ----------------------------------------
    // SHORT-TERM LOANS (2300-2349)
    // Loans due within 12 months
    // ----------------------------------------
    { code: '2300', name: 'Short-Term Loans', type: 'LIABILITY', description: 'Loans due within 1 year - Control', isSystem: true, isContra: false, subtype: 'loans_current', isParent: true },
    { code: '2301', name: 'Bank Overdraft', type: 'LIABILITY', description: 'Bank overdraft facility', isSystem: true, isContra: false, isPaymentEligible: true, subtype: 'loans_current', parentCode: '2300' },
    { code: '2302', name: 'M-Shwari Loan', type: 'LIABILITY', description: 'M-Shwari mobile money loan', isSystem: false, isContra: false, subtype: 'loans_current', parentCode: '2300' },
    { code: '2303', name: 'Fuliza Overdraft', type: 'LIABILITY', description: 'M-PESA Fuliza overdraft', isSystem: false, isContra: false, subtype: 'loans_current', parentCode: '2300' },
    { code: '2304', name: 'KCB M-PESA Loan', type: 'LIABILITY', description: 'KCB mobile loan facility', isSystem: false, isContra: false, subtype: 'loans_current', parentCode: '2300' },
    { code: '2305', name: 'Tala Loan', type: 'LIABILITY', description: 'Tala digital loan', isSystem: false, isContra: false, subtype: 'loans_current', parentCode: '2300' },
    { code: '2306', name: 'Branch Loan', type: 'LIABILITY', description: 'Branch digital loan', isSystem: false, isContra: false, subtype: 'loans_current', parentCode: '2300' },
    { code: '2307', name: 'Zenka Loan', type: 'LIABILITY', description: 'Zenka mobile loan', isSystem: false, isContra: false, subtype: 'loans_current', parentCode: '2300' },
    { code: '2308', name: 'Hustle Loan', type: 'LIABILITY', description: 'Safaricom Hustle loan', isSystem: false, isContra: false, subtype: 'loans_current', parentCode: '2300' },
    { code: '2309', name: 'Timiza Loan', type: 'LIABILITY', description: 'Absa Timiza mobile loan', isSystem: false, isContra: false, subtype: 'loans_current', parentCode: '2300' },
    { code: '2310', name: 'Family/Friends Loan - Short Term', type: 'LIABILITY', description: 'Informal loans from family/friends', isSystem: false, isContra: false, subtype: 'loans_current', parentCode: '2300' },
    { code: '2311', name: 'Chama/Group Loan', type: 'LIABILITY', description: 'Loan from investment group/chama', isSystem: false, isContra: false, subtype: 'loans_current', parentCode: '2300' },
    { code: '2312', name: 'Short-Term Bank Loan', type: 'LIABILITY', description: 'Bank loan due within 1 year', isSystem: true, isContra: false, subtype: 'loans_current', parentCode: '2300' },
    { code: '2313', name: 'Trade Finance Facility', type: 'LIABILITY', description: 'Short-term trade financing', isSystem: false, isContra: false, subtype: 'loans_current', parentCode: '2300' },
    { code: '2314', name: 'Invoice Financing', type: 'LIABILITY', description: 'Advance against receivables', isSystem: false, isContra: false, subtype: 'loans_current', parentCode: '2300' },
    { code: '2315', name: 'Lipa Later Facility', type: 'LIABILITY', description: 'Buy now pay later obligations', isSystem: false, isContra: false, subtype: 'loans_current', parentCode: '2300' },

    // ----------------------------------------
    // DEFERRED REVENUE (2350-2399)
    // Advance payments and unearned income
    // ----------------------------------------
    { code: '2350', name: 'Deferred Revenue', type: 'LIABILITY', description: 'Unearned income - Control', isSystem: true, isContra: false, subtype: 'deferred_revenue', isParent: true },
    { code: '2351', name: 'Customer Deposits', type: 'LIABILITY', description: 'Advance deposits from customers', isSystem: true, isContra: false, subtype: 'deferred_revenue', parentCode: '2350' },
    { code: '2352', name: 'Unearned Service Revenue', type: 'LIABILITY', description: 'Prepaid services not yet delivered', isSystem: false, isContra: false, subtype: 'deferred_revenue', parentCode: '2350' },
    { code: '2353', name: 'Subscription Revenue Deferred', type: 'LIABILITY', description: 'Prepaid subscription income', isSystem: false, isContra: false, subtype: 'deferred_revenue', parentCode: '2350' },
    { code: '2354', name: 'Rent Received in Advance', type: 'LIABILITY', description: 'Prepaid rent from tenants', isSystem: false, isContra: false, subtype: 'deferred_revenue', parentCode: '2350' },
    { code: '2355', name: 'Insurance Premium Advance', type: 'LIABILITY', description: 'Insurance premiums received in advance', isSystem: false, isContra: false, subtype: 'deferred_revenue', parentCode: '2350' },
    { code: '2356', name: 'Retainer Fees Deferred', type: 'LIABILITY', description: 'Professional retainer fees in advance', isSystem: false, isContra: false, subtype: 'deferred_revenue', parentCode: '2350' },
    { code: '2357', name: 'Gift Card Liability', type: 'LIABILITY', description: 'Unredeemed gift cards/vouchers', isSystem: false, isContra: false, subtype: 'deferred_revenue', parentCode: '2350' },
    { code: '2358', name: 'Loyalty Points Liability', type: 'LIABILITY', description: 'Unredeemed customer loyalty points', isSystem: false, isContra: false, subtype: 'deferred_revenue', parentCode: '2350' },

    // ----------------------------------------
    // ACCRUED EXPENSES (2400-2449)
    // Expenses incurred but not yet paid
    // ----------------------------------------
    { code: '2400', name: 'Accrued Expenses', type: 'LIABILITY', description: 'Expenses incurred but not paid - Control', isSystem: true, isContra: false, subtype: 'accrued_expense', isParent: true },
    { code: '2401', name: 'Accrued Interest Expense', type: 'LIABILITY', description: 'Interest expense not yet paid', isSystem: true, isContra: false, subtype: 'accrued_expense', parentCode: '2400' },
    { code: '2402', name: 'Accrued Rent Expense', type: 'LIABILITY', description: 'Rent expense not yet paid', isSystem: false, isContra: false, subtype: 'accrued_expense', parentCode: '2400' },
    { code: '2403', name: 'Accrued Utilities', type: 'LIABILITY', description: 'Utility bills not yet received/paid', isSystem: false, isContra: false, subtype: 'accrued_expense', parentCode: '2400' },
    { code: '2404', name: 'Accrued Professional Fees', type: 'LIABILITY', description: 'Legal/accounting fees incurred not paid', isSystem: false, isContra: false, subtype: 'accrued_expense', parentCode: '2400' },
    { code: '2405', name: 'Accrued Audit Fees', type: 'LIABILITY', description: 'Audit fees for year-end', isSystem: false, isContra: false, subtype: 'accrued_expense', parentCode: '2400' },
    { code: '2406', name: 'Accrued Insurance', type: 'LIABILITY', description: 'Insurance expense not yet paid', isSystem: false, isContra: false, subtype: 'accrued_expense', parentCode: '2400' },
    { code: '2407', name: 'Accrued Warranty Expense', type: 'LIABILITY', description: 'Estimated warranty claims liability', isSystem: false, isContra: false, subtype: 'accrued_expense', parentCode: '2400' },
    { code: '2408', name: 'Accrued Repairs & Maintenance', type: 'LIABILITY', description: 'Maintenance costs incurred not paid', isSystem: false, isContra: false, subtype: 'accrued_expense', parentCode: '2400' },

    // ----------------------------------------
    // OTHER CURRENT LIABILITIES (2450-2499)
    // Miscellaneous short-term obligations
    // ----------------------------------------
    { code: '2450', name: 'Other Current Liabilities', type: 'LIABILITY', description: 'Miscellaneous current liabilities - Control', isSystem: true, isContra: false, subtype: 'other_liability', isParent: true },
    { code: '2451', name: 'Dividends Payable', type: 'LIABILITY', description: 'Declared dividends not yet paid', isSystem: false, isContra: false, subtype: 'other_liability', parentCode: '2450' },
    { code: '2452', name: 'Current Portion of Long-Term Debt', type: 'LIABILITY', description: 'LT debt due within 12 months', isSystem: true, isContra: false, subtype: 'other_liability', parentCode: '2450' },
    { code: '2453', name: 'Director Loans Payable', type: 'LIABILITY', description: 'Amounts owed to directors', isSystem: false, isContra: false, subtype: 'other_liability', parentCode: '2450' },
    { code: '2454', name: 'Related Party Payables', type: 'LIABILITY', description: 'Amounts owed to related parties', isSystem: false, isContra: false, subtype: 'other_liability', parentCode: '2450' },
    { code: '2455', name: 'Deposits Held', type: 'LIABILITY', description: 'Security deposits from tenants/customers', isSystem: false, isContra: false, subtype: 'other_liability', parentCode: '2450' },
    { code: '2456', name: 'Suspense Account - Liability', type: 'LIABILITY', description: 'Temporary holding for unclassified items', isSystem: true, isContra: false, subtype: 'other_liability', parentCode: '2450' },

    // ============================================
    // LONG-TERM LIABILITIES (2500-2999)
    // Obligations due after 1 year
    // ============================================

    // ----------------------------------------
    // LONG-TERM LOANS (2500-2599)
    // Bank and institutional loans
    // ----------------------------------------
    { code: '2500', name: 'Long-Term Loans', type: 'LIABILITY', description: 'Loans due after 1 year - Control', isSystem: true, isContra: false, subtype: 'loans_long_term', isParent: true },
    { code: '2501', name: 'Bank Term Loan', type: 'LIABILITY', description: 'Long-term bank loan facility', isSystem: true, isContra: false, subtype: 'loans_long_term', parentCode: '2500' },
    { code: '2502', name: 'Mortgage Loan', type: 'LIABILITY', description: 'Home/property mortgage', isSystem: true, isContra: false, subtype: 'loans_long_term', parentCode: '2500' },
    { code: '2503', name: 'Asset Finance Loan', type: 'LIABILITY', description: 'Vehicle/equipment financing', isSystem: false, isContra: false, subtype: 'loans_long_term', parentCode: '2500' },
    { code: '2504', name: 'Sacco Loan', type: 'LIABILITY', description: 'Long-term Sacco loan', isSystem: false, isContra: false, subtype: 'loans_long_term', parentCode: '2500' },
    { code: '2505', name: 'Microfinance Loan', type: 'LIABILITY', description: 'Loan from MFI institution', isSystem: false, isContra: false, subtype: 'loans_long_term', parentCode: '2500' },
    { code: '2506', name: 'Hire Purchase Liability', type: 'LIABILITY', description: 'HP agreement obligations', isSystem: false, isContra: false, subtype: 'loans_long_term', parentCode: '2500' },
    { code: '2507', name: 'Lease Liability', type: 'LIABILITY', description: 'Finance lease obligations (IFRS 16)', isSystem: false, isContra: false, subtype: 'loans_long_term', parentCode: '2500' },
    { code: '2508', name: 'Development Finance Loan', type: 'LIABILITY', description: 'Loan from development finance institution', isSystem: false, isContra: false, subtype: 'loans_long_term', parentCode: '2500' },
    { code: '2509', name: 'Family/Friends Loan - Long Term', type: 'LIABILITY', description: 'Informal long-term loans', isSystem: false, isContra: false, subtype: 'loans_long_term', parentCode: '2500' },
    { code: '2510', name: 'Government Loan/Grant', type: 'LIABILITY', description: 'Youth/SME fund loans', isSystem: false, isContra: false, subtype: 'loans_long_term', parentCode: '2500' },

    // ----------------------------------------
    // BONDS & DEBENTURES (2600-2649)
    // Debt securities (for larger businesses)
    // ----------------------------------------
    { code: '2600', name: 'Bonds & Debentures', type: 'LIABILITY', description: 'Debt securities - Control', isSystem: true, isContra: false, subtype: 'bonds', isParent: true },
    { code: '2601', name: 'Corporate Bonds Payable', type: 'LIABILITY', description: 'Issued corporate bonds', isSystem: false, isContra: false, subtype: 'bonds', parentCode: '2600' },
    { code: '2602', name: 'Debentures Payable', type: 'LIABILITY', description: 'Issued debentures', isSystem: false, isContra: false, subtype: 'bonds', parentCode: '2600' },
    { code: '2603', name: 'Commercial Paper', type: 'LIABILITY', description: 'Short-term debt securities', isSystem: false, isContra: false, subtype: 'bonds', parentCode: '2600' },

    // ----------------------------------------
    // OTHER LONG-TERM LIABILITIES (2700-2799)
    // Miscellaneous long-term obligations
    // ----------------------------------------
    { code: '2700', name: 'Other Long-Term Liabilities', type: 'LIABILITY', description: 'Misc long-term obligations - Control', isSystem: true, isContra: false, subtype: 'other_lt_liability', isParent: true },
    { code: '2701', name: 'Deferred Tax Liability', type: 'LIABILITY', description: 'Future tax obligations from timing differences', isSystem: true, isContra: false, subtype: 'other_lt_liability', parentCode: '2700' },
    { code: '2702', name: 'Pension Liability', type: 'LIABILITY', description: 'Defined benefit pension obligations', isSystem: false, isContra: false, subtype: 'other_lt_liability', parentCode: '2700' },
    { code: '2703', name: 'Provision for Litigation', type: 'LIABILITY', description: 'Potential legal claims/lawsuits', isSystem: false, isContra: false, subtype: 'other_lt_liability', parentCode: '2700' },
    { code: '2704', name: 'Provision for Restructuring', type: 'LIABILITY', description: 'Expected restructuring costs', isSystem: false, isContra: false, subtype: 'other_lt_liability', parentCode: '2700' },
    { code: '2705', name: 'Asset Retirement Obligation', type: 'LIABILITY', description: 'Decommissioning costs for assets', isSystem: false, isContra: false, subtype: 'other_lt_liability', parentCode: '2700' },
    { code: '2706', name: 'Long-Term Deferred Revenue', type: 'LIABILITY', description: 'Unearned income due after 1 year', isSystem: false, isContra: false, subtype: 'other_lt_liability', parentCode: '2700' },
    { code: '2707', name: 'Security Deposits Held - LT', type: 'LIABILITY', description: 'Long-term tenant/customer deposits', isSystem: false, isContra: false, subtype: 'other_lt_liability', parentCode: '2700' },


    // ============================================
    // EQUITY (3000-3999)
    // ============================================

    // ============================================
    // OWNERS' CAPITAL (3000-3049)
    // Money invested into the business
    // ============================================
    { code: '3000', name: 'Owners\' Capital & Equity', type: 'EQUITY', description: 'Total capital invested', isSystem: true, isContra: false, subtype: 'equity', isParent: true, systemTag: 'EQUITY' },

    // Capital Accounts
    { code: '3001', name: 'Owner\'s Capital (Investment)', type: 'EQUITY', description: 'Initial money invested by owner', isSystem: true, isContra: false, subtype: 'equity', parentCode: '3000' },
    { code: '3002', name: 'Share Capital', type: 'EQUITY', description: 'Value of shares issued', isSystem: false, isContra: false, subtype: 'equity', parentCode: '3000' },
    { code: '3003', name: 'Partner A Capital', type: 'EQUITY', description: 'Capital from Partner A', isSystem: false, isContra: false, subtype: 'equity', parentCode: '3000' },
    { code: '3004', name: 'Partner B Capital', type: 'EQUITY', description: 'Capital from Partner B', isSystem: false, isContra: false, subtype: 'equity', parentCode: '3000' },
    { code: '3005', name: 'Seed Funding / Investor Capital', type: 'EQUITY', description: 'External investment capital', isSystem: false, isContra: false, subtype: 'equity', parentCode: '3000' },

    // ============================================
    // RETAINED EARNINGS & RESERVES (3050-3079)
    // Profits reinvested in the business
    // ============================================
    { code: '3050', name: 'Retained Earnings & Reserves', type: 'EQUITY', description: 'Accumulated profits and reserves', isSystem: true, isContra: false, subtype: 'retained_earnings', isParent: true },

    { code: '3051', name: 'Retained Earnings', type: 'EQUITY', description: 'Accumulated profits from previous years', isSystem: true, isContra: false, subtype: 'retained_earnings', parentCode: '3050' },
    { code: '3052', name: 'General Reserve', type: 'EQUITY', description: 'Profits set aside for general purpose', isSystem: false, isContra: false, subtype: 'retained_earnings', parentCode: '3050' },
    { code: '3053', name: 'Asset Revaluation Reserve', type: 'EQUITY', description: 'Gains from asset revaluation', isSystem: false, isContra: false, subtype: 'retained_earnings', parentCode: '3050' },
    { code: '3054', name: 'Current Year Earnings', type: 'EQUITY', description: 'Profit/Loss for the current year', isSystem: true, isContra: false, subtype: 'retained_earnings', parentCode: '3050' },

    // ============================================
    // DRAWINGS & DIVIDENDS (3080-3099)
    // Money taken out by owners (Contra-Equity)
    // ============================================
    { code: '3080', name: 'Drawings & Distributions', type: 'EQUITY', description: 'Money withdrawn by owners', isSystem: true, isContra: true, subtype: 'drawings', isParent: true },

    { code: '3081', name: 'Owner\'s Drawings', type: 'EQUITY', description: 'Personal cash withdrawals by owner', isSystem: true, isContra: true, subtype: 'drawings', parentCode: '3080' },
    { code: '3082', name: 'Dividends Paid', type: 'EQUITY', description: 'Dividends distributed to shareholders', isSystem: false, isContra: true, subtype: 'drawings', parentCode: '3080' },
    { code: '3083', name: 'Partner A Drawings', type: 'EQUITY', description: 'Withdrawals by Partner A', isSystem: false, isContra: true, subtype: 'drawings', parentCode: '3080' },
    { code: '3084', name: 'Partner B Drawings', type: 'EQUITY', description: 'Withdrawals by Partner B', isSystem: false, isContra: true, subtype: 'drawings', parentCode: '3080' },

    // ============================================
    // REVENUE / INCOME (4000-4999)
    // ============================================

    // ============================================
    // OPERATING REVENUE (4000-4199)
    // Income from core business activities
    // ============================================
    { code: '4000', name: 'Operating Revenue', type: 'INCOME', description: 'Total revenue from core operations', isSystem: true, isContra: false, subtype: 'sales_revenue', isParent: true, systemTag: 'REVENUE' },

    // ----------------------------------------
    // SALES REVENUE (4100-4189)
    // ----------------------------------------
    { code: '4100', name: 'Sales Revenue', type: 'INCOME', description: 'Gross sales from goods and services', isSystem: true, isContra: false, subtype: 'sales_revenue', isParent: true, parentCode: '4000' },
    { code: '4101', name: 'Product Sales', type: 'INCOME', description: 'Sales of physical inventory', isSystem: false, isContra: false, subtype: 'sales_revenue', parentCode: '4100' },
    { code: '4102', name: 'Service Revenue', type: 'INCOME', description: 'Income from services rendered', isSystem: false, isContra: false, subtype: 'sales_revenue', parentCode: '4100' },
    { code: '4103', name: 'Subscription Revenue', type: 'INCOME', description: 'Recurring subscription income', isSystem: false, isContra: false, subtype: 'sales_revenue', parentCode: '4100' },
    { code: '4104', name: 'Project Income', type: 'INCOME', description: 'Revenue from specific contracts/projects', isSystem: false, isContra: false, subtype: 'sales_revenue', parentCode: '4100' },
    { code: '4105', name: 'Installation Fees', type: 'INCOME', description: 'Charges for setup/installation', isSystem: false, isContra: false, subtype: 'sales_revenue', parentCode: '4100' },
    { code: '4106', name: 'Consulting Income', type: 'INCOME', description: 'Advisory services revenue', isSystem: false, isContra: false, subtype: 'sales_revenue', parentCode: '4100' },
    { code: '4107', name: 'Delivery / Shipping Income', type: 'INCOME', description: 'Shipping charges collected from customers', isSystem: false, isContra: false, subtype: 'sales_revenue', parentCode: '4100' },
    { code: '4108', name: 'Management Fees', type: 'INCOME', description: 'Management fees charged', isSystem: false, isContra: false, subtype: 'sales_revenue', parentCode: '4100' },

    // ----------------------------------------
    // SALES ADJUSTMENTS (4190-4199)
    // Contra-Revenue accounts
    // ----------------------------------------
    { code: '4190', name: 'Sales Adjustments', type: 'INCOME', description: 'Reductions to gross sales', isSystem: true, isContra: true, subtype: 'sales_contra', isParent: true, parentCode: '4000' },
    { code: '4191', name: 'Sales Returns', type: 'INCOME', description: 'Goods returned by customers', isSystem: true, isContra: true, subtype: 'sales_contra', parentCode: '4190' },
    { code: '4192', name: 'Sales Discounts', type: 'INCOME', description: 'Discounts given to customers', isSystem: true, isContra: true, subtype: 'sales_contra', parentCode: '4190' },
    { code: '4193', name: 'Sales Allowances', type: 'INCOME', description: 'Price reductions for defective goods', isSystem: false, isContra: true, subtype: 'sales_contra', parentCode: '4190' },

    // ============================================
    // OTHER INCOME (4200-4999)
    // Non-operating income
    // ============================================
    { code: '4200', name: 'Other Income', type: 'INCOME', description: 'Non-operating revenue', isSystem: true, isContra: false, subtype: 'other_income', isParent: true },

    // Financial Income
    { code: '4210', name: 'Interest Income', type: 'INCOME', description: 'Interest from banks/investments', isSystem: true, isContra: false, subtype: 'other_income', parentCode: '4200' },
    { code: '4220', name: 'Dividend Income', type: 'INCOME', description: 'Dividends from shares/investments', isSystem: false, isContra: false, subtype: 'other_income', parentCode: '4200' },
    { code: '4230', name: 'Forex Gain/(Loss)', type: 'INCOME', description: 'Gain on currency exchange', isSystem: false, isContra: false, subtype: 'other_income', parentCode: '4200' },

    // Misc Income
    { code: '4240', name: 'Commission Income', type: 'INCOME', description: 'Commissions received', isSystem: false, isContra: false, subtype: 'other_income', parentCode: '4200' },
    { code: '4250', name: 'Rental Income', type: 'INCOME', description: 'Income from renting out property', isSystem: false, isContra: false, subtype: 'other_income', parentCode: '4200' },
    { code: '4260', name: 'Grants & Subsidies', type: 'INCOME', description: 'Government or NGO grants', isSystem: false, isContra: false, subtype: 'other_income', parentCode: '4200' },
    { code: '4270', name: 'Insurance Claims', type: 'INCOME', description: 'Payouts from insurance claims', isSystem: false, isContra: false, subtype: 'other_income', parentCode: '4200' },
    { code: '4280', name: 'Late Fee Income', type: 'INCOME', description: 'Fees charged on late payments', isSystem: false, isContra: false, subtype: 'other_income', parentCode: '4200' },
    { code: '4290', name: 'Miscellaneous Income', type: 'INCOME', description: 'Other minor income sources', isSystem: false, isContra: false, subtype: 'other_income', parentCode: '4200' },

    // ============================================
    // EXPENSES (5000-8999)
    // ============================================

    // ============================================
    // COST OF GOODS SOLD (5000-5999)
    // Direct costs attributable to the production of goods sold
    // NOTE: These accounts only recognize expenses when items are SOLD, not purchased
    // ============================================
    { code: '5000', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE', description: 'Total cost of items that were sold (not purchased)', isSystem: true, isContra: false, subtype: 'cogs', isParent: true, systemTag: 'COGS' },
    { code: '5001', name: 'Cost of Sales (Inventory)', type: 'EXPENSE', description: 'Cost of items sold from stock - Automatic COGS', isSystem: true, isContra: false, subtype: 'cogs', parentCode: '5000' },
    { code: '5002', name: 'Inventory Cost Adjustments', type: 'EXPENSE', description: 'WAC adjustments and cost corrections', isSystem: false, isContra: false, subtype: 'cogs', parentCode: '5000' },
    { code: '5003', name: 'Freight & Shipping (Inbound)', type: 'EXPENSE', description: 'Transport costs added to inventory cost', isSystem: false, isContra: false, subtype: 'cogs', parentCode: '5000' },
    { code: '5004', name: 'Import Duties & Customs', type: 'EXPENSE', description: 'Customs duties added to inventory cost', isSystem: false, isContra: false, subtype: 'cogs', parentCode: '5000' },
    { code: '5005', name: 'Packaging Costs (COGS)', type: 'EXPENSE', description: 'Packaging for sold products', isSystem: false, isContra: false, subtype: 'cogs', parentCode: '5000' },
    { code: '5006', name: 'Direct Labor (Production)', type: 'EXPENSE', description: 'Wages directly related to making products', isSystem: false, isContra: false, subtype: 'cogs', parentCode: '5000' },
    { code: '5007', name: 'Subcontractor Costs (Production)', type: 'EXPENSE', description: 'Outsourced production work', isSystem: false, isContra: false, subtype: 'cogs', parentCode: '5000' },
    { code: '5008', name: 'Payment Processing Fees (Sales)', type: 'EXPENSE', description: 'Transaction fees on customer payments', isSystem: false, isContra: false, subtype: 'cogs', parentCode: '5000' },
    { code: '5009', name: 'Sales Commissions Paid', type: 'EXPENSE', description: 'Commissions paid on completed sales', isSystem: false, isContra: false, subtype: 'cogs', parentCode: '5000' },

    // ============================================
    // OPERATING EXPENSES (6000-7999)
    // Indirect costs of running the business
    // ============================================
    { code: '6000', name: 'Operating Expenses', type: 'EXPENSE', description: 'Total operating expenses', isSystem: true, isContra: false, subtype: 'operating_expense', isParent: true },

    // ----------------------------------------
    // HOUSING & UTILITIES (6010-6099)
    // ----------------------------------------
    { code: '6010', name: 'Housing & Utilities', type: 'EXPENSE', description: 'Rent and facility costs', isSystem: true, isContra: false, subtype: 'operating_expense', isParent: true, parentCode: '6000' },
    { code: '6011', name: 'Rent Expense', type: 'EXPENSE', description: 'Office/Shop rent', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6010' },
    { code: '6012', name: 'Electricity / Power', type: 'EXPENSE', description: 'Kenya Power (KPLC) bills', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6010' },
    { code: '6013', name: 'Water & Sewerage', type: 'EXPENSE', description: 'Water bills', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6010' },
    { code: '6014', name: 'Internet & Connectivity', type: 'EXPENSE', description: 'Fibre, Wi-Fi, Data', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6010' },
    { code: '6015', name: 'Security Services', type: 'EXPENSE', description: 'Guards, Alarm monitoring', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6010' },
    { code: '6016', name: 'Cleaning & Sanitation', type: 'EXPENSE', description: 'Office cleaning, garbage collection', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6010' },
    { code: '6017', name: 'Repairs & Maintenance (Building)', type: 'EXPENSE', description: 'General facility repairs', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6010' },

    // ----------------------------------------
    // SALARIES & PAYROLL (6100-6199)
    // ----------------------------------------
    { code: '6100', name: 'Salaries & Payroll', type: 'EXPENSE', description: 'Total staff costs', isSystem: true, isContra: false, subtype: 'operating_expense', isParent: true, parentCode: '6000' },
    { code: '6101', name: 'Staff Salaries', type: 'EXPENSE', description: 'Monthly permanent staff salaries', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6100' },
    { code: '6102', name: 'Casual Wages', type: 'EXPENSE', description: 'Daily/Weekly casual labor', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6100' },
    { code: '6103', name: 'Director Salaries', type: 'EXPENSE', description: 'Salaries paid to directors', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6100' },
    { code: '6104', name: 'Staff Bonuses', type: 'EXPENSE', description: 'Performance bonuses', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6100' },
    { code: '6105', name: 'Employer NSSF', type: 'EXPENSE', description: 'Employer pension contribution', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6100' },
    { code: '6106', name: 'Employer Housing Levy', type: 'EXPENSE', description: 'Employer portion of housing levy', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6100' },
    { code: '6107', name: 'Staff Welfare & Meals', type: 'EXPENSE', description: 'Tea, lunch, staff events', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6100' },
    { code: '6108', name: 'Staff Training', type: 'EXPENSE', description: 'Workshops and courses', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6100' },
    { code: '6109', name: 'Medical Insurance', type: 'EXPENSE', description: 'Staff health cover', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6100' },

    // ----------------------------------------
    // OFFICE & ADMIN (6200-6299)
    // ----------------------------------------
    { code: '6200', name: 'Office & Admin', type: 'EXPENSE', description: 'General administration', isSystem: true, isContra: false, subtype: 'operating_expense', isParent: true, parentCode: '6000' },
    { code: '6201', name: 'Printing & Stationery', type: 'EXPENSE', description: 'Paper, ink, pens', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6200' },
    { code: '6202', name: 'Software Subscriptions', type: 'EXPENSE', description: 'SaaS (Zoom, Slack, Jibuks)', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6200' },
    { code: '6203', name: 'Licenses & Permits', type: 'EXPENSE', description: 'County council permits', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6200' },
    { code: '6204', name: 'Telephone & Airtime', type: 'EXPENSE', description: 'Office phone expenses', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6200' },
    { code: '6205', name: 'Postage & Courier', type: 'EXPENSE', description: 'Delivery fees, stamps', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6200' },
    { code: '6206', name: 'Small Equipment (< Asset Limit)', type: 'EXPENSE', description: 'Small tools not capitalized', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6200' },

    // ----------------------------------------
    // SALES & MARKETING (6300-6399)
    // ----------------------------------------
    { code: '6300', name: 'Sales & Marketing', type: 'EXPENSE', description: 'Growth contribution costs', isSystem: true, isContra: false, subtype: 'operating_expense', isParent: true, parentCode: '6000' },
    { code: '6301', name: 'Advertising (Online)', type: 'EXPENSE', description: 'Meta, Google, Instagram Ads', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6300' },
    { code: '6302', name: 'Advertising (Offline)', type: 'EXPENSE', description: 'Flyers, radio, billboards', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6300' },
    { code: '6303', name: 'Website Hosting & Domain', type: 'EXPENSE', description: 'Site maintenance', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6300' },
    { code: '6304', name: 'Branding & Design', type: 'EXPENSE', description: 'Logos, t-shirts, branding', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6300' },
    { code: '6305', name: 'Business Entertainment', type: 'EXPENSE', description: 'Client lunches/meetings', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6300' },

    // ----------------------------------------
    // TRANSPORT & TRAVEL (6400-6499)
    // ----------------------------------------
    { code: '6400', name: 'Transport & Travel', type: 'EXPENSE', description: 'Movement costs', isSystem: true, isContra: false, subtype: 'operating_expense', isParent: true, parentCode: '6000' },
    { code: '6401', name: 'Fuel & Oil', type: 'EXPENSE', description: 'Petrol/Diesel for vehicles', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6400' },
    { code: '6402', name: 'Public Transport / Fare', type: 'EXPENSE', description: 'Matatu, bus fare', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6400' },
    { code: '6403', name: 'Taxi / Uber / Bolt', type: 'EXPENSE', description: 'Ride hailing services', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6400' },
    { code: '6404', name: 'Parking & Tolls', type: 'EXPENSE', description: 'Parking fees, Expressway', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6400' },
    { code: '6405', name: 'Vehicle Repairs & Service', type: 'EXPENSE', description: 'Mechanic costs', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6400' },
    { code: '6406', name: 'Vehicle Insurance', type: 'EXPENSE', description: 'Comprehensive/TPO cover', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6400' },
    { code: '6407', name: 'Accommodation & Meals (Travel)', type: 'EXPENSE', description: 'Hotel stays during travel', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6400' },

    // ----------------------------------------
    // FINANCIAL & PROFESSIONAL (6500-6599)
    // ----------------------------------------
    { code: '6500', name: 'Financial & Professional', type: 'EXPENSE', description: 'Bank and legal fees', isSystem: true, isContra: false, subtype: 'operating_expense', isParent: true, parentCode: '6000' },
    { code: '6501', name: 'Bank Service Charges', type: 'EXPENSE', description: 'Monthly ledger fees', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6500' },
    { code: '6502', name: 'M-PESA / Transaction Fees', type: 'EXPENSE', description: 'Sending/withdrawal charges', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6500' },
    { code: '6503', name: 'Legal Fees', type: 'EXPENSE', description: 'Lawyer charges', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6500' },
    { code: '6504', name: 'Accounting & Audit Fees', type: 'EXPENSE', description: 'Bookkeeping/Audit services', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6500' },
    { code: '6505', name: 'Consultancy Fees', type: 'EXPENSE', description: 'Professional advice', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6500' },
    { code: '6506', name: 'Interest Expense', type: 'EXPENSE', description: 'Interest on loans', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6500' },
    { code: '6507', name: 'Bad Debts Expense', type: 'EXPENSE', description: 'Written off receivables', isSystem: false, isContra: false, subtype: 'operating_expense', parentCode: '6500' },

    // ----------------------------------------
    // DEPRECIATION & AMORTIZATION (6900-6999)
    // ----------------------------------------
    { code: '6900', name: 'Depreciation & Amortization', type: 'EXPENSE', description: 'Non-cash asset costs', isSystem: true, isContra: false, subtype: 'depreciation', isParent: true, parentCode: '6000' },
    { code: '6910', name: 'Depreciation - Buildings', type: 'EXPENSE', description: 'Expense', isSystem: true, isContra: false, subtype: 'depreciation', parentCode: '6900' },
    { code: '6920', name: 'Depreciation - Vehicles', type: 'EXPENSE', description: 'Expense', isSystem: true, isContra: false, subtype: 'depreciation', parentCode: '6900' },
    { code: '6930', name: 'Depreciation - Furniture', type: 'EXPENSE', description: 'Expense', isSystem: true, isContra: false, subtype: 'depreciation', parentCode: '6900' },
    { code: '6940', name: 'Depreciation - Equipment', type: 'EXPENSE', description: 'Expense', isSystem: true, isContra: false, subtype: 'depreciation', parentCode: '6900' },
    { code: '6950', name: 'Amortization - Intangibles', type: 'EXPENSE', description: 'Expense', isSystem: true, isContra: false, subtype: 'depreciation', parentCode: '6900' },

    // ============================================
    // OTHER EXPENSES (8000-8999)
    // Non-operating expenses
    // ============================================
    { code: '8000', name: 'Other Expenses', type: 'EXPENSE', description: 'Non-operating expenses', isSystem: true, isContra: false, subtype: 'other_expense', isParent: true },
    { code: '8010', name: 'Loss on Asset Sales', type: 'EXPENSE', description: 'Loss when selling assets below book value', isSystem: true, isContra: false, subtype: 'other_expense', parentCode: '8000' },
    { code: '8020', name: 'Fines & Penalties (Non-Deductible)', type: 'EXPENSE', description: 'KRA/Traffic fines (Not tax deductible)', isSystem: false, isContra: false, subtype: 'other_expense', parentCode: '8000' },
    { code: '8030', name: 'Charitable Donations & CSR', type: 'EXPENSE', description: 'Donations and Corporate Social Responsibility', isSystem: false, isContra: false, subtype: 'other_expense', parentCode: '8000' },
    { code: '8040', name: 'Inventory Shrinkage (Loss)', type: 'EXPENSE', description: 'Stock lost to theft, damage, or obsolescence', isSystem: false, isContra: false, subtype: 'other_expense', parentCode: '8000' },

    // 4300 - Gain/Loss on Asset Disposal (For Assets Module)
    { code: '4300', name: 'Gain on Asset Sales', type: 'INCOME', description: 'Profit from selling assets above book value', isSystem: true, subtype: 'other_income' },
    { code: '6800', name: 'Loss on Asset Sales', type: 'EXPENSE', description: 'Loss from selling assets below book value', isSystem: true, subtype: 'other_expense' },

    // Other Standard Business (5000 series for COGS)
    { code: '5199', name: 'Uncategorized Expense', type: 'EXPENSE', description: 'Temporary holding account for expenses to be categorized', isSystem: true, subtype: 'operating_expense' },

    // ============================================
    // COMPREHENSIVE EXPENSE CATEGORIES (5100-5400)
    // Additional detailed expense accounts
    // ============================================
    { code: '5100', name: 'Amortisation expense', type: 'EXPENSE', subtype: 'operating_expense', description: 'Periodic writeoff of intangible assets' },
    { code: '5110', name: 'Bad debts', type: 'EXPENSE', subtype: 'operating_expense', description: 'Uncollectible receivables written off' },
    { code: '5120', name: 'Bank charges', type: 'EXPENSE', subtype: 'operating_expense', description: 'Bank service fees and charges' },
    { code: '5130', name: 'Commissions and fees', type: 'EXPENSE', subtype: 'operating_expense', description: 'Commissions paid to agents/brokers' },
    { code: '5140', name: 'Dues and subscriptions', type: 'EXPENSE', subtype: 'operating_expense', description: 'Professional memberships and subscriptions' },
    { code: '5150', name: 'Equipment rental', type: 'EXPENSE', subtype: 'operating_expense', description: 'Rental of equipment and machinery' },
    { code: '5160', name: 'Income tax expense', type: 'EXPENSE', subtype: 'tax_expense', description: 'Corporate income tax expense' },
    { code: '5170', name: 'Insurance - Disability', type: 'EXPENSE', subtype: 'operating_expense', description: 'Disability insurance premiums' },
    { code: '5180', name: 'Insurance - General', type: 'EXPENSE', subtype: 'operating_expense', description: 'General business insurance' },
    { code: '5190', name: 'Insurance - Liability', type: 'EXPENSE', subtype: 'operating_expense', description: 'Liability insurance coverage' },
    { code: '5200', name: 'Interest expense', type: 'EXPENSE', subtype: 'financial_expense', description: 'Interest paid on loans and borrowings' },
    { code: '5210', name: 'Legal and professional fees', type: 'EXPENSE', subtype: 'operating_expense', description: 'Lawyers, accountants, consultants' },
    { code: '5220', name: 'Loss on discontinued operations, net of tax', type: 'EXPENSE', subtype: 'other_expense', description: 'Losses from discontinued business segments' },
    { code: '5230', name: 'Management compensation', type: 'EXPENSE', subtype: 'payroll_expense', description: 'Management salaries and compensation' },
    { code: '5240', name: 'Meals and entertainment', type: 'EXPENSE', subtype: 'operating_expense', description: 'Business meals and entertainment' },
    { code: '5250', name: 'Office expenses', type: 'EXPENSE', subtype: 'operating_expense', description: 'General office operating expenses' },
    { code: '5260', name: 'Other Types of Expenses-Advertising Expenses', type: 'EXPENSE', subtype: 'marketing_expense', description: 'Advertising and promotional costs' },
    { code: '5270', name: 'Other general and administrative expenses', type: 'EXPENSE', subtype: 'operating_expense', description: 'Miscellaneous G&A expenses' },
    { code: '5280', name: 'Other selling expenses', type: 'EXPENSE', subtype: 'selling_expense', description: 'Additional selling costs' },
    { code: '5290', name: 'Payroll Expenses', type: 'EXPENSE', subtype: 'payroll_expense', description: 'Employee wages and salaries' },
    { code: '5300', name: 'Purchases', type: 'EXPENSE', subtype: 'cogs', description: 'Inventory and goods purchases' },
    { code: '5310', name: 'Rent or lease payments', type: 'EXPENSE', subtype: 'operating_expense', description: 'Rental/lease payments for property' },
    { code: '5320', name: 'Repairs and Maintenance', type: 'EXPENSE', subtype: 'operating_expense', description: 'Repair and maintenance costs' },
    { code: '5330', name: 'Shipping and delivery expense', type: 'EXPENSE', subtype: 'selling_expense', description: 'Outbound shipping and delivery' },
    { code: '5340', name: 'Stationery and printing', type: 'EXPENSE', subtype: 'operating_expense', description: 'Office stationery and printing' },
    { code: '5350', name: 'Supplies', type: 'EXPENSE', subtype: 'operating_expense', description: 'General business supplies' },
    { code: '5360', name: 'Travel expenses - general and admin expenses', type: 'EXPENSE', subtype: 'operating_expense', description: 'Travel for admin purposes' },
    { code: '5370', name: 'Travel expenses - selling expenses', type: 'EXPENSE', subtype: 'selling_expense', description: 'Travel for sales purposes' },
    { code: '5380', name: 'Uncategorised Expense', type: 'EXPENSE', subtype: 'operating_expense', description: 'Unclassified expenses' },
    { code: '5390', name: 'Utilities', type: 'EXPENSE', subtype: 'operating_expense', description: 'Electricity, water, gas' },
    { code: '5400', name: 'Wage expenses', type: 'EXPENSE', subtype: 'payroll_expense', description: 'Hourly wage expenses' },
    { code: '5410', name: 'Cost of sales', type: 'EXPENSE', subtype: 'cogs', description: 'Direct cost of goods sold' },
    { code: '5420', name: 'Freight and delivery - COS', type: 'EXPENSE', subtype: 'cogs', description: 'Inbound freight costs' },

    // ============================================
    // ADDITIONAL OTHER INCOME (4400-4440)
    // ============================================
    { code: '4400', name: 'Dividend income', type: 'INCOME', subtype: 'other_income', description: 'Dividends received from investments' },
    { code: '4410', name: 'Interest income', type: 'INCOME', subtype: 'other_income', description: 'Interest earned on deposits' },
    { code: '4420', name: 'Loss on disposal of assets', type: 'INCOME', subtype: 'other_income', description: 'Gains/losses on asset disposal - contra', isContra: true },
    { code: '4430', name: 'Other operating income (expenses)', type: 'INCOME', subtype: 'other_income', description: 'Miscellaneous operating income' },
    { code: '4440', name: 'Unrealised loss on securities, net of tax', type: 'INCOME', subtype: 'other_income', description: 'Mark-to-market securities gains/losses' },

    // ============================================
    // ADDITIONAL INCOME/REVENUE (4150-4205)
    // ============================================
    { code: '4150', name: 'Billable Expense Income', type: 'INCOME', subtype: 'sales_revenue', description: 'Reimbursable expense income' },
    { code: '4160', name: 'Revenue - General', type: 'INCOME', subtype: 'sales_revenue', description: 'General business revenue' },
    { code: '4170', name: 'Sales - retail', type: 'INCOME', subtype: 'sales_revenue', description: 'Retail sales revenue' },
    { code: '4180', name: 'Sales - wholesale', type: 'INCOME', subtype: 'sales_revenue', description: 'Wholesale sales revenue' },
    { code: '4190', name: 'Sales of Product Income', type: 'INCOME', subtype: 'sales_revenue', description: 'Product sales' },
    { code: '4205', name: 'Uncategorised Income', type: 'INCOME', subtype: 'other_income', description: 'Unclassified income' },

    // ============================================
    // ADDITIONAL CURRENT LIABILITIES (2460-2540)
    // ============================================
    { code: '2460', name: 'Accrued liabilities', type: 'LIABILITY', subtype: 'other_liability', description: 'General accrued liabilities' },
    { code: '2470', name: 'Deferred Revenue', type: 'LIABILITY', subtype: 'deferred_revenue', description: 'Prepaid revenue not yet earned' },
    { code: '2480', name: 'Dividends payable', type: 'LIABILITY', subtype: 'other_liability', description: 'Declared dividends not yet paid' },
    { code: '2490', name: 'Income tax payable', type: 'LIABILITY', subtype: 'taxes_payable', description: 'Corporate tax owed' },
    { code: '2520', name: 'Short-term debit', type: 'LIABILITY', subtype: 'loans_current', description: 'Short-term debt obligations' },
    { code: '2530', name: 'VAT Control', type: 'LIABILITY', subtype: 'vat_payable', description: 'VAT control account' },
    { code: '2540', name: 'VAT Suspense', type: 'LIABILITY', subtype: 'vat_payable', description: 'Temporary VAT holding' },

    // ============================================
    // ADDITIONAL LONG TERM LIABILITIES (2710-2740)
    // ============================================
    { code: '2710', name: 'Accrued holiday payable', type: 'LIABILITY', subtype: 'payroll_liability', description: 'Accrued vacation liability' },
    { code: '2720', name: 'Accrued non-current liabilities', type: 'LIABILITY', subtype: 'other_lt_liability', description: 'Long-term accrued liabilities' },
    { code: '2730', name: 'Liabilities related to assets held for sale', type: 'LIABILITY', subtype: 'other_lt_liability', description: 'Liabilities for assets held for sale' },
    { code: '2740', name: 'Long-term debt', type: 'LIABILITY', subtype: 'loans_long_term', description: 'Long-term debt obligations' },

    // ============================================
    // ADDITIONAL CURRENT ASSETS (1250-1296)
    // ============================================
    { code: '1250', name: 'Allowance for bad debt', type: 'ASSET', subtype: 'contra_receivable', description: 'Bad debt provision', isContra: true },
    { code: '1260', name: 'Available for sale assets (short-term)', type: 'ASSET', subtype: 'other_current_asset', description: 'Short-term marketable securities' },
    { code: '1270', name: 'Inventory', type: 'ASSET', subtype: 'inventory', description: 'Stock on hand' },
    { code: '1280', name: 'Inventory Asset', type: 'ASSET', subtype: 'inventory', description: 'Inventory asset account' },
    { code: '1290', name: 'Prepaid expenses', type: 'ASSET', subtype: 'prepayment', description: 'Expenses paid in advance' },
    { code: '1295', name: 'Uncategorised Asset', type: 'ASSET', subtype: 'other_asset', description: 'Unclassified assets' },

    // ============================================
    // ADDITIONAL OTHER ASSETS (1550-1585)
    // ============================================
    { code: '1550', name: 'Assets held for sale', type: 'ASSET', subtype: 'other_asset', description: 'Assets designated for sale' },
    { code: '1560', name: 'Deferred tax assets', type: 'ASSET', subtype: 'other_asset', description: 'Future tax benefits' },
    { code: '1570', name: 'Goodwill', type: 'ASSET', subtype: 'intangible', description: 'Business acquisition goodwill' },
    { code: '1580', name: 'Intangibles', type: 'ASSET', subtype: 'intangible', description: 'Intangible assets' },
    { code: '1585', name: 'Long-Term Investments', type: 'ASSET', subtype: 'investment', description: 'Long-term investment holdings' },

    // ============================================
    // ADDITIONAL FIXED ASSETS (1440-1450)
    // ============================================
    { code: '1440', name: 'Accumulated depreciation on property, plant and equipment', type: 'ASSET', subtype: 'contra_asset', description: 'Accumulated depreciation', isContra: true },
    { code: '1450', name: 'Property, plant and equipment', type: 'ASSET', subtype: 'fixed_asset', description: 'Fixed assets' },

    // ============================================
    // ADDITIONAL EQUITY (3100-3140)
    // ============================================
    { code: '3100', name: 'Dividend disbursed', type: 'EQUITY', subtype: 'drawings', description: 'Dividends paid out', isContra: true },
    { code: '3110', name: 'Equity in earnings of subsidiaries', type: 'EQUITY', subtype: 'retained_earnings', description: 'Share of subsidiary profits' },
    { code: '3120', name: 'Other comprehensive income', type: 'EQUITY', subtype: 'retained_earnings', description: 'OCI items' },
    { code: '3130', name: 'Retained Earnings', type: 'EQUITY', subtype: 'retained_earnings', description: 'Accumulated retained earnings' },
    { code: '3140', name: 'Share capital', type: 'EQUITY', subtype: 'equity', description: 'Issued share capital' },

    // ============================================
    // ADDITIONAL BANK/CASH (1028)
    // ============================================
    { code: '1028', name: 'Cash and cash equivalents', type: 'ASSET', subtype: 'cash', description: 'Cash and near-cash items', isPaymentEligible: true },

    // ============================================
    // ADDITIONAL ACCOUNTS PAYABLE (2013)
    // ============================================
    { code: '2013', name: 'Accounts Payable (A/P)', type: 'LIABILITY', subtype: 'accounts_payable', description: 'Main trade payables account' },
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
// CATEGORIES TEMPLATE
// ============================================

/**
 * Standard Family Categories Template
 */
const FAMILY_CATEGORIES_TEMPLATE = [
    // Income
    { name: 'Salary', type: 'income', icon: 'wallet', color: '#10B981' },
    { name: 'Business', type: 'income', icon: 'briefcase', color: '#3B82F6' },
    { name: 'Investment', type: 'income', icon: 'trending-up', color: '#8B5CF6' },
    { name: 'Gift', type: 'income', icon: 'gift', color: '#EC4899' },
    { name: 'Rental', type: 'income', icon: 'home', color: '#F59E0B' },
    { name: 'Other Income', type: 'income', icon: 'cash', color: '#9CA3AF' },

    // Expense
    { name: 'Food', type: 'expense', icon: 'cake', color: '#EF4444' },
    { name: 'Groceries', type: 'expense', icon: 'shopping-cart', color: '#F87171' },
    { name: 'Transport', type: 'expense', icon: 'truck', color: '#F59E0B' },
    { name: 'Housing', type: 'expense', icon: 'home', color: '#3B82F6' },
    { name: 'Rent', type: 'expense', icon: 'key', color: '#60A5FA' },
    { name: 'Utilities', type: 'expense', icon: 'lightning-bolt', color: '#FBBF24' },
    { name: 'Healthcare', type: 'expense', icon: 'heart', color: '#EF4444' },
    { name: 'Education', type: 'expense', icon: 'book-open', color: '#8B5CF6' },
    { name: 'Entertainment', type: 'expense', icon: 'film', color: '#EC4899' },
    { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#DB2777' },
    { name: 'Communication', type: 'expense', icon: 'phone', color: '#10B981' },
    { name: 'Insurance', type: 'expense', icon: 'shield-check', color: '#6B7280' },
    { name: 'Donations', type: 'expense', icon: 'heart', color: '#EC4899' },
    { name: 'Subscriptions', type: 'expense', icon: 'calendar', color: '#6366F1' },
    { name: 'Personal Care', type: 'expense', icon: 'user', color: '#F472B6' },
    { name: 'Pet Care', type: 'expense', icon: 'emoji-happy', color: '#A5F3FC' },
    { name: 'Childcare', type: 'expense', icon: 'users', color: '#FCD34D' },
    { name: 'Gym', type: 'expense', icon: 'lightning-bolt', color: '#EF4444' },
    { name: 'Other Expenses', type: 'expense', icon: 'dots-horizontal', color: '#9CA3AF' },
];

/**
 * Seeds categories for a new family tenant
 * Called automatically when a new family is created
 * 
 * @param {number} tenantId - The tenant ID to seed categories for
 */
export async function seedFamilyCategories(tenantId) {
    try {
        // Check if categories already exist
        const existingCategories = await prisma.category.count({
            where: { tenantId }
        });

        if (existingCategories > 0) {
            console.log(`[AccountingService] Tenant ${tenantId} already has ${existingCategories} categories, skipping seed`);
            return;
        }

        // Create all categories from template
        const categoriesToCreate = FAMILY_CATEGORIES_TEMPLATE.map(cat => ({
            tenantId,
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            color: cat.color,
        }));

        await prisma.category.createMany({
            data: categoriesToCreate,
            skipDuplicates: true
        });

        console.log(`[AccountingService] Seeded ${categoriesToCreate.length} categories for tenant ${tenantId}`);

        return categoriesToCreate.length;
    } catch (error) {
        console.error('[AccountingService] Error seeding categories:', error);
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

// ============================================
// COA HELPER LOOKUPS (AR, Revenue, Payment Accounts)
// ============================================

/**
 * Find the Accounts Receivable control account for a tenant.
 * Prefers AR by systemTag, then subtype, then common AR code (1250).
 */
export async function getAccountsReceivableAccountId(tenantId) {
    const account = await prisma.account.findFirst({
        where: {
            tenantId,
            isActive: true,
            OR: [
                { systemTag: 'AR' },
                { subtype: 'ar' },
                { code: '1250' },
            ],
        },
    });
    return account?.id ?? null;
}

/**
 * Find a default revenue account (INCOME) for a tenant.
 * Prefers common sales codes 4100/4110, falls back to first INCOME account.
 */
export async function getDefaultRevenueAccountId(tenantId) {
    const account = await prisma.account.findFirst({
        where: {
            tenantId,
            type: 'INCOME',
            isActive: true,
            OR: [
                { code: '4100' },
                { code: '4110' },
            ],
        },
        orderBy: { code: 'asc' },
    });
    return account?.id ?? null;
}

/**
 * Find a default payment account (Cash/Bank) for a tenant.
 * Uses accounts flagged as payment-eligible.
 */
export async function getDefaultPaymentAccountId(tenantId) {
    const account = await prisma.account.findFirst({
        where: {
            tenantId,
            isPaymentEligible: true,
            isActive: true,
        },
        orderBy: { code: 'asc' },
    });
    return account?.id ?? null;
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
            id: account.id,
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

// ============================================
// ONBOARDING SEEDING - VAT RATES
// ============================================

/**
 * Seed default VAT rates for new tenants
 * Called automatically during user registration
 */
export async function seedVATRates(tenantId) {
    console.log(`[Seeding] VAT Rates for tenant ${tenantId}...`);

    const vatRates = [
        {
            name: '16.0% S (16%)',
            code: 'S',
            rate: 16.0,
            description: 'Standard VAT rate 16% - Most goods and services in Kenya',
            isActive: true
        },
        {
            name: 'Exempt Purchase (0%)',
            code: 'EXEMPT',
            rate: 0.0,
            description: 'Exempt purchases - Financial services, education, healthcare, residential rent',
            isActive: true
        },
        {
            name: '0.0% Z (0%)',
            code: 'Z',
            rate: 0.0,
            description: 'Zero-rated supplies - Exports, certain foodstuffs, agricultural supplies',
            isActive: true
        },
        {
            name: '16.0% S Import (16%)',
            code: 'S-IMPORT',
            rate: 16.0,
            description: 'Standard VAT on imports - Imported goods',
            isActive: true
        },
        {
            name: 'No VAT (0%)',
            code: 'NO-VAT',
            rate: 0.0,
            description: 'No VAT - Out of scope transactions',
            isActive: true
        },
        {
            name: '16.0% S - RC Imported Services (0%)',
            code: 'S-RC',
            rate: 0.0,
            description: 'Reverse Charge on imported services - Recipient accounts for VAT',
            isActive: true
        },
        {
            name: '8.0% Petrol (8%)',
            code: 'PETROL',
            rate: 8.0,
            description: 'Reduced VAT rate for petroleum products - 8%',
            isActive: true
        }
    ];

    let created = 0;
    for (const vat of vatRates) {
        const existing = await prisma.vatRate.findFirst({
            where: {
                tenantId,
                code: vat.code
            }
        });

        if (!existing) {
            await prisma.vatRate.create({
                data: {
                    tenantId,
                    ...vat
                }
            });
            created++;
        }
    }

    console.log(`[Seeding] ✅ Created ${created} VAT rates`);
    return created;
}

// ============================================
// ONBOARDING SEEDING - DEFAULT SUPPLIERS
// ============================================

/**
 * Seed default sample suppliers for new tenants
 * Called automatically during user registration
 */
export async function seedDefaultSuppliers(tenantId) {
    console.log(`[Seeding] Default Suppliers for tenant ${tenantId}...`);

    const suppliers = [
        // Utilities
        {
            name: 'Kenya Power (KPLC)',
            email: 'info@kplc.co.ke',
            phone: '+254703070707',
            address: 'Nairobi, Kenya',
            paymentTerms: 'DUE_ON_RECEIPT',
            balance: 0,
            isActive: true
        },
        {
            name: 'Nairobi Water Company',
            email: 'info@nairobiwater.co.ke',
            phone: '+254202757000',
            address: 'Nairobi, Kenya',
            paymentTerms: 'DUE_ON_RECEIPT',
            balance: 0,
            isActive: true
        },

        // Telecommunications
        {
            name: 'Safaricom PLC',
            email: 'care@safaricom.co.ke',
            phone: '+254722000000',
            address: 'Nairobi, Kenya',
            paymentTerms: 'DUE_ON_RECEIPT',
            balance: 0,
            isActive: true
        },
        {
            name: 'Airtel Kenya',
            email: 'customer.care@ke.airtel.com',
            phone: '+254730100000',
            address: 'Nairobi, Kenya',
            paymentTerms: 'DUE_ON_RECEIPT',
            balance: 0,
            isActive: true
        },
        {
            name: 'Telkom Kenya',
            email: 'customercare@telkom.co.ke',
            phone: '+254200200020',
            address: 'Nairobi, Kenya',
            paymentTerms: 'NET_30',
            balance: 0,
            isActive: true
        },

        // Fuel Stations
        {
            name: 'Total Energies Kenya',
            email: 'customerservice@totalenergies.co.ke',
            phone: '+254709943000',
            address: 'Nairobi, Kenya',
            paymentTerms: 'DUE_ON_RECEIPT',
            balance: 0,
            isActive: true
        },
        {
            name: 'Shell Kenya',
            email: 'customer.service@shell.com',
            phone: '+254203892000',
            address: 'Nairobi, Kenya',
            paymentTerms: 'DUE_ON_RECEIPT',
            balance: 0,
            isActive: true
        },

        // Supermarkets & Retail
        {
            name: 'Naivas Supermarket',
            email: 'info@naivas.co.ke',
            phone: '+254709170000',
            address: 'Nairobi, Kenya',
            paymentTerms: 'DUE_ON_RECEIPT',
            balance: 0,
            isActive: true
        },
        {
            name: 'Carrefour Kenya',
            email: 'customerservice@carrefourkenya.com',
            phone: '+254709598000',
            address: 'Nairobi, Kenya',
            paymentTerms: 'DUE_ON_RECEIPT',
            balance: 0,
            isActive: true
        },
        {
            name: 'QuickMart Supermarket',
            email: 'info@quickmart.co.ke',
            phone: '+254700123456',
            address: 'Nairobi, Kenya',
            paymentTerms: 'DUE_ON_RECEIPT',
            balance: 0,
            isActive: true
        },

        // Hardware & Construction
        {
            name: 'Tile & Carpet Centre',
            email: 'info@tileandcarpet.com',
            phone: '+254202714141',
            address: 'Nairobi, Kenya',
            paymentTerms: 'NET_30',
            balance: 0,
            isActive: true
        },
        {
            name: 'Buildmart Kenya',
            email: 'info@buildmart.co.ke',
            phone: '+254709200300',
            address: 'Nairobi, Kenya',
            paymentTerms: 'NET_30',
            balance: 0,
            isActive: true
        },

        // Office Supplies & Stationery
        {
            name: 'Stationery Supplies Ltd',
            email: 'sales@stationery.co.ke',
            phone: '+254722334455',
            address: 'Nairobi, Kenya',
            paymentTerms: 'NET_30',
            balance: 0,
            isActive: true
        },
        {
            name: 'Office World Kenya',
            email: 'info@officeworld.co.ke',
            phone: '+254733445566',
            address: 'Nairobi, Kenya',
            paymentTerms: 'NET_30',
            balance: 0,
            isActive: true
        },

        // Professional Services
        {
            name: 'KRA (Kenya Revenue Authority)',
            email: 'callcentre@kra.go.ke',
            phone: '+254711099999',
            address: 'Nairobi, Kenya',
            paymentTerms: 'DUE_ON_RECEIPT',
            balance: 0,
            isActive: true
        },
        {
            name: 'General Supplier',
            email: 'supplier@general.co.ke',
            phone: '+254700000000',
            address: 'Nairobi, Kenya',
            paymentTerms: 'NET_30',
            balance: 0,
            isActive: true
        }
    ];

    let created = 0;
    for (const supplier of suppliers) {
        const existing = await prisma.vendor.findFirst({
            where: {
                tenantId,
                email: supplier.email
            }
        });

        if (!existing) {
            await prisma.vendor.create({
                data: {
                    tenantId,
                    ...supplier
                }
            });
            created++;
        }
    }

    console.log(`[Seeding] ✅ Created ${created} default suppliers`);
    return created;
}

export default {
    seedFamilyCoA,
    seedFamilyCategories,
    seedFamilyPaymentMethods,
    seedVATRates,
    seedDefaultSuppliers,
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
    getAccountsReceivableAccountId,
    getDefaultRevenueAccountId,
    getDefaultPaymentAccountId,
    ASSET_LOGIC_CONFIG
};
