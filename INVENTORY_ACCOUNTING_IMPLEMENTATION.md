# Inventory Accounting Implementation

## Overview

This document describes the comprehensive inventory accounting logic implemented in JIBUKS--V1. The system follows professional accounting standards with full double-entry bookkeeping integration.

## Core Account Types

The inventory module relies on three specific types of accounts in the Chart of Accounts:

| Account Type | Account Code | Description | Category |
|-------------|--------------|-------------|----------|
| **Inventory Asset** | 1201 | Merchandise Inventory - Value of items you own but haven't sold yet | Current Asset (Balance Sheet) |
| **Cost of Goods Sold (COGS)** | 5001 | Cost of Sales - Represents the cost of items you have sold | Expense (Profit & Loss) |
| **Sales Revenue** | 4100 | Product Sales - The retail price charged to customers | Income (Profit & Loss) |

---

## 1. Purchase Logic (Buying Stock)

When you create a Bill or Purchase Order to buy items for resale, the software **does NOT expense that money immediately**. Even though cash left the bank, it is not yet a "loss" or "expense" on the P&L; it is just an **exchange of assets** (Cash for Inventory).

### The Logic

**Example:** Buy 10 Widgets for $10 each ($100 total)

**Journal Entry:**
| Account | Debit | Credit | Description |
|---------|-------|--------|-------------|
| Inventory Asset (1201) | $100 | | Increase in inventory value |
| Accounts Payable (2000) | | $100 | Liability to supplier |

**Result:**
- P&L shows **$0 expense**
- Balance Sheet shows **$100 in Inventory**
- The cost is "stored" on the Balance Sheet until the item is sold

### API Endpoint
```
POST /api/purchases
```

The `processInventoryPurchase()` function in `inventoryAccountingService.js` handles this automatically when a purchase contains inventory items.

---

## 2. Sales Logic (The "Double-Entry Magic")

This is where modern accounting apps differ from manual spreadsheets. When you create an Invoice or Sales Receipt, the software performs **two distinct accounting transactions simultaneously**.

### The Scenario
You sell 1 Widget for $50 (which you bought for $10).

### Transaction A: The Revenue (What the customer sees)

| Account | Debit | Credit | Description |
|---------|-------|--------|-------------|
| Accounts Receivable (1100) | $50 | | Customer owes you money |
| Sales Revenue (4100) | | $50 | You earned income |

**Result:** You have recognized $50 in sales.

### Transaction B: The Cost (What happens in the background)

| Account | Debit | Credit | Description |
|---------|-------|--------|-------------|
| Cost of Goods Sold (5001) | $10 | | Expense recognized for cost |
| Inventory Asset (1201) | | $10 | Inventory decreases |

**Result:** The asset is removed from your balance sheet, and the expense is finally recognized to match the revenue (Matching Principle).

### Net Profit Calculation
```
$50 (Revenue) - $10 (COGS) = $40 Gross Profit
```

### API Endpoint
```
POST /api/invoices
```

The `processInventorySale()` function in `inventoryAccountingService.js` automatically creates the COGS journal entry when an invoice contains inventory items.

---

## 3. The Costing Method: Weighted Average Cost (WAC)

### Why WAC?
How does the software know that the widget cost $10? This is the most complex part of inventory logic. JIBUKS uses the **Weighted Average Cost** method (used by Xero, QuickBooks Desktop, and many modern apps).

### How WAC Works

The software constantly recalculates the average cost of all units on hand:

**Example:**
| Date | Transaction | Units | Unit Cost | Total Value | New WAC |
|------|-------------|-------|-----------|-------------|---------|
| Jan 1 | Buy | 1 | $10 | $10 | $10 |
| Jan 2 | Buy | 1 | $20 | $30 | $15 |
| Jan 3 | Sell 1 | -1 | @ $15 | - | $15 |

**Calculation after Jan 2:**
- Total Value = $10 + $20 = $30
- Total Units = 2
- Average Cost = $30 / 2 = **$15**

**On Sale (Jan 3):**
- COGS = 1 × $15 = **$15** (sent to expense)
- Remaining Asset Value = $15

### WAC Formula
```
New WAC = (Existing Inventory Value + New Purchase Value) / Total Units
```

### Implementation
The `calculateWAC()` function in `inventoryAccountingService.js` performs this calculation on every purchase.

---

## 4. Customer Returns (Credit Memo)

When a customer returns an item, the logic reverses both transactions:

### Revenue Reversal
| Account | Debit | Credit | Description |
|---------|-------|--------|-------------|
| Sales Returns (4191) | $50 | | Reduce sales |
| Accounts Receivable (1100) | | $50 | Reduce what customer owes |

### COGS Reversal (Item back to stock)
| Account | Debit | Credit | Description |
|---------|-------|--------|-------------|
| Inventory Asset (1201) | $15 | | Item goes back to stock |
| Cost of Goods Sold (5001) | | $15 | Reverse the expense |

### API Endpoint
```
POST /api/inventory/credit-memo
```

