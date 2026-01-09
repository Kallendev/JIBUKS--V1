# Income Management API Documentation

## Overview
This document defines the API endpoints for the Income Management feature in the JIBUKS app.

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

### 1. Get All Income Transactions

**Endpoint:** `GET /api/income`

**Description:** Returns all income transactions for the family with optional filtering.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Filter by start date (ISO 8601) |
| endDate | string | No | Filter by end date (ISO 8601) |
| category | string | No | Filter by income category |
| memberId | string | No | Filter by family member |
| source | string | No | Filter by income source |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "incomes": [
      {
        "id": 1,
        "category": "Salary",
        "amount": 25000,
        "time": "Just now",
        "source": "Mpesa",
        "member": "David",
        "date": "2026-01-08",
        "description": "January Salary",
        "splitWithFamily": false,
        "createdAt": "2026-01-08T10:00:00Z",
        "updatedAt": "2026-01-08T10:00:00Z"
      }
    ],
    "totalIncome": 25580,
    "count": 2
  }
}
```

---

### 2. Add New Income

**Endpoint:** `POST /api/income`

**Description:** Adds a new income transaction for the family.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 25000,
  "category": "Salary",
  "source": "Mpesa",
  "receivedBy": "David",
  "date": "2026-01-08T10:00:00Z",
  "description": "January Salary",
  "splitWithFamily": false
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "category": "Salary",
    "amount": 25000,
    "source": "Mpesa",
    "member": "David",
    "date": "2026-01-08",
    "description": "January Salary",
    "splitWithFamily": false,
    "createdAt": "2026-01-08T10:00:00Z"
  },
  "message": "Income added successfully"
}
```

---

### 3. Update Income

**Endpoint:** `PUT /api/income/:id`

**Description:** Updates an existing income transaction.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 26000,
  "category": "Salary",
  "source": "Bank",
  "receivedBy": "David",
  "date": "2026-01-08T10:00:00Z",
  "description": "Updated January Salary",
  "splitWithFamily": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "category": "Salary",
    "amount": 26000,
    "source": "Bank",
    "member": "David",
    "date": "2026-01-08",
    "description": "Updated January Salary",
    "splitWithFamily": true,
    "updatedAt": "2026-01-08T11:00:00Z"
  },
  "message": "Income updated successfully"
}
```

---

### 4. Delete Income

**Endpoint:** `DELETE /api/income/:id`

**Description:** Deletes an income transaction.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Income deleted successfully"
}
```

---

### 5. Get Income Categories

**Endpoint:** `GET /api/income/categories`

**Description:** Returns all available income categories.

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
      { "id": "1", "name": "Salary" },
      { "id": "2", "name": "Business" },
      { "id": "3", "name": "Investment" },
      { "id": "4", "name": "Gift" },
      { "id": "5", "name": "Other" }
    ]
  }
}
```

---

### 6. Get Income Sources

**Endpoint:** `GET /api/income/sources`

**Description:** Returns all available income sources.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "sources": [
      { "id": "1", "name": "Mpesa" },
      { "id": "2", "name": "Bank" },
      { "id": "3", "name": "Cash" },
      { "id": "4", "name": "Airtel Money" },
      { "id": "5", "name": "Other" }
    ]
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": ["amount must be a positive number"]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Income transaction not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Notes

- All amounts are in Kenyan Shillings (KES)
- Dates are in ISO 8601 format
- The `splitWithFamily` flag determines if the income should be distributed among family members
- Income transactions are automatically associated with the authenticated user's family
- TODO: Implement actual backend endpoints
- TODO: Add pagination for income list
- TODO: Add income analytics endpoints
