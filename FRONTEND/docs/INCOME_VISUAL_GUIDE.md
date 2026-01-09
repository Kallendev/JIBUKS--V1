# Income Management Screens - Visual Guide

## Screen Flow

```
┌─────────────────────────────────────┐
│        Dashboard Screen             │
│                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ │
│  │  🎁    │ │  💰    │ │   ⚙️   │ │
│  │Income  │ │Expense │ │ Manage │ │
│  └────────┘ └────────┘ └────────┘ │
│       ↓ (tap)                      │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│    Income List Screen               │
│ ┌───────────────────────────────┐   │
│ │ ← Income          🟢 Online  │   │ (Blue Gradient Header)
│ └───────────────────────────────┘   │
│                                     │
│ ┌─────┐ ┌────────┐ ┌──────────┐   │
│ │TIME │ │MEMBER  │ │CATEGORY  │   │ (Orange Border Filters)
│ └─────┘ └────────┘ └──────────┘   │
│                                     │
│ Total Income: 25,780   [+ Add]     │
│                                     │
│ Today                               │
│ ┌─────────────────────────────┐   │
│ │ Salary            25,000    │   │
│ │ Just now | Mpesa | David    │   │
│ │ Last synced: Just now       │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ Business             580    │   │
│ │ 2 hours ago | Cash | Sarah  │   │
│ │ Last synced: Just now       │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
                ↓ (tap + Add)
┌─────────────────────────────────────┐
│   Add Income Form Screen            │
│ ┌───────────────────────────────┐   │
│ │ ← Add Income                  │   │ (Blue Gradient Header)
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Amount                        │   │
│ │ KES 25,000                    │   │ (White Form Card)
│ ├───────────────────────────────┤   │
│ │ Category                      │   │
│ │ Salary               ▼        │   │
│ ├───────────────────────────────┤   │
│ │ Source                        │   │
│ │ Mpesa                ▼        │   │
│ ├───────────────────────────────┤   │
│ │ Received By                   │   │
│ │ David                ▼        │   │
│ ├───────────────────────────────┤   │
│ │ Date                          │   │
│ │ Today, Nov 2, 2023   📅       │   │
│ ├───────────────────────────────┤   │
│ │ Description                   │   │
│ │ November Salary               │   │
│ │                               │   │
│ ├───────────────────────────────┤   │
│ │ ☐ Split this income with     │   │
│ │   family                      │   │
│ ├───────────────────────────────┤   │
│ │    [  Add Income  ]           │   │ (Blue Button)
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Color Palette

```
HEADER GRADIENT
┌────────────────────┐
│  #1e3a8a → #2563eb │  (Blue gradient)
└────────────────────┘

ACCENT COLORS
┌─────────┐ ┌─────────┐ ┌─────────┐
│ #f59e0b │ │ #10b981 │ │ #2563eb │
│ Orange  │ │  Green  │ │  Blue   │
│ Titles  │ │ Income  │ │ Time    │
└─────────┘ └─────────┘ └─────────┘

BACKGROUNDS
┌─────────┐ ┌─────────┐ ┌─────────┐
│ #ffffff │ │ #f9fafb │ │ #e5e7eb │
│  White  │ │Lt Gray 1│ │Lt Gray 2│
│  Cards  │ │Page Bg  │ │ Borders │
└─────────┘ └─────────┘ └─────────┘
```

## Component Breakdown

### Income Card
```
┌────────────────────────────────────┐
│ Salary                     25,000  │ ← Category (bold) | Amount (large, green)
│ Just now | Mpesa | David           │ ← Time (blue) | Source | Member
│ Last synced: Just now              │ ← Sync status (gray, small)
└────────────────────────────────────┘
  ↑ Light gray background, rounded corners, subtle shadow
```

### Filter Dropdown
```
┌────────────┐
│ TIME    ▼  │ ← Orange border button
└────────────┘
     ↓ (when tapped)
┌────────────┐
│ Today      │ ← Active selection (orange text)
│ This Week  │
│ This Month │
│ All Time   │
└────────────┘
  ↑ White dropdown menu with shadow
```

### Form Input
```
┌────────────────────────────────────┐
│ Amount                             │ ← Label (gray, small)
│ KES 25,000                         │ ← Input field (large)
└────────────────────────────────────┘
  ↑ Border, rounded corners