**Example Request:**
```json
{
  "invoiceId": 123,
  "creditMemoNumber": "CM-001",
  "items": [
    { "inventoryItemId": 1, "quantity": 1, "sellingPrice": 50 }
  ],
  "date": "2024-01-15"
}
```

---

## 5. Inventory Adjustments (Shrinkage)

If you count your stock and find you have 9 widgets instead of 10 (due to theft, damage, or loss), you use an **Inventory Quantity Adjustment**.

### The Logic
The software calculates the value of the missing item using WAC (e.g., $15).

**Journal Entry:**
| Account | Debit | Credit | Description |
|---------|-------|--------|-------------|
| Inventory Shrinkage Expense | $15 | | Loss recognized |
| Inventory Asset (1201) | | $15 | Stock value decreases |

### Adjustment Types

| Reason | Type | Debit Account | Credit Account |
|--------|------|---------------|----------------|
| DAMAGED | OUT | Shrinkage Expense | Inventory Asset |
| EXPIRED | OUT | Shrinkage Expense | Inventory Asset |
| THEFT | OUT | Shrinkage Expense | Inventory Asset |
| LOST | OUT | Shrinkage Expense | Inventory Asset |
| FOUND | IN | Inventory Asset | Other Income |
| COUNT_ADJUSTMENT | VARIES | Depends on result | Depends on result |

### API Endpoints

**Manual Adjustment:**
```
POST /api/inventory/adjust
```

**Example Request:**
```json
{
  "itemId": 1,
  "reason": "DAMAGED",
  "quantity": 2,
  "notes": "Products damaged during shipping"
}
```

**Physical Count:**
```
POST /api/inventory/physical-count
```

**Example Request:**
```json
{
  "itemId": 1,
  "actualQuantity": 8,
  "notes": "Monthly stock count"
}
```

---

## 6. Summary: Impact on Chart of Accounts

| Action | Inventory Asset | COGS | Sales Income | Cash / AP / AR |
|--------|----------------|------|--------------|----------------|
| **Buy Item** | Increases (Debit) | No Change | No Change | Decreases Cash or Increases AP |
| **Sell Item** | Decreases (Credit) | Increases (Debit) | Increases (Credit) | Increases Cash or Increases AR |
| **Return Item** | Increases (Debit) | Decreases (Credit) | Decreases (Debit) | Decreases Cash or Decreases AR |
| **Lost/Stolen** | Decreases (Credit) | Increases (Debit)* | No Change | No Change |

*Note: Lost items usually hit a specific expense account like "Shrinkage" rather than standard COGS, but the effect on Net Income is the same.

---

## 7. API Reference

### Inventory Accounting Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inventory/credit-memo` | Process customer return |
| POST | `/api/inventory/adjust` | Process inventory adjustment |
| POST | `/api/inventory/physical-count` | Record physical count |
| GET | `/api/inventory/accounting/valuation` | Get inventory valuation report |
| GET | `/api/inventory/:itemId/history` | Get stock movement history |
| GET | `/api/inventory/cogs-report` | Get COGS report for period |

### Purchase Endpoints (with inventory integration)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/purchases` | Create purchase (auto-updates inventory & WAC) |
| GET | `/api/purchases` | List all purchases |
| PUT | `/api/purchases/:id` | Update purchase |

### Invoice Endpoints (with COGS integration)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/invoices` | Create invoice (auto-creates COGS entry) |
| GET | `/api/invoices` | List all invoices |
| POST | `/api/invoices/:id/payment` | Record payment |

---

## 8. Key Service Functions

Located in `src/services/inventoryAccountingService.js`:

| Function | Description |
|----------|-------------|
| `calculateWAC()` | Calculate new Weighted Average Cost after purchase |
| `calculateCOGS()` | Calculate COGS for a sale |
| `processInventoryPurchase()` | Full accounting for inventory purchase |
| `processInventorySale()` | Full accounting for inventory sale (COGS) |
| `processCustomerReturn()` | Full accounting for customer returns |
| `processInventoryAdjustment()` | Full accounting for adjustments |
| `getInventoryValuation()` | Get inventory valuation report |

---

## 9. Database Models

### InventoryItem
- **weightedAvgCost**: Current WAC
- **costPrice**: Last purchase price
- **quantity**: Current stock on hand
- **assetAccountId**: Links to Inventory Asset account
- **cogsAccountId**: Links to COGS account
- **incomeAccountId**: Links to Sales Revenue account

### StockMovement
- **type**: IN, OUT, ADJUSTMENT, TRANSFER
- **reason**: PURCHASE, SALE, CUSTOMER_RETURN, DAMAGED, etc.
- **unitCost**: Cost at time of movement
- **wacBefore/wacAfter**: Track WAC changes
- **qtyBefore/qtyAfter**: Track stock level changes
- **journalId**: Links to accounting journal entry

### InventoryValuation
- Tracks historical cost changes
- Audit trail for WAC recalculations
- Used for reporting and analysis

---

## 10. Best Practices

1. **Always record purchases before sales** - Ensures WAC is calculated correctly
2. **Use physical counts regularly** - Catch discrepancies early
3. **Review COGS reports monthly** - Monitor profit margins
4. **Check inventory valuation** - Verify balance sheet accuracy
5. **Investigate shrinkage** - High shrinkage indicates problems

