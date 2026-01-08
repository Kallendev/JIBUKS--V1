/**
 * TypeScript Type Definitions for Family Dashboard
 * JIBUKS App - Family Finance Management
 */

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  avatarUrl?: string;
  phoneNumber?: string;
  joinedAt: string;
}

export interface FamilyGoal {
  id: string;
  name: string;
  description?: string;
  target: number;
  current: number;
  deadline: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  month: string;
  year: number;
}

export interface FamilyDashboard {
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

export interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description?: string;
  date: string;
  createdBy: string;
  familyId: string;
}

export interface QuickStat {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

export interface GoalProgress {
  goalId: string;
  percentage: number;
  status: 'on-track' | 'behind' | 'completed';
}

export interface BudgetProgress {
  categoryId: string;
  percentage: number;
  status: 'safe' | 'warning' | 'exceeded';
}

// Family Settings Types
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
