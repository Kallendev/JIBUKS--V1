# JIBUKS-V1 Quick Reference Guide

## 🎯 What I Built - At a Glance

### 1️⃣ Chart of Accounts (CoA)
**200+ pre-configured accounts automatically created for every new business**

**Key Account Categories:**
```
1000-1999  ASSETS          What you own (Cash, Bank, Inventory, AR)
2000-2999  LIABILITIES     What you owe (AP, VAT Payable, Loans)
3000-3999  EQUITY          Owner investments and profits
4000-4999  INCOME          Earnings from sales and services
5000-8999  EXPENSES        Business costs (COGS, Operating Expenses)
```

**Smart Features:**
- ✅ Auto-seeded on tenant creation
- ✅ Kenyan-specific accounts (M-PESA, SACCOs, KRA taxes)
- ✅ Automatic category-to-account mapping
- ✅ Parent-child account hierarchies

---

## 2️⃣ VAT Logic
**Automatic VAT calculation and tracking on every transaction**

### Sales Example: Customer Invoice for KES 1,160
```
┌─────────────────────────────────────┐
│ INVOICE TO CUSTOMER                 │
├─────────────────────────────────────┤
│ Product Sales      KES 1,000.00     │
│ VAT 16%            KES   160.00     │
├─────────────────────────────────────┤
│ TOTAL OWED         KES 1,160.00     │
└─────────────────────────────────────┘

AUTOMATIC JOURNAL ENTRY:
DR  Accounts Receivable (1100)    KES 1,160
    CR  Sales Revenue (4100)          KES 1,000  ← Your income
    CR  VAT Payable (2110)            KES 160    ← Owed to KRA
```

### Purchase Example: Bill from Supplier for KES 1,160
```
┌─────────────────────────────────────┐
│ BILL FROM SUPPLIER                  │
├─────────────────────────────────────┤
│ Supplies           KES 1,000.00     │
│ VAT 16%            KES   160.00     │
├─────────────────────────────────────┤
│ TOTAL TO PAY       KES 1,160.00     │
└─────────────────────────────────────┘

AUTOMATIC JOURNAL ENTRY:
DR  Expenses (various)            KES 1,000  ← Your expense
DR  VAT Receivable (1157)         KES 160    ← Can claim from KRA
    CR  Accounts Payable (2000)       KES 1,160
```

### Monthly VAT Return to KRA
```
Output VAT Collected  - Input VAT Paid = VAT Owed to KRA
KES 10,000           - KES 4,000      = KES 6,000

Payment Entry:
DR  VAT Payable (2110)           KES 10,000
    CR  VAT Receivable (1157)         KES 4,000
    CR  Bank Account                  KES 6,000
```

---

## 3️⃣ Accounts Receivable (AR) - "Who Owes YOU Money"

### Customer Lifecycle

**Step 1: Create Invoice (Credit Sale)**
```
Customer buys KES 10,000 worth of goods on credit

DR  Accounts Receivable (1100)     KES 10,000
    CR  Sales Revenue (4100)           KES 10,000

📊 Result: Customer owes you KES 10,000
```

**Step 2: Customer Pays**
```
Customer pays via M-PESA

DR  M-PESA (1051)                  KES 10,000
    CR  Accounts Receivable (1100)     KES 10,000

📊 Result: You have the money, customer no longer owes you
```

**AR Dashboard Shows:**
- Total Owed: KES 50,000
- Overdue (30+ days): KES 15,000
- Aging Report: Who owes what and for how long

---

## 4️⃣ Accounts Payable (AP) - "Who YOU Owe Money"

### Supplier Lifecycle

**Step 1: Receive Bill (Credit Purchase)**
```
Supplier delivers KES 50,000 worth of inventory, payment due later

DR  Inventory Asset (1201)         KES 50,000
    CR  Accounts Payable (2000)        KES 50,000

📊 Result: You have the inventory, you owe supplier KES 50,000
```

**Step 2: Pay Supplier**
```
You pay supplier via Bank Transfer

DR  Accounts Payable (2000)        KES 50,000
    CR  Bank Account (1011)            KES 50,000

📊 Result: You no longer owe supplier, bank balance reduced
```