```

## Interactive Elements

### Buttons
1. **Back Button**: Orange arrow icon, left side of header
2. **Add Button**: Blue rounded button with "+ Add" text
3. **Submit Button**: Full-width blue button at bottom of form
4. **Filter Buttons**: Orange border, white background, dropdown icon

### Dropdowns
- Click to open/close
- Only one dropdown open at a time
- Orange text for selected option
- White background with shadow overlay

### Checkboxes
- Square with rounded corners
- Blue checkmark when selected
- Label text next to checkbox

## Typography

```
Header Title:     20px, Bold, Orange (#f59e0b)
Section Header:   16px, Semi-bold, Gray (#6b7280)
Card Category:    16px, Bold, Dark Gray (#1f2937)
Card Amount:      20px, Bold, Green (#10b981)
Card Details:     12px, Regular, Blue/Gray
Total Income:     18px, Bold, Dark Gray
Button Text:      14-16px, Semi-bold, White
Form Label:       14px, Semi-bold, Dark Gray
Form Input:       16px, Regular, Dark Gray
```

## Spacing & Layout

```
HEADER
- Padding: 20px horizontal, 20px top, 16px bottom
- Height: Auto (content-based)

CONTENT SECTIONS
- Padding: 20px horizontal
- Margin between sections: 16-20px

CARDS
- Border radius: 16px
- Padding: 16px
- Margin bottom: 12px
- Shadow: elevation 2-3

FORM CARD
- Border radius: 24px (top only)
- Padding: 24px horizontal, 24px top, 40px bottom
- Input spacing: 20px between fields
```

## State Management

### Income Screen States
```typescript
- incomes: Income[]           // List of income transactions
- selectedTime: string        // Selected time filter
- selectedMember: string      // Selected member filter
- selectedCategory: string    // Selected category filter
- showXDropdown: boolean      // Dropdown visibility states
- refreshing: boolean         // Pull-to-refresh state
```

### Add Income Form States
```typescript
- amount: string              // Numeric input
- category: string            // Selected category
- source: string              // Selected source
- receivedBy: string          // Selected member
- date: Date                  // Selected date
- description: string         // Optional text
- splitWithFamily: boolean    // Checkbox state
- showXDropdown: boolean      // Dropdown visibility states
```

## Validation Rules

### Amount Field
- ✅ Required
- ✅ Must be numeric
- ✅ Must be greater than 0
- ❌ Cannot be empty or negative

### Other Fields
- Category: Required (default: "Salary")
- Source: Required (default: "Mpesa")
- Received By: Required (default: current user)
- Date: Required (default: today)
- Description: Optional
- Split With Family: Optional (default: false)

## Navigation Patterns

```
Dashboard → Income List
  router.push('/income')

Income List → Add Income
  router.push('/add-income')

Add Income → Income List (after success)
  router.back()

Any Screen → Previous Screen
  router.back()
```

## Accessibility Considerations

- ✅ Touch targets minimum 44x44 pixels
- ✅ Color contrast ratios meet WCAG AA standards
- ✅ Clear visual feedback for interactive elements
- ✅ Error messages displayed with alerts
- ⚠️ Screen reader labels (should be added)
- ⚠️ Keyboard navigation (mobile-specific)

## Performance Considerations

- ✅ Uses mock data for instant loading
- ✅ Pull-to-refresh for data updates
- ⚠️ No pagination (will be needed for large datasets)
- ⚠️ No lazy loading of images
- ⚠️ No debouncing on search/filter (if added)

## Future Enhancements

1. **Income Analytics**
   - Monthly income trends chart
   - Category breakdown pie chart
   - Year-over-year comparison

2. **Advanced Filtering**
   - Date range picker
   - Multiple category selection
   - Amount range filter
   - Search by description

3. **Bulk Operations**
   - Multi-select for delete
   - Export to CSV/PDF
   - Import from spreadsheet

4. **Rich Media**
   - Attach receipt photos
   - Voice memo descriptions
   - Document attachments

5. **Smart Features**
   - Recurring income setup
   - Income predictions
   - Category auto-detection
   - Bank sync integration