---

## Architecture Diagram

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   PURCHASES     │      │    INVOICES      │      │   ADJUSTMENTS   │
│   (Frontend)    │      │   (Frontend)     │      │   (Frontend)    │
└────────┬────────┘      └────────┬─────────┘      └────────┬────────┘
         │                        │                         │
         ▼                        ▼                         ▼
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│ purchases.js    │      │  invoices.js     │      │  inventory.js   │
│ (Routes)        │      │  (Routes)        │      │  (Routes)       │
└────────┬────────┘      └────────┬─────────┘      └────────┬────────┘
         │                        │                         │
         └────────────────────────┼─────────────────────────┘
                                  │
                                  ▼
         ┌──────────────────────────────────────────────────────┐
         │         inventoryAccountingService.js                │
         │  ┌───────────────┐  ┌────────────────┐  ┌──────────┐ │
         │  │ processPurchase│  │ processSale   │  │ Adjust   │ │
         │  │ calculateWAC  │  │ calculateCOGS │  │ Returns  │ │
         │  └───────────────┘  └────────────────┘  └──────────┘ │
         └───────────────────────────┬──────────────────────────┘
                                     │
                                     ▼
         ┌──────────────────────────────────────────────────────┐
         │                 DATABASE (Prisma)                    │
         │  ┌─────────────┐  ┌───────────────┐  ┌────────────┐  │
         │  │InventoryItem│  │ StockMovement │  │ Journal    │  │
         │  │  (WAC, Qty) │  │  (Audit Trail)│  │ (Entries)  │  │
         │  └─────────────┘  └───────────────┘  └────────────┘  │
         └──────────────────────────────────────────────────────┘
```

---

## 11. Frontend Screens

The following React Native (Expo) screens are available for inventory accounting:

### Inventory Management Screens

| Screen | File | Description |
|--------|------|-------------|
| **Inventory List** | `app/inventory.tsx` | Main inventory dashboard with search, filters, and quick actions |
| **Inventory Detail** | `app/inventory-detail.tsx` | View single item details with stock info and quick actions |
| **New Inventory Item** | `app/new-inventory-item.tsx` | Create new inventory item |
| **Stock Adjustment** | `app/stock-adjustment.tsx` | Adjust stock levels (add, remove, physical count) |
| **Item History** | `app/item-history.tsx` | Timeline view of all stock movements for an item |

### Accounting & Reports Screens

| Screen | File | Description |
|--------|------|-------------|
| **Inventory Valuation** | `app/inventory-valuation.tsx` | Comprehensive valuation report with category breakdown |
| **COGS Report** | `app/cogs-report.tsx` | Cost of Goods Sold analysis with date filtering |
| **Credit Memo** | `app/credit-memo.tsx` | Process customer returns with invoice selection |

### Navigation Flow

```
Inventory (Main) → Quick Actions:
├── [Valuation] → Inventory Valuation Report
├── [COGS] → COGS Report
├── [Returns] → Credit Memo
└── [+ Add Item] → New Inventory Item

Inventory Item Card → Actions:
├── [Adjust] → Stock Adjustment
├── [Details] → Inventory Detail
│   ├── [Add Stock] → Stock Adjustment (IN)
│   ├── [Remove] → Stock Adjustment (OUT)
│   ├── [Adjust] → Stock Adjustment
│   └── [History] → Item History
└── [Search/Filter] → Filtered List
```

### Screen Features

#### Inventory Valuation (`inventory-valuation.tsx`)
- Total cost value and retail value
- Potential profit calculation
- Average margin with visual indicator
- Category breakdown with progress bars
- Top items by value (ranked list)
- Balance sheet impact notification
- Quick navigation to related screens

#### COGS Report (`cogs-report.tsx`)
- Date range filtering (This Month, Last Month, YTD)
- Total COGS for period
- Transaction count
- Category breakdown with percentages
- Top items by COGS (ranked with medals)
- Journal entry visualization
- Accounting insight explanations

#### Credit Memo (`credit-memo.tsx`)
- Invoice selection dropdown
- Invoice summary display
- Item selection with checkboxes
- Return quantity adjustment per item
- Total refund calculation
- Accounting impact preview
- Notes field for return reason

#### Stock Adjustment (`stock-adjustment.tsx`)
- Item selection dropdown
- Current stock display
- Adjustment type tabs (Stock Take, Stock In, Stock Out)
- Reason picker (Damage, Theft, Expired, etc.)
- Quantity input with variance calculator
- Unit cost input (for stock in)
- Notes/reference field
- WAC impact notification

#### Item History (`item-history.tsx`)
- Item summary with current stock
- WAC and stock value metrics
- Timeline visualization of movements
- Movement details including:
  - Type (Purchase, Sale, Adjustment)
  - Quantity change
  - Unit cost and total value
  - WAC before/after
  - Reference and journal links
- Quick actions (Adjust, Details, Valuation)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2024-02-05 | Added frontend screens for inventory accounting |
| 1.0 | 2024-02-05 | Initial inventory accounting implementation |