**AP Dashboard Shows:**
- Total Owed: KES 200,000
- Due This Week: KES 50,000
- Aging Report: What you owe and when it's due

---

## 5️⃣ Inventory Accounting - The "Double-Entry Magic"

### Purchase Flow
```
Buy 10 Widgets @ KES 100 each = KES 1,000

┌──────────────────────────────────┐
│ BEFORE PURCHASE                  │
├──────────────────────────────────┤
│ Inventory Asset:    KES 0        │
│ Accounts Payable:   KES 0        │
│ P&L Expense:        KES 0        │
└──────────────────────────────────┘

JOURNAL ENTRY:
DR  Inventory Asset (1201)      KES 1,000
    CR  Accounts Payable (2000)     KES 1,000

┌──────────────────────────────────┐
│ AFTER PURCHASE                   │
├──────────────────────────────────┤
│ Inventory Asset:    KES 1,000 ✅ │
│ Accounts Payable:   KES 1,000 ✅ │
│ P&L Expense:        KES 0     ✅ │  ← NOT an expense yet!
└──────────────────────────────────┘

Quantity: 10 widgets
WAC (Weighted Avg Cost): KES 100
```

### Sales Flow - "Double-Entry Magic"
```
Sell 3 Widgets @ KES 200 each = KES 600 revenue

TWO AUTOMATIC ENTRIES:

┌─────────────────────────────────────────────┐
│ ENTRY 1: REVENUE RECOGNITION                │
│ (What the customer sees)                    │
├─────────────────────────────────────────────┤
│ DR  Accounts Receivable    KES 600          │
│     CR  Sales Revenue          KES 600      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ENTRY 2: COST RECOGNITION                   │
│ (Background - automatic calculation)        │
├─────────────────────────────────────────────┤
│ DR  Cost of Goods Sold     KES 300          │
│     CR  Inventory Asset        KES 300      │
│                                              │
│ COGS = 3 widgets × WAC KES 100 = KES 300   │
└─────────────────────────────────────────────┘

┌──────────────────────────────────┐
│ PROFITABILITY ANALYSIS           │
├──────────────────────────────────┤
│ Revenue:          KES 600        │
│ COGS:            -KES 300        │
├──────────────────────────────────┤
│ Gross Profit:     KES 300        │
│ Margin:           50%            │
└──────────────────────────────────┘

Remaining Inventory: 7 widgets @ WAC KES 100 = KES 700
```

### WAC (Weighted Average Cost) Calculation
```
START:
Purchase 1: Buy 1 widget @ KES 100
└─> Total Value: KES 100, Total Units: 1
    WAC = 100 / 1 = KES 100

Purchase 2: Buy 1 widget @ KES 200
└─> Existing Value: KES 100 (1 × 100)
    New Purchase:   KES 200 (1 × 200)
    Total Value:    KES 300
    Total Units:    2
    WAC = 300 / 2 = KES 150 ← NEW WAC

Sale: Sell 1 widget @ KES 250
└─> COGS = 1 × WAC = 1 × KES 150 = KES 150
    Revenue:      KES 250
    COGS:        -KES 150
    Profit:       KES 100

Remaining: 1 widget @ WAC KES 150
```

### Customer Return (Credit Memo)
```
Customer returns 1 widget sold for KES 200

TWO AUTOMATIC REVERSAL ENTRIES:

ENTRY 1: REVENUE REVERSAL
DR  Sales Returns (4191)           KES 200
    CR  Accounts Receivable (1100)     KES 200

ENTRY 2: COGS REVERSAL
DR  Inventory Asset (1201)         KES 150
    CR  Cost of Goods Sold (5001)      KES 150

Result:
- Customer no longer owes KES 200
- Revenue reduced by KES 200
- Inventory back to 2 widgets
- COGS reduced by KES 150
```

### Inventory Adjustments (Shrinkage)
```
Physical count: 1 widget is damaged/missing

DR  Inventory Shrinkage Expense (5199)  KES 150
    CR  Inventory Asset (1201)              KES 150

Result:
- Inventory reduced by 1 unit
- Expense recognized: KES 150
- P&L Impact: -KES 150 (loss)
```

---

## 📊 Key Reports Available

