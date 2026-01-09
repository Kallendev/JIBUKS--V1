# JIBUKS API Contracts - Family Dashboard

## Overview
This document defines the API endpoints and data contracts required for the Family Dashboard feature.

---

## Base URL
```
Production: https://api.jibuks.com/v1
Development: http://localhost:3000/api
```

---

## Authentication
All API requests require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Get Family Dashboard Summary

**Endpoint:** `GET /api/family/dashboard`

**Description:** Returns a comprehensive summary of the family's financial dashboard including members, goals, budgets, and spending.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| month | number | No | Month for budget data (1-12). Default: current month |
| year | number | No | Year for budget data. Default: current year |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "familyId": "fam_123456",
    "familyName": "The Johnsons",
    "totalMembers": 4,
    "activeGoals": 3,
    "totalBudget": 150000,
    "monthlySpending": 87500,
    "recentGoals": [
      {
        "id": "goal_1",
        "name": "New Car Fund",
        "description": "Saving for a new family car",
        "target": 500000,
        "current": 125000,
        "deadline": "2026-12-31",
        "status": "ACTIVE",
        "createdBy": "user_123",
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2026-01-06T00:00:00Z"
      }
    ],
    "budgetOverview": [
      {
        "id": "budget_1",
        "category": "Groceries",
        "allocated": 40000,
        "spent": 32000,
        "remaining": 8000,
        "month": "01",
        "year": 2026
      }
    ],
    "members": [
      {
        "id": "user_123",
        "name": "John Johnson",
        "email": "john@example.com",
        "role": "ADMIN",
        "avatarUrl": "https://...",
        "phoneNumber": "+254712345678",
        "joinedAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**TypeScript Interface:**
```typescript
interface DashboardResponse {
  success: boolean;
  data: FamilyDashboard;
}

interface FamilyDashboard {
  familyId: string;
  familyName: string;
  totalMembers: number;
  activeGoals: number;
  totalBudget: number;
  monthlySpending: number;
  recentGoals: FamilyGoal[];
  budgetOverview: BudgetCategory[];
  members: FamilyMember[];
}
```

---

### 2. Get Family Goals

**Endpoint:** `GET /api/family/goals`

**Description:** Returns all goals for the authenticated user's family.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status: ACTIVE, COMPLETED, CANCELLED |
| limit | number | No | Number of goals to return (default: 10) |
| offset | number | No | Pagination offset (default: 0) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "goal_1",
        "name": "New Car Fund",
        "description": "Saving for a new family car",
        "target": 500000,
        "current": 125000,
        "deadline": "2026-12-31",
        "status": "ACTIVE",
        "createdBy": "user_123",
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2026-01-06T00:00:00Z"
      }
    ],
    "total": 3,
    "limit": 10,
    "offset": 0
  }
}
```

**TypeScript Interface:**
```typescript
interface GoalsResponse {
  success: boolean;
  data: {
    goals: FamilyGoal[];
    total: number;
    limit: number;
    offset: number;
  };
}
```

---

### 3. Get Budget Overview

**Endpoint:** `GET /api/family/budgets/overview`

**Description:** Returns budget summary for the specified month and year.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| month | number | Yes | Month (1-12) |
| year | number | Yes | Year (e.g., 2026) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "month": "01",
    "year": 2026,
    "totalAllocated": 150000,
    "totalSpent": 87500,
    "totalRemaining": 62500,
    "categories": [
      {
        "id": "budget_1",
        "category": "Groceries",
        "allocated": 40000,
        "spent": 32000,
        "remaining": 8000,
        "month": "01",
        "year": 2026
      },
      {
        "id": "budget_2",
        "category": "Transport",
        "allocated": 25000,
        "spent": 18000,
        "remaining": 7000,
        "month": "01",
        "year": 2026
      }
    ]
  }
}
```

**TypeScript Interface:**
```typescript
interface BudgetOverviewResponse {
  success: boolean;
  data: {
    month: string;
    year: number;
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
    categories: BudgetCategory[];
  };
}
```

---

### 4. Create Family Goal

**Endpoint:** `POST /api/family/goals`

**Description:** Creates a new family goal.

**Request Body:**
```json
{
  "name": "New Car Fund",
  "description": "Saving for a new family car",
  "target": 500000,
  "deadline": "2026-12-31"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "goal_123",
    "name": "New Car Fund",
    "description": "Saving for a new family car",
    "target": 500000,
    "current": 0,
    "deadline": "2026-12-31",
    "status": "ACTIVE",
    "createdBy": "user_123",
    "createdAt": "2026-01-07T00:00:00Z",
    "updatedAt": "2026-01-07T00:00:00Z"
  }
}
```

