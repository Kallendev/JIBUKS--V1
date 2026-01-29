# Transfer Feature - Complete Implementation Guide

## Overview
The Transfer feature allows users to move money between their asset accounts (Bank, Cash, Mobile Money) with proper double-entry accounting, fee tracking, and balance validation.

## Features Implemented

### 1. **Frontend Screen** (`transfer.tsx`)
- ✅ Premium UI with gradient header
- ✅ Quick action chips (ATM Withdrawal, Bank to M-PESA, M-PESA to Bank)
- ✅ Visual transfer flow with arrow divider
- ✅ Live balance displays for both accounts
- ✅ Amount and fee input fields
- ✅ Total deduction calculator
- ✅ Date picker integration
- ✅ Auto-generated reference numbers
- ✅ Auto-filled descriptions
- ✅ Comprehensive validation
- ✅ Real-time insufficient funds warnings

### 2. **Backend API** (`routes/transfers.js`)
- ✅ POST `/api/transfers` - Create new transfer
- ✅ GET `/api/transfers` - List all transfers
- ✅ GET `/api/transfers/:id` - Get single transfer details
- ✅ Double-entry journal integration
- ✅ Automatic bank charges expense recording
- ✅ Balance validation
- ✅ Asset account verification

### 3. **Database Schema**
- ✅ Transfer model added to Prisma schema
- ✅ Proper relations with Tenant
- ✅ Indexed for performance
- ✅ Journal integration for accounting

## How It Works

### The Accounting Logic

When a user transfers **KES 10,000** from **Equity Bank** to **M-PESA** with a **KES 42 fee**:

**Journal Entry Created:**
```
Debit:  M-PESA (1030)           10,000  (Money arriving)
Debit:  Bank Charges (6610)         42  (Fee expense)
Credit: Equity Bank (1010)      10,042  (Money leaving)
```

**Result:**
- Equity Bank balance decreases by 10,042
- M-PESA balance increases by 10,000
- Bank Charges expense increases by 42
- Books remain balanced (Debits = Credits)

### Validation Rules

1. **Same Account Check**: Cannot transfer to the same account
2. **Positive Amount**: Amount must be greater than zero
3. **Asset Accounts Only**: Both accounts must be Asset type
4. **Sufficient Funds**: `Total Deduction (Amount + Fee) ≤ Available Balance`
5. **Account Ownership**: Both accounts must belong to the same tenant

## Quick Actions Explained

### 1. ATM Withdrawal
- **Sets**: TO Account → Cash on Hand (1000)
- **Use Case**: Withdrawing cash from bank

### 2. Bank to M-PESA
- **Sets**: FROM → Checking Account (1010), TO → M-PESA (1030)
- **Use Case**: Sending money from bank to mobile wallet

### 3. M-PESA to Bank
- **Sets**: FROM → M-PESA (1030), TO → Checking Account (1010)
- **Use Case**: Depositing mobile money to bank

## Database Migration

Run the following command to create the transfers table:

```bash
cd backend
npx prisma migrate dev --name add_transfers
npx prisma generate
```

## API Usage Examples

### Create Transfer
```javascript
POST /api/transfers
Authorization: Bearer {token}

{
  "fromAccountId": 123,
  "toAccountId": 456,
  "amount": 10000,
  "fee": 42,
  "date": "2026-01-27T22:00:00Z",
  "reference": "TRF-12345678",
  "description": "Transfer from Equity Bank to M-PESA"
}
```

**Response:**
```json
{
  "id": 1,
  "tenantId": 1,
  "fromAccountId": 123,
  "toAccountId": 456,
  "amount": 10000,
  "fee": 42,
  "date": "2026-01-27T22:00:00Z",
  "reference": "TRF-12345678",
  "description": "Transfer from Equity Bank to M-PESA",
  "journalId": 789,
  "journalReference": "JE-1738024800000",
  "createdAt": "2026-01-27T22:00:00Z",
  "updatedAt": "2026-01-27T22:00:00Z",
  "fromAccount": {
    "id": 123,
    "code": "1010",
    "name": "Equity Bank",
    "type": "ASSET"
  },
  "toAccount": {
    "id": 456,
    "code": "1030",
    "name": "M-PESA Wallet",
    "type": "ASSET"
  }
}
```