### 1. Trial Balance
Lists all accounts with debit/credit balances
- Ensures books are balanced
- Total Debits = Total Credits

### 2. Profit & Loss (Income Statement)
```
INCOME:
  Sales Revenue              KES 500,000
  Less: Sales Returns       -KES 10,000
                            ───────────
  Net Revenue                KES 490,000

EXPENSES:
  Cost of Goods Sold         KES 250,000
  Operating Expenses         KES 100,000
                            ───────────
  Total Expenses             KES 350,000

GROSS PROFIT:                KES 240,000
NET INCOME:                  KES 140,000
```

### 3. Balance Sheet
```
ASSETS:
  Cash & Bank                KES 150,000
  Accounts Receivable        KES 50,000
  Inventory                  KES 100,000
  Fixed Assets               KES 500,000
                            ───────────
  TOTAL ASSETS               KES 800,000

LIABILITIES:
  Accounts Payable           KES 200,000
  VAT Payable                KES 50,000
  Loans                      KES 300,000
                            ───────────
  TOTAL LIABILITIES          KES 550,000

EQUITY:
  Owner's Capital            KES 110,000
  Retained Earnings          KES 140,000
                            ───────────
  TOTAL EQUITY               KES 250,000

TOTAL LIABILITIES + EQUITY   KES 800,000 ✅
```

### 4. Inventory Valuation Report
```
┌────────────────────┬─────────┬──────────┬──────────┬──────────┐
│ ITEM               │ QTY     │ WAC      │ VALUE    │ RETAIL   │
├────────────────────┼─────────┼──────────┼──────────┼──────────┤
│ Widget A           │ 100     │ KES 150  │ 15,000   │ 25,000   │
│ Widget B           │ 50      │ KES 200  │ 10,000   │ 15,000   │
│ Widget C           │ 25      │ KES 300  │ 7,500    │ 12,000   │
├────────────────────┼─────────┼──────────┼──────────┼──────────┤
│ TOTAL              │ 175     │          │ 32,500   │ 52,000   │
└────────────────────┴─────────┴──────────┴──────────┴──────────┘

Potential Profit: KES 19,500 (60% margin)
```

### 5. COGS Report
```
PERIOD: January 2024

┌────────────────────┬────────┬──────────┬──────────┐
│ ITEM               │ QTY    │ WAC      │ COGS     │
├────────────────────┼────────┼──────────┼──────────┤
│ Widget A           │ 50     │ KES 150  │ 7,500    │
│ Widget B           │ 20     │ KES 200  │ 4,000    │
│ Widget C           │ 10     │ KES 300  │ 3,000    │
├────────────────────┼────────┼──────────┼──────────┤
│ TOTAL COGS         │ 80     │          │ 14,500   │
└────────────────────┴────────┴──────────┴──────────┘

Revenue:        KES 30,000
COGS:          -KES 14,500
Gross Profit:   KES 15,500 (51.7% margin)
```

### 6. AR Aging Report
```
┌────────────────────┬──────────┬──────────┬──────────┬──────────┐
│ CUSTOMER           │ Current  │ 30 Days  │ 60 Days  │ 90+ Days │
├────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ ABC Ltd            │ 10,000   │ 5,000    │ 0        │ 0        │
│ XYZ Corp           │ 0        │ 0        │ 3,000    │ 2,000    │
│ John's Shop        │ 8,000    │ 0        │ 0        │ 0        │
├────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ TOTAL              │ 18,000   │ 5,000    │ 3,000    │ 2,000    │
└────────────────────┴──────────┴──────────┴──────────┴──────────┘

Total AR: KES 28,000
Overdue: KES 5,000 (18%)
```

---

## 🔑 Key Accounting Principles Implemented

### 1. Double-Entry Bookkeeping
**Every transaction has equal debits and credits**
```
DR  Asset (increases)      KES 1,000
    CR  Liability (increases)  KES 1,000

Total Debits = Total Credits = BALANCED ✅
```

### 2. Accrual Accounting
**Revenue recognized when earned, expenses when incurred (not when paid)**
```
Invoice Created Today    → Revenue recognized TODAY
Customer Pays Next Month → No revenue impact (just asset exchange)
```