---

### 5. Get Family Members

**Endpoint:** `GET /api/family/members`

**Description:** Returns all members of the authenticated user's family.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "user_123",
        "name": "John Johnson",
        "email": "john@example.com",
        "role": "ADMIN",
        "avatarUrl": "https://...",
        "phoneNumber": "+254712345678",
        "joinedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "total": 4
  }
}
```

---

### 6. Create Transaction

**Endpoint:** `POST /api/family/transactions`

**Description:** Creates a new transaction (income or expense).

**Request Body:**
```json
{
  "amount": 5000,
  "type": "EXPENSE",
  "category": "Groceries",
  "description": "Weekly shopping",
  "date": "2026-01-07"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "txn_123",
    "amount": 5000,
    "type": "EXPENSE",
    "category": "Groceries",
    "description": "Weekly shopping",
    "date": "2026-01-07T00:00:00Z",
    "createdBy": "user_123",
    "familyId": "fam_123"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing authentication token |
| FORBIDDEN | 403 | User doesn't have permission |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| SERVER_ERROR | 500 | Internal server error |

---

## Rate Limiting
- 100 requests per minute per user
- 429 status code when limit exceeded

---

## Notes
- All monetary values are in KES (Kenyan Shillings) as integers (cents)
- Dates are in ISO 8601 format (YYYY-MM-DD or with time)
- All timestamps include timezone information (UTC)

---

## Family Settings Endpoints

### 7. Get Family Settings

**Endpoint:** `GET /api/family/settings`

**Description:** Returns comprehensive family settings including family info, members with permissions, and pending invitations.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "family": {
      "id": 1,
      "name": "The Johnsons",
      "avatar": "https://...",
      "createdAt": "2025-12-01T00:00:00Z",
      "totalMembers": 4,
      "activeGoals": 3,
      "creatorId": 1
    },
    "members": [
      {
        "id": "user_123",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "Parent",
        "status": "Active",
        "avatar": "https://...",
        "joinedAt": "2025-12-01T00:00:00Z",
        "permissions": {
          "canView": true,
          "canAdd": true,
          "canEdit": true,
          "canDelete": true,
          "canViewBudgets": true,
          "canEditBudgets": true,
          "canViewGoals": true,
          "canContributeGoals": true,
          "canInvite": true,
          "canRemove": true
        }
      }
    ],
    "pendingInvitations": [
      {
        "id": 101,
        "email": "david@example.com",
        "role": "Child",
        "sentAt": "2026-01-05T00:00:00Z",
        "status": "Pending"
      }
    ]
  }
}
```

---

### 8. Update Family Profile

**Endpoint:** `PUT /api/family`

**Description:** Updates family name and/or avatar.

**Request Body:**
```json
{
  "name": "The Smith Family",
  "avatar": "base64_encoded_image_or_url"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "The Smith Family",
    "avatar": "https://...",
    "updatedAt": "2026-01-07T00:00:00Z"
  }
}
```

---

### 9. Get Member Permissions

**Endpoint:** `GET /api/family/members/:id/permissions`

**Description:** Returns detailed permissions for a specific family member.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "memberId": "user_123",
    "role": "Child",
    "permissions": {
      "canView": true,
      "canAdd": false,
      "canEdit": false,
      "canDelete": false,
      "canViewBudgets": true,
      "canEditBudgets": false,
      "canViewGoals": true,
      "canContributeGoals": true,
      "canInvite": false,
      "canRemove": false
    }
  }
}
```

---

### 10. Update Member Permissions

**Endpoint:** `PUT /api/family/members/:id/permissions`

**Description:** Updates permissions for a specific family member.

**Request Body:**
```json
{
  "permissions": {
    "canView": true,
    "canAdd": true,
    "canEdit": false,
    "canDelete": false,
    "canViewBudgets": true,
    "canEditBudgets": true,
    "canViewGoals": true,
    "canContributeGoals": true,
    "canInvite": false,
    "canRemove": false
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "memberId": "user_123",
    "permissions": { /* updated permissions */ },
    "updatedAt": "2026-01-07T00:00:00Z"
  }
}
```

---

### 11. Update Member Role

**Endpoint:** `PUT /api/family/members/:id/role`