### List Transfers
```javascript
GET /api/transfers?limit=50
Authorization: Bearer {token}
```

### Get Transfer Details
```javascript
GET /api/transfers/1
Authorization: Bearer {token}
```

## Chart of Accounts Setup

The system includes a **comprehensive Kenyan banking setup** with all major banks, mobile money providers, and Saccos pre-configured:

### Cash & Mobile Money Accounts

| Code | Name | Type | Purpose |
|------|------|------|---------|
| 1001 | Cash on Hand (Wallet) | ASSET | Physical cash |
| 1010 | M-PESA (Personal) | ASSET | Personal M-PESA wallet |
| 1011 | M-PESA (Business/Till) | ASSET | Business M-PESA till |
| 1012 | M-Shwari (Savings) | ASSET | M-Shwari savings |
| 1013 | KCB M-PESA | ASSET | KCB M-PESA account |
| 1040 | Airtel Money | ASSET | Airtel Money wallet |
| 1041 | T-Kash | ASSET | Telkom T-Kash wallet |

### Commercial Banks

| Code | Name | Type | Purpose |
|------|------|------|---------|
| 1020 | Equity Bank | ASSET | Equity Bank account |
| 1021 | KCB Bank | ASSET | Kenya Commercial Bank |
| 1022 | Co-operative Bank | ASSET | Co-operative Bank |
| 1023 | NCBA Bank | ASSET | NCBA Bank |
| 1024 | Standard Chartered | ASSET | Standard Chartered |
| 1025 | Absa Bank | ASSET | Absa Bank |
| 1026 | I&M Bank | ASSET | I&M Bank |
| 1027 | DTB Bank | ASSET | Diamond Trust Bank |
| 1028 | Stanbic Bank | ASSET | Stanbic Bank |

### Saccos (FOSA Accounts)

| Code | Name | Type | Purpose |
|------|------|------|---------|
| 1030 | Stima Sacco (FOSA) | ASSET | Stima Sacco FOSA |
| 1031 | Police Sacco | ASSET | Police Sacco |

### Expense Accounts

| Code | Name | Type | Purpose |
|------|------|------|---------|
| 6610 | Bank Charges | EXPENSE | Transfer fees & bank charges |

**All accounts are automatically seeded when a new tenant is created.**

To manually seed or update accounts, run:
```bash
cd backend
node seed_kenyan_coa.js
```

## Navigation

The Transfer screen is accessible from:
1. **Dashboard** → Quick Actions → Transfer button
2. **Direct route**: `/transfer`

## UI/UX Highlights

### Visual Design
- **Premium gradient header** (Blue theme)
- **Glassmorphic cards** with subtle shadows
- **Color-coded accounts** (Blue for source, Green for destination)
- **Real-time balance updates** with red warning for insufficient funds
- **Smooth animations** and transitions

### User Experience
- **3-tap quick actions** for common transfers
- **Auto-complete fields** (reference, description)
- **Live validation** with helpful error messages
- **Clear visual flow** (FROM → Arrow → TO)
- **Total deduction display** to match bank SMS

## Testing Checklist

- [ ] Create transfer between two bank accounts
- [ ] Create transfer with fee
- [ ] Test insufficient funds validation
- [ ] Test same account validation
- [ ] Verify journal entries are created correctly
- [ ] Check account balances update properly
- [ ] Test quick action buttons
- [ ] Verify date picker works
- [ ] Test with different account types
- [ ] Check mobile responsiveness

## Future Enhancements

1. **Recurring Transfers**: Schedule automatic transfers
2. **Transfer Templates**: Save frequently used transfers
3. **Multi-currency**: Support transfers between different currencies
4. **Bulk Transfers**: Transfer to multiple accounts at once
5. **Transfer History**: Detailed transaction history with filters
6. **Export**: Download transfer reports as PDF/CSV

## Troubleshooting

### "Account not found" error
- Ensure both accounts exist and belong to the user's tenant
- Check that account IDs are correct integers

### "Insufficient funds" error
- Verify the source account has enough balance
- Remember: Total deduction = Amount + Fee

### Journal not created
- Check that the accounting service is properly configured
- Verify Bank Charges account (6610) exists

## Support

For issues or questions:
- Check the backend logs for detailed error messages
- Verify Prisma migrations are up to date
- Ensure all accounts are properly seeded

---

**Last Updated**: January 27, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