### 3. Matching Principle
**Match costs to revenues in the same period**
```
Sell Widget Today:
  - Recognize Revenue:  +KES 200 (income)
  - Recognize COGS:     -KES 100 (expense)
  - Match them TODAY, even if customer pays later
```

### 4. Accounting Equation
**Assets = Liabilities + Equity**
```
Always balanced after every transaction
```

---

## 🚀 What Makes This "Xero-Killer"

1. **Full Automation** ✅
   - No manual accounting entries required
   - System handles all double-entry bookkeeping

2. **Kenyan-Focused** ✅
   - M-PESA, SACCOs, local banks
   - KRA taxes (PAYE, NSSF, NHIF, Housing Levy)
   - VAT 16% auto-calculation

3. **Professional Grade** ✅
   - Weighted Average Cost (WAC)
   - Automatic COGS calculation
   - Complete audit trail

4. **Real-Time Insights** ✅
   - Instant profitability reports
   - Live AR/AP tracking
   - Inventory valuation on demand

5. **Zero Accounting Knowledge Required** ✅
   - User enters: "Sold 3 widgets for KES 600"
   - System automatically:
     * Creates AR entry (+KES 600)
     * Recognizes revenue (+KES 600)
     * Calculates COGS (+KES 300)
     * Updates inventory (-3 units)
     * Updates WAC if needed
     * Creates both journal entries
     * Records stock movement
     * Updates all reports

---

## 📂 Code Structure

```
backend/src/
├── services/
│   ├── accountingService.js          ← Chart of Accounts, VAT, AR/AP logic
│   └── inventoryAccountingService.js ← Inventory, WAC, COGS logic
├── routes/
│   ├── invoices.js                   ← AR endpoints
│   ├── purchases.js                  ← AP endpoints
│   └── inventory.js                  ← Inventory endpoints
└── prisma/
    └── schema.prisma                 ← Database models

Key Functions:
- seedFamilyCoA()              → Auto-create accounts
- createJournalEntry()         → Double-entry posting
- getAccountMapping()          → Category to account mapping
- calculateWAC()               → Weighted Average Cost
- processInventoryPurchase()   → Purchase with accounting
- processInventorySale()       → Sale with COGS
- processCustomerReturn()      → Credit memo logic
```

---

## 💡 How to Explain to Someone

### Elevator Pitch (30 seconds)
*"I built a professional accounting system that automatically handles all the complex bookkeeping. When you sell something, it automatically calculates your profit by tracking the cost of what you sold (COGS), manages customer debts (AR), supplier debts (AP), calculates VAT, and keeps perfect accounting records - all while you just record simple transactions like 'sold 3 widgets for KES 600'."*

### Department Manager (2 minutes)
*"The system implements full double-entry bookkeeping with 200+ pre-configured accounts. It automatically:*
- *Tracks what customers owe you (AR) and what you owe suppliers (AP)*
- *Calculates VAT on every transaction and tracks what you owe KRA*
- *Uses Weighted Average Cost to accurately calculate inventory costs*
- *Automatically creates Cost of Goods Sold entries when you sell items*
- *Generates professional financial reports (P&L, Balance Sheet, Trial Balance)*
- *Maintains complete audit trails for compliance*

*Users don't need to understand accounting - they just record sales and purchases, and the system handles everything else."*

### Technical Presentation (10 minutes)
*Use the full IMPLEMENTATION_SUMMARY.md document with examples:*
1. Show Chart of Accounts structure
2. Demonstrate VAT calculation with examples
3. Explain AR/AP workflows with journal entries
4. Walk through complete inventory transaction flow
5. Show WAC calculation step-by-step
6. Present sample reports

---

## 📝 Summary Stats

- **200+** pre-configured accounts
- **16%** VAT automatically calculated
- **100%** double-entry balanced transactions
- **Real-time** financial reporting
- **Zero** accounting knowledge required from users
- **Complete** audit trail for all transactions
- **Professional** Grade accounting (Xero/QuickBooks equivalent)
- **Kenya-focused** with local payment methods and taxes

---

**Built By:** Omondi Software Engineer  
**Date:** February 2024  
**Status:** Production-Ready 🚀