**Description:** Changes a member's role in the family.

**Request Body:**
```json
{
  "role": "Parent"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "memberId": "user_123",
    "role": "Parent",
    "updatedAt": "2026-01-07T00:00:00Z"
  }
}
```

---

### 12. Remove Family Member

**Endpoint:** `DELETE /api/family/members/:id`

**Description:** Removes a member from the family.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

### 13. Get Pending Invitations

**Endpoint:** `GET /api/family/invitations/pending`

**Description:** Returns all pending invitations for the family.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "invitations": [
      {
        "id": 101,
        "email": "david@example.com",
        "role": "Child",
        "sentAt": "2026-01-05T00:00:00Z",
        "status": "Pending"
      }
    ],
    "total": 1
  }
}
```

---

### 14. Resend Invitation

**Endpoint:** `POST /api/family/invitations/:id/resend`

**Description:** Resends a pending invitation email.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invitation resent successfully",
  "data": {
    "invitationId": 101,
    "resentAt": "2026-01-07T00:00:00Z"
  }
}
```

---

### 15. Cancel Invitation

**Endpoint:** `DELETE /api/family/invitations/:id`

**Description:** Cancels a pending invitation.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invitation cancelled successfully"
}
```

---

### 16. Leave Family

**Endpoint:** `DELETE /api/family/leave`

**Description:** Removes the current user from their family.

**Success Response (200):**
```json
{
  "success": true,
  "message": "You have left the family successfully"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Family creator cannot leave. Transfer ownership or delete the family."
  }
}
```

---

### 17. Delete Family

**Endpoint:** `DELETE /api/family`

**Description:** Permanently deletes the family and all associated data. Only the family creator can perform this action.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Family deleted successfully"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only the family creator can delete the family"
  }
}
```

---

## TypeScript Interfaces for Family Settings

```typescript
export type FamilyRole = 'Parent' | 'Child' | 'Guardian' | 'Other';
export type MemberStatus = 'Active' | 'Pending' | 'Inactive';

export interface MemberPermissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewBudgets: boolean;
  canEditBudgets: boolean;
  canViewGoals: boolean;
  canContributeGoals: boolean;
  canInvite: boolean;
  canRemove: boolean;
}

export interface FamilyMemberDetailed {
  id: string;
  name: string;
  email: string;
  role: FamilyRole;
  status: MemberStatus;
  avatar?: string | null;
  joinedAt: string;
  permissions: MemberPermissions;
}

export interface PendingInvitation {
  id: number;
  email: string;
  role: FamilyRole;
  sentAt: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
}

export interface FamilySettings {
  family: {
    id: number;
    name: string;
    avatar: string | null;
    createdAt: string;
    totalMembers: number;
    activeGoals: number;
    creatorId: number;
  };
  members: FamilyMemberDetailed[];
  pendingInvitations: PendingInvitation[];
}
```

---

## Enhanced Dashboard Endpoints

### 18. Get Transactions

**Endpoint:** `GET /api/transactions`

**Description:** Returns all family transactions with optional filtering.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Filter by start date (ISO 8601) |
| endDate | string | No | Filter by end date (ISO 8601) |
| type | string | No | Filter by type: income, expense |
| category | string | No | Filter by category name |
| limit | number | No | Number of transactions to return (default: 50) |
| offset | number | No | Pagination offset (default: 0) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 1,
        "name": "Supermarket",
        "amount": -2400,
        "date": "2026-01-08T15:24:00Z",
        "time": "3:24 PM",
        "category": "Food",
        "icon": "cart",
        "member": "Sarah",
        "type": "expense"
      },
      {
        "id": 2,
        "name": "Salary",
        "amount": 50000,
        "date": "2026-01-08T12:00:00Z",
        "time": "12:00 PM",
        "category": "Income",
        "icon": "cash",
        "member": "John",
        "type": "income"
      }
    ],
    "total": 125,
    "limit": 50,
    "offset": 0
  }
}
```

**TypeScript Interface:**
```typescript
interface TransactionItem {
  id: number;
  name: string;
  amount: number; // negative for expenses, positive for income
  date: string;
  time?: string;
  category: string;
  icon?: string;
  member?: string;
  type: 'income' | 'expense';
}

interface TransactionsResponse {
  success: boolean;
  data: {
    transactions: TransactionItem[];
    total: number;
    limit: number;
    offset: number;
  };
}
```

---

### 19. Create Transaction

**Endpoint:** `POST /api/transactions`

**Description:** Creates a new transaction (income or expense).

**Request Body:**
```json
{
  "name": "Supermarket",
  "amount": 2400,
  "type": "expense",
  "category": "Food",
  "date": "2026-01-08T15:24:00Z",
  "icon": "cart"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Supermarket",
    "amount": -2400,
    "type": "expense",
    "category": "Food",
    "date": "2026-01-08T15:24:00Z",
    "createdBy": "user_123",
    "familyId": "fam_123"
  }
}
```

---

### 20. Get Recent Activity

**Endpoint:** `GET /api/transactions/recent`

**Description:** Returns recent family activity (last 10 transactions).

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of activities to return (default: 10) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "recentActivity": [
      {
        "id": 1,
        "name": "Supermarket",
        "amount": -2400,
        "time": "Today 3:24 PM",
        "category": "Food",
        "type": "expense"
      }
    ]
  }
}
```

---

### 21. Delete Transaction

**Endpoint:** `DELETE /api/transactions/:id`

**Description:** Deletes a specific transaction.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

---

### 22. Get Family Balance

**Endpoint:** `GET /api/family/balance`

**Description:** Returns total family balance across all accounts.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 24580,
    "accountsCount": 3,
    "accounts": [
      {
        "id": 1,
        "name": "Main Account",
        "balance": 15000,
        "type": "bank"
      },
      {
        "id": 2,
        "name": "Savings",
        "balance": 8580,
        "type": "savings"
      },
      {
        "id": 3,
        "name": "M-Pesa",
        "balance": 1000,
        "type": "mobile_money"
      }
    ]
  }
}
```

**TypeScript Interface:**
```typescript
interface BalanceInfo {
  total: number;
  accountsCount: number;
  accounts?: Array<{
    id: number;
    name: string;
    balance: number;
    type: string;
  }>;
}
```

---

### 23. Get Analytics - Spending by Category

**Endpoint:** `GET /api/analytics/spending-by-category`

**Description:** Returns spending breakdown by category for a given period.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Start date (ISO 8601, default: start of month) |
| endDate | string | No | End date (ISO 8601, default: today) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "spendingByCategory": [
      {
        "category": "Food",
        "amount": 15000,
        "percentage": 30
      },
      {
        "category": "Transport",
        "amount": 8000,
        "percentage": 16
      },
      {
        "category": "Utilities",
        "amount": 6000,
        "percentage": 12
      }
    ],
    "totalSpent": 50000,
    "period": {
      "startDate": "2026-01-01",
      "endDate": "2026-01-08"
    }
  }
}
```

**TypeScript Interface:**
```typescript
interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
}

interface SpendingByCategoryResponse {
  success: boolean;
  data: {
    spendingByCategory: SpendingCategory[];
    totalSpent: number;
    period: {
      startDate: string;
      endDate: string;
    };
  };
}
```

---

### 24. Get Analytics - Income vs Expense

**Endpoint:** `GET /api/analytics/income-vs-expense`

**Description:** Returns monthly comparison of income and expenses.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| months | number | No | Number of months to include (default: 6) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "monthlyComparison": {
      "thisMonth": {
        "income": 45000,
        "expenses": 31000,
        "net": 14000
      },
      "lastMonth": {
        "income": 42000,
        "expenses": 35000,
        "net": 7000
      }
    },
    "trend": [
      {
        "month": "Jan 2026",
        "income": 45000,
        "expenses": 31000
      },
      {
        "month": "Dec 2025",
        "income": 42000,
        "expenses": 35000
      }
    ]
  }
}
```

**TypeScript Interface:**
```typescript
interface MonthlyComparison {
  thisMonth: {
    income: number;
    expenses: number;
    net: number;
  };
  lastMonth: {
    income: number;
    expenses: number;
    net: number;
  };
}

interface IncomeVsExpenseResponse {
  success: boolean;
  data: {
    monthlyComparison: MonthlyComparison;
    trend: Array<{
      month: string;
      income: number;
      expenses: number;
    }>;
  };
}
```

---

### 25. Get Analytics - Spending Trends

**Endpoint:** `GET /api/analytics/trends`

**Description:** Returns spending trends and insights over time.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| period | string | No | Time period: week, month, year (default: month) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "averageDaily": 1000,
    "averageWeekly": 7000,
    "averageMonthly": 31000,
    "topCategories": [
      {
        "category": "Food",
        "amount": 15000,
        "trend": "up"
      }
    ],
    "insights": [
      {
        "type": "warning",
        "message": "Food spending is 20% higher than last month"
      }
    ]
  }
}
```

---

## Enhanced TypeScript Interfaces for Dashboard

Add these interfaces to your types file:

```typescript
// Enhanced Dashboard Types
export interface TransactionItem {
  id: number;
  name: string;
  amount: number; // negative for expenses, positive for income
  date: string;
  time?: string;
  category: string;
  icon?: string;
  member?: string;
  type: 'income' | 'expense';
}

export interface BalanceInfo {
  total: number;
  accountsCount: number;
}

export interface BudgetProgressInfo {
  title: string;
  spent: number;
  remaining: number;
  progress: number;
}

export interface GoalProgressDetail {
  name: string;
  current: number;
  target: number;
  progress: number;
}

export interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlyComparison {
  thisMonth: {
    income: number;
    expenses: number;
  };
  lastMonth: {
    income: number;
    expenses: number;
  };
}

export interface CommunityMember {
  id: number;
  name: string;
  status: 'online' | 'offline';
  avatar: string | null;
  lastActive: string;
}

export interface Announcement {
  id: number;
  title: string;
  message: string;
  date: string;
  author: string;
}
```

---

## Expense Management API Endpoints

### 27. Get All Expenses

**Endpoint:** `GET /api/expenses`

**Description:** Returns all expense transactions for the family with optional filtering.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Filter by start date (ISO format) |
| endDate | string | No | Filter by end date (ISO format) |
| category | string | No | Filter by category |
| memberId | string | No | Filter by family member |
| source | string | No | Filter by payment source |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": 1,
        "description": "Vegetables",
        "amount": 1500,
        "time": "Just now",
        "category": "Food",
        "member": "David",
        "date": "2026-01-08",
        "source": "Cash",
        "splitWithFamily": false
      }
    ],
    "totalExpenses": 25780
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

---

### 28. Add New Expense

**Endpoint:** `POST /api/expenses`

**Description:** Creates a new expense transaction.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 1500,
  "category": "Food & Groceries",
  "source": "Cash",
  "paidBy": "David",
  "date": "2026-01-08T12:00:00Z",
  "description": "Vegetables from market",
  "splitWithFamily": false
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "expense": {
      "id": 1,
      "description": "Vegetables from market",
      "amount": 1500,
      "time": "Just now",
      "category": "Food & Groceries",
      "member": "David",
      "date": "2026-01-08",
      "source": "Cash",
      "splitWithFamily": false
    }
  },
  "message": "Expense added successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Amount is required and must be greater than 0"
  }
}
```

---

### 29. Update Expense

**Endpoint:** `PUT /api/expenses/:id`

**Description:** Updates an existing expense transaction.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Expense ID |

**Request Body:**
```json
{
  "amount": 2000,
  "category": "Food & Groceries",
  "source": "Mpesa",
  "paidBy": "David",
  "date": "2026-01-08T12:00:00Z",
  "description": "Updated description",
  "splitWithFamily": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "expense": {
      "id": 1,
      "description": "Updated description",
      "amount": 2000,
      "time": "Just now",
      "category": "Food & Groceries",
      "member": "David",
      "date": "2026-01-08",
      "source": "Mpesa",
      "splitWithFamily": true
    }
  },
  "message": "Expense updated successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Expense not found"
  }
}
```

---

### 30. Delete Expense

**Endpoint:** `DELETE /api/expenses/:id`

**Description:** Deletes an expense transaction.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Expense ID |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Expense not found"
  }
}
```

---

### 31. Get Expense Categories

**Endpoint:** `GET /api/expenses/categories`

**Description:** Returns all available expense categories.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      { "id": "1", "name": "Food & Groceries" },
      { "id": "2", "name": "Transport" },
      { "id": "3", "name": "Utilities" },
      { "id": "4", "name": "Entertainment" },
      { "id": "5", "name": "Healthcare" },
      { "id": "6", "name": "Education" },
      { "id": "7", "name": "Housing" },
      { "id": "8", "name": "Shopping" },
      { "id": "9", "name": "Other" }
    ]
  }
}
```

**TypeScript Interfaces:**
```typescript
export interface Expense {
  id: number;
  description: string;
  amount: number;
  time: string;
  category: string;
  member: string;
  date: string;
  source: string;
  splitWithFamily?: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}
```
